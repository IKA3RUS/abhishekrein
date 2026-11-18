/**
 * Forked from @react-three/drei's Cloud/Clouds components.
 */
import {
  type RefObject,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useTexture } from "@react-three/drei";
import {
  type ThreeElement,
  type ThreeElements,
  extend,
  useFrame,
} from "@react-three/fiber";
import {
  type BufferAttribute,
  type Camera,
  Color,
  DynamicDrawUsage,
  type Group,
  type InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type WebGLRenderTarget,
  type WebGLRenderer,
} from "three";

import { CloudSegmentMaterial } from "./CloudSegmentMaterial";
import type { CloudCut } from "./hooks/useCloudCut";
import { CLOUD_URL, eddyAt, gustAt } from "./utils";

extend({ CloudSegmentMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    cloudSegmentMaterial: ThreeElement<typeof CloudSegmentMaterial>;
  }
}

type Segment = {
  /** Id of the owning cloud */
  uuid: string;
  /** Group of the owning cloud */
  ref: RefObject<Group | null>;
  /** Rest position within the cloud's bounds */
  position: Vector3;
  /** Half-extents of the owning cloud */
  bounds: Vector3;
  /** Base size */
  volume: number;
  /** Rate of growth and spin */
  speed: number;
  /** Base opacity */
  opacity: number;
  /** Camera distance at which the segment starts to fade */
  fade: number;
  /** Frequency factor of the growth */
  density: number;
  /** Spin angle about the view axis */
  rotation: number;
  /** Spin rate */
  rotationFactor: number;
  /** Drift speed along x */
  wind: number;
  /** Distance carried by the wind along x, wrapped within the bounds */
  windOffset: number;
  /** Vertical displacement by eddies */
  lift: number;
  /** Opacity factor near the wrap edges */
  edge: number;
  /** Distance to the camera, for depth sorting */
  dist: number;
  /** Instance matrix for the current frame */
  matrix: Matrix4;
};

export type CloudsProps = ThreeElements["group"] & {
  /** Screen-space field that carves the clouds, from useCloudCut */
  cutRef?: RefObject<CloudCut>;
  /** Share by which gusts raise or lower the wind speed. Default: 0 */
  gust?: number;
  /** Strength of the eddy field. Default: 0 */
  turbulence?: number;
  /** Target that receives the removed cloud each frame, for CloudBeams */
  openings?: WebGLRenderTarget;
};

export type CloudProps = Omit<ThreeElements["group"], "ref"> & {
  /** Seed for the segment layout */
  seed: number;
  /** Number of segments. Default: 20 */
  segments?: number;
  /** Half-extents of the box the segments are placed in. Default: [5, 1, 1] */
  bounds?: [number, number, number];
  /** Segment size. Segments near the bounds are larger. Default: 6 */
  volume?: number;
  /** Rate of the segments' growth and spin. Default: 0 */
  speed?: number;
  /** Camera distance at which segments start to fade. Default: 10 */
  fade?: number;
  /** Opacity. Default: 1 */
  opacity?: number;
  /** Drift speed along x in local units per second. Default: 0 */
  wind?: number;
};

const parentMatrix = new Matrix4();
const translation = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3();
const cameraPosition = new Vector3();
const cameraQuaternion = new Quaternion();
const offset = new Vector3();
const flow = new Vector3();
const spin = new Quaternion();
const viewAxis = new Vector3(0, 0, 1);
const clearColor = new Color();

/**
 * Writes the segment's offset within its cloud into out, wrapped within the
 * bounds along x, and updates its edge fade.
 */
function wrapSegment(segment: Segment, flowing: boolean, out: Vector3) {
  out.copy(segment.position);
  out.y += segment.lift;
  segment.edge = 1;
  if (!flowing) return out;

  const half = segment.bounds.x;
  const span = half * 2;
  out.x = ((((out.x + segment.windOffset + half) % span) + span) % span) - half;
  // Fades over the outer quarter of the half-width
  segment.edge = Math.min((half - Math.abs(out.x)) / (half * 0.25), 1);
  return out;
}

