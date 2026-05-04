function transformChildren(children: any[]): void {
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type === "blockquote") {
      const transformed = tryTransformBlockquote(node);
      if (transformed) {
        children[i] = transformed;
        continue;
      }
    }
    transformChildren(node.children ?? []);
  }
}

function tryTransformBlockquote(node: any): any | null {
  const blockquoteChildren: any[] = [...node.children];
  if (!blockquoteChildren.length) return null;

  const lastChild = blockquoteChildren[blockquoteChildren.length - 1];
  if (lastChild.type !== "paragraph") return null;

  const paragraphChildren: any[] = [...lastChild.children];
  if (!paragraphChildren.length) return null;

  const lastTextNode = paragraphChildren[paragraphChildren.length - 1];
  if (lastTextNode.type !== "text") return null;

  const lines = lastTextNode.value.split("\n");
  const lastLine = lines[lines.length - 1];
  const match = lastLine.match(/^---\s+(.+)$/);
  if (!match) return null;

  const attribution = match[1].trim();

  const remainingLines = lines.slice(0, -1);
  while (remainingLines.length && !remainingLines[remainingLines.length - 1].trim()) {
    remainingLines.pop();
  }

  if (remainingLines.length === 0) {
    paragraphChildren.pop();
    if (paragraphChildren.length === 0) {
      blockquoteChildren.pop();
    } else {
      blockquoteChildren[blockquoteChildren.length - 1] = {
        ...lastChild,
        children: paragraphChildren,
      };
    }
  } else {
    blockquoteChildren[blockquoteChildren.length - 1] = {
      ...lastChild,
      children: [
        ...paragraphChildren.slice(0, -1),
        { ...lastTextNode, value: remainingLines.join("\n") },
      ],
    };
  }

  return {
    type: "mdxJsxFlowElement",
    name: "figure",
    attributes: [],
    children: [
      {
        type: "blockquote",
        children: blockquoteChildren,
      },
      {
        type: "mdxJsxFlowElement",
        name: "figcaption",
        attributes: [],
        children: [
          {
            type: "mdxJsxFlowElement",
            name: "cite",
            attributes: [],
            children: [{ type: "text", value: attribution }],
          },
        ],
      },
    ],
  };
}

export function addBlockquoteCite(mdast: any): void {
  transformChildren(mdast.children ?? []);
}
