import {
  DataTexture,
  MeshBasicMaterial,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from "three";

import cloudParsFragmentShader from "./shaders/cloud-pars.fragment.glsl?raw";
import cloudParsVertexShader from "./shaders/cloud-pars.vertex.glsl?raw";
import cloudFragmentShader from "./shaders/cloud.fragment.glsl?raw";
import cloudVertexShader from "./shaders/cloud.vertex.glsl?raw";

// Bound when no cut field is given so the shader never samples a null texture
function createEmptyCutMap() {
  const texture = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  texture.needsUpdate = true;
  return texture;
}
const emptyCutMap = createEmptyCutMap();

/**
 * MeshBasicMaterial with per-instance opacity, erosion by the cut field, and
 * an openings pass that draws the eroded alpha instead.
 */
export class CloudSegmentMaterial extends MeshBasicMaterial {
  cloudUniforms = {
    cutMap: { value: emptyCutMap as Texture },
    openingsPass: { value: 0 },
  };

  setCutMap(texture: Texture | undefined) {
    this.cloudUniforms.cutMap.value = texture ?? emptyCutMap;
  }

  setOpeningsPass(enabled: boolean) {
    this.cloudUniforms.openingsPass.value = enabled ? 1 : 0;
  }

  onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
    Object.assign(shader.uniforms, this.cloudUniforms);
    shader.vertexShader =
      cloudParsVertexShader +
      shader.vertexShader.replace(
        "#include <fog_vertex>",
        `#include <fog_vertex>\n${cloudVertexShader}`,
      );
    shader.fragmentShader =
      cloudParsFragmentShader +
      shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>\n${cloudFragmentShader}`,
      );
  }
}