/** Advances the segment's drift by the flow at its world position. */
function advanceDrift(
  segment: Segment,
  position: Vector3,
  t: number,
  delta: number,
  gust: number,
  turbulence: number,
) {
  eddyAt(position.x, position.y, t, segment.wind, flow).multiplyScalar(
    turbulence,
  );
  const u = segment.wind * gustAt(position.x, t, gust) + flow.x;
  segment.windOffset =
    (segment.windOffset + u * delta) % (segment.bounds.x * 2);
  // Settles back to its altitude after an eddy lifts it
  segment.lift += (flow.y - segment.lift * 0.35) * delta;
}

/** Draws the cloud removed by the cut field into the target. */
function renderOpenings(
  gl: WebGLRenderer,
  mesh: InstancedMesh,
  camera: Camera,
  target: WebGLRenderTarget,
  material: CloudSegmentMaterial,
) {
  const previousTarget = gl.getRenderTarget();
  const previousAlpha = gl.getClearAlpha();
  gl.getClearColor(clearColor);

  material.setOpeningsPass(true);
  gl.setRenderTarget(target);
  gl.setClearColor(0x000000, 0);
  gl.clear();
  gl.render(mesh, camera);
  material.setOpeningsPass(false);

  gl.setRenderTarget(previousTarget);
  gl.setClearColor(clearColor, previousAlpha);
}

const SegmentsContext = createContext<RefObject<Segment[]>>(null!);

/** Draws the segments of every child <Cloud> as one instanced mesh. */
export function Clouds({
  children,
  cutRef,
  gust = 0,
  turbulence = 0,
  openings,
  ...props
}: CloudsProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const segments = useRef<Segment[]>([]);
  // Per-instance opacity. Its length is the instanced mesh's capacity.
  const [opacities] = useState(() => new Float32Array(200).fill(1));
  const texture = useTexture(CLOUD_URL);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    parentMatrix.copy(mesh.matrixWorld).invert();
    state.camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, scale);

    for (const segment of segments.current) {
      const flowing = segment.wind !== 0 || turbulence !== 0;
      segment.ref.current!.matrixWorld.decompose(translation, rotation, scale);
      wrapSegment(segment, flowing, offset);
      translation.add(offset.applyQuaternion(rotation).multiply(scale));
      if (flowing) {
        advanceDrift(segment, translation, t, delta, gust, turbulence);
      }

      // Faces the camera and spins slowly about the view axis
      segment.rotation += delta * segment.rotationFactor;
      rotation
        .copy(cameraQuaternion)
        .multiply(spin.setFromAxisAngle(viewAxis, segment.rotation));
      // Breathes by 0.5 units around its size at load. A wider swing packs
      // the puffs into a flat band at its peak and thins them out at its low.
      scale.multiplyScalar(
        segment.volume +
          2 +
          Math.sin(t * segment.density * segment.speed) * 0.5,
      );
      segment.matrix
        .compose(translation, rotation, scale)
        .premultiply(parentMatrix);
      segment.dist = translation.distanceTo(cameraPosition);
    }

    // Draws back to front, since instances have no inherent order
    segments.current.sort((a, b) => b.dist - a.dist);
    const opacity = mesh.geometry.attributes.cloudOpacity as BufferAttribute;
    segments.current.forEach((segment, index) => {
      const near = segment.dist < segment.fade - 1;
      opacity.setX(
        index,
        segment.opacity *
          segment.edge *
          (near ? segment.dist / segment.fade : 1),
      );
      mesh.setMatrixAt(index, segment.matrix);
    });
    opacity.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;

    const material = mesh.material as CloudSegmentMaterial;
    material.setCutMap(cutRef?.current.value);
    // Nothing is removed while the field is clear
    if (openings && cutRef?.current.active !== false) {
      renderOpenings(state.gl, mesh, state.camera, openings, material);
    }
  });

  // Draws and uploads only the registered segments
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const count = segments.current.length;
    const opacity = mesh.geometry.attributes.cloudOpacity as BufferAttribute;
    mesh.count = count;
    mesh.instanceMatrix.clearUpdateRanges();
    mesh.instanceMatrix.addUpdateRange(0, count * 16);
    opacity.clearUpdateRanges();
    opacity.addUpdateRange(0, count);
  });

  const image = texture.image as { width?: number; height?: number };
  const imageWidth = image.width ?? 1;
  const imageHeight = image.height ?? 1;
  const max = Math.max(imageWidth, imageHeight);

  return (
    <group {...props}>
      <SegmentsContext.Provider value={segments}>
        {children}
        <instancedMesh
          ref={meshRef}
          matrixAutoUpdate={false}
          args={[undefined, undefined, opacities.length]}
        >
          <planeGeometry args={[imageWidth / max, imageHeight / max]}>
            <instancedBufferAttribute
              usage={DynamicDrawUsage}
              attach="attributes-cloudOpacity"
              args={[opacities, 1]}
            />
          </planeGeometry>
          <cloudSegmentMaterial map={texture} transparent depthWrite={false} />
        </instancedMesh>
      </SegmentsContext.Provider>
    </group>
  );
}

