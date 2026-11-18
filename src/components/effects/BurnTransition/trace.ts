/**
 * Traces the burnt area of a mask read back with readPixels, as SVG path data
 * in CSS px for an evenodd clip-path. Outlines pass where the mask crosses
 * 0.5. Rows run from the bottom, as readPixels returns them.
 */
function traceMask(
  pixels: Uint8Array,
  width: number,
  height: number,
  cell: number,
) {
  // Pads the grid by two points on each side. The inner ring repeats the
  // edge and the outer ring is unburnt, so outlines close off-screen.
  const columns = width + 4;
  const rows = height + 4;
  const grid = new Float32Array(columns * rows);
  for (let j = 1; j < rows - 1; j++) {
    const row = Math.min(Math.max(j - 2, 0), height - 1);
    for (let i = 1; i < columns - 1; i++) {
      const column = Math.min(Math.max(i - 2, 0), width - 1);
      grid[j * columns + i] = pixels[(row * width + column) * 4];
    }
  }

  // Each crossing lies on a grid edge. Even keys are horizontal edges and
  // odd keys vertical ones, both starting at the point key >> 1.
  const links = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ]) {
      const ends = links.get(from);
      if (ends) ends.push(to);
      else links.set(from, [to]);
    }
  };

  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < columns - 1; i++) {
      const index = j * columns + i;
      // Corners anticlockwise from the bottom left
      const corners = [
        grid[index] > 127.5,
        grid[index + 1] > 127.5,
        grid[index + columns + 1] > 127.5,
        grid[index + columns] > 127.5,
      ];
      // Edges anticlockwise from the bottom. Corner k lies between edges
      // k - 1 and k.
      const edges = [
        index * 2,
        (index + 1) * 2 + 1,
        (index + columns) * 2,
        index * 2 + 1,
      ];
      const crossed = [0, 1, 2, 3].filter(
        (k) => corners[k] !== corners[(k + 1) % 4],
      );
      if (crossed.length === 2) {
        link(edges[crossed[0]], edges[crossed[1]]);
      } else if (crossed.length === 4) {
        // A saddle. Cuts off the two corners that differ from the centre.
        const centre =
          (grid[index] +
            grid[index + 1] +
            grid[index + columns + 1] +
            grid[index + columns]) /
            4 >
          127.5;
        for (let k = 0; k < 4; k++) {
          if (corners[k] !== centre) link(edges[(k + 3) % 4], edges[k]);
        }
      }
    }
  }

  const point = (key: number) => {
    const index = key >> 1;
    const vertical = key & 1;
    const a = grid[index];
    const b = grid[vertical ? index + columns : index + 1];
    const t = (127.5 - a) / (b - a);
    const i = (index % columns) + (vertical ? 0 : t);
    const j = Math.floor(index / columns) + (vertical ? t : 0);
    const x = (i - 1.5) * cell;
    const y = window.innerHeight - (j - 1.5) * cell;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };

  let path = "";
  const visited = new Set<number>();
  for (const start of links.keys()) {
    if (visited.has(start)) continue;
    let previous = -1;
    let current = start;
    path += `M${point(start)}`;
    do {
      visited.add(current);
      const [first, second] = links.get(current)!;
      const next = first !== previous ? first : second;
      previous = current;
      current = next;
      if (current !== start) path += `L${point(current)}`;
    } while (current !== start && !visited.has(current));
    path += "Z";
  }
  return path;
}

export { traceMask };
