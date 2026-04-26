import { kebabCase } from "change-case";

function extractText(node: any): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (node.children) return (node.children as any[]).map(extractText).join("");
  return "";
}

function walk(node: any, fn: (node: any) => void): void {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
}

export function addHeadingLinks(mdast: any): void {
  walk(mdast, (node) => {
    if (node.type !== "heading") return;

    const text = extractText(node);
    const id = kebabCase(text);

    node.data ??= {};
    node.data.hProperties ??= {};
    node.data.hProperties.id = id;

    node.children = [
      {
        type: "link",
        url: `#${id}`,
        title: null,
        children: node.children,
      },
    ];
  });
}