/** A cloud of segments, drawn by the enclosing <Clouds>. */
export function Cloud({
  seed,
  segments: count = 20,
  bounds = [5, 1, 1],
  volume = 6,
  speed = 0,
  fade = 10,
  opacity = 1,
  wind = 0,
  ...props
}: CloudProps) {
  const parent = useContext(SegmentsContext);
  const groupRef = useRef<Group>(null);
  const uuid = useId();

  const segments = useMemo(
    () =>
      Array.from(
        { length: count },
        (_, index): Segment => ({
          uuid,
          ref: groupRef,
          position: new Vector3(),
          bounds: new Vector3(1, 1, 1),
          volume: 0,
          speed: 0,
          opacity: 1,
          fade: 0,
          density: 0,
          rotation: index * (Math.PI / count),
          rotationFactor: 0,
          wind: 0,
          windOffset: 0,
          lift: 0,
          edge: 1,
          dist: 0,
          matrix: new Matrix4(),
        }),
      ),
    [count, uuid],
  );

  // Places the segments randomly within the bounds, larger towards the edges
  useLayoutEffect(() => {
    let localSeed = seed;
    function random() {
      const x = Math.sin(localSeed++) * 10000;
      return x - Math.floor(x);
    }

    for (const segment of segments) {
      segment.speed = speed;
      segment.opacity = opacity;
      segment.fade = fade;
      segment.wind = wind;
      segment.density = Math.max(0.5, random());
      segment.rotationFactor = Math.max(0.2, 0.5 * random()) * speed;
      segment.bounds.set(...bounds);
      segment.position
        .set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1)
        .multiply(segment.bounds);

      // Reach toward the bounds along the axis of largest offset, 1 at the bounds
      const x = Math.abs(segment.position.x);
      const y = Math.abs(segment.position.y);
      const z = Math.abs(segment.position.z);
      const largest = Math.max(x, y, z);
      let reach = 0;
      if (x === largest) reach += x / segment.bounds.x;
      if (y === largest) reach += y / segment.bounds.y;
      if (z === largest) reach += z / segment.bounds.z;
      segment.volume = Math.max(0.25, reach) * volume;
    }
  }, [segments, seed, bounds, volume, speed, fade, opacity, wind]);

  useLayoutEffect(() => {
    parent.current = [...parent.current, ...segments];
    return () => {
      parent.current = parent.current.filter((item) => item.uuid !== uuid);
    };
  }, [parent, segments, uuid]);

  return <group ref={groupRef} {...props} />;
}
