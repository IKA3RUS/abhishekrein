import fragmentShader from "./shaders/fragment.glsl?raw";
import vertexShader from "./shaders/vertex.glsl?raw";
import { resolveColor } from "./utils";

const CELL = 2; // Dither cell in CSS px. Matches the hero Dither pass.

type Mode = "fill" | "frontier" | "mask";
const MODES: Record<Mode, number> = { fill: 0, frontier: 1, mask: 2 };

/** Creates a WebGL renderer for the dissolve on the canvas. Returns null without WebGL. */
function createReveal(canvas: HTMLCanvasElement, mode: Mode, scale = 1) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // Draws a single triangle that covers the viewport.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    cover: gl.getUniformLocation(program, "cover"),
    time: gl.getUniformLocation(program, "time"),
    seed: gl.getUniformLocation(program, "seed"),
    scale: gl.getUniformLocation(program, "scale"),
    mode: gl.getUniformLocation(program, "mode"),
    fill: gl.getUniformLocation(program, "fill"),
    frontier: gl.getUniformLocation(program, "frontier"),
  };

  gl.uniform1f(uniforms.scale, scale);
  gl.uniform1f(uniforms.mode, MODES[mode]);
  gl.uniform3fv(uniforms.fill, resolveColor("--color-white"));
  gl.uniform3fv(uniforms.frontier, resolveColor("--color-yellow-4"));

  return {
    setMode(next: Mode) {
      gl.uniform1f(uniforms.mode, MODES[next]);
    },
    setSeed(seed: number) {
      gl.uniform1f(uniforms.seed, seed);
    },
    draw(cover: number, time: number) {
      const width = Math.ceil(window.innerWidth / (CELL * scale));
      const height = Math.ceil(window.innerHeight / (CELL * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.cover, cover);
      gl.uniform1f(uniforms.time, time / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    clear() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
  };
}

type Reveal = NonNullable<ReturnType<typeof createReveal>>;

export { createReveal, type Reveal };
