import { type RefObject, useEffect, useRef } from "react";

import { useFBO } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  type Texture,
  Vector2,
} from "three";

import { useViewportPosition } from "@/hooks/useViewportPosition";
import { usePointer } from "@/hooks/usePointer";

import cutFragmentShader from "../shaders/cut.fragment.glsl?raw";
import fullscreenVertexShader from "../shaders/fullscreen.vertex.glsl?raw";

export type CloudCutOptions = {
  /** Half-width of the cut as a fraction of the canvas height. Default: 0.05 */
  radius?: number;
  /** Seconds for a cut to mostly close again. Default: 3 */
  heal?: number;
  /** Pointer speed in canvas heights per second for a full cut. Default: 0.8 */
  speed?: number;
};

export type CloudCut = {
  /** Current field texture */
  value: Texture;
  /** False once every cut has healed, so consumers can skip their work */
  active: boolean;
};

type Simulation = {
  scene: Scene;
  camera: OrthographicCamera;
  material: ShaderMaterial;
};

function createSimulation(): Simulation {
  const material = new ShaderMaterial({
    vertexShader: fullscreenVertexShader,
    fragmentShader: cutFragmentShader,
    uniforms: {
      uPrev: { value: null },
      uTexel: { value: new Vector2() },
      uFrom: { value: new Vector2() },
      uTo: { value: new Vector2() },
      uAspect: { value: 1 },
      uRadius: { value: 0 },
      uStrength: { value: 0 },
      uDecay: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  return { scene, camera: new OrthographicCamera(), material };
}

/**
 * Tracks the pointer over the canvas and returns a screen-space field of where
 * it has recently passed. Pass it to <Clouds cutRef> to carve the clouds.
 */
export function useCloudCut({
  radius = 0.025,
  heal = 10,
  speed = 0.8,
}: CloudCutOptions = {}): RefObject<CloudCut> {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  // The field is kept at a quarter of the canvas resolution
  const width = Math.max(1, Math.round(size.width * 0.25));
  const height = Math.max(1, Math.round(size.height * 0.25));

  const options = {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  };
  const targetA = useFBO(width, height, options);
  const targetB = useFBO(width, height, options);
  // Ping-pong pair, swapped after each step. Reset when the targets resize.
  const targets = useRef([targetA, targetB]);
  useEffect(() => {
    targets.current = [targetA, targetB];
  }, [targetA, targetB]);

  const cutRef = useRef<CloudCut>({ value: targetA.texture, active: false });
  // Seconds since the last stroke
  const quiet = useRef(Infinity);

  const simulationRef = useRef<Simulation | null>(null);
  useEffect(() => {
    const simulation = createSimulation();
    simulationRef.current = simulation;
    return () => {
      simulationRef.current = null;
      simulation.material.dispose();
      (simulation.scene.children[0] as Mesh).geometry.dispose();
    };
  }, []);

  const pointer = usePointer();
  const canvasRect = useViewportPosition(useRef(gl.domElement));
  const last = useRef<Vector2 | null>(null);
  const uv = useRef(new Vector2());

  useFrame((_, delta) => {
    const simulation = simulationRef.current;
    if (!simulation) return;
    const uniforms = simulation.material.uniforms;
    const cut = cutRef.current;
    const position = uv.current;
    const [read, write] = targets.current;

    let strength = 0;
    const rect = canvasRect.current;
    if (pointer.current && rect) {
      position.set(
        (pointer.current.x - rect.left) / rect.width,
        1 - (pointer.current.y - rect.top) / rect.height,
      );
      const from = last.current ?? position;
      const aspect = rect.width / rect.height;
      const travelled = Math.hypot(
        (position.x - from.x) * aspect,
        position.y - from.y,
      );
      strength = Math.min(travelled / Math.max(delta, 1e-3) / speed, 1);

      uniforms.uFrom.value.copy(from);
      uniforms.uTo.value.copy(position);
      uniforms.uAspect.value = aspect;
      last.current = (last.current ?? new Vector2()).copy(position);
    } else {
      last.current = null;
    }

    // Skips the simulation two healing periods after the last stroke, once the
    // field has cleared
    quiet.current = strength > 0 ? 0 : quiet.current + delta;
    cut.active = quiet.current < heal * 2;
    if (!cut.active) return;

    uniforms.uPrev.value = read.texture;
    uniforms.uTexel.value.set(1 / width, 1 / height);
    uniforms.uRadius.value = radius;
    uniforms.uStrength.value = strength;
    uniforms.uDecay.value = Math.exp((-3 * delta) / heal);

    const previous = gl.getRenderTarget();
    gl.setRenderTarget(write);
    gl.render(simulation.scene, simulation.camera);
    gl.setRenderTarget(previous);

    targets.current = [write, read];
    cut.value = write.texture;
  });

  return cutRef;
}
