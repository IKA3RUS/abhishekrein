import { kebabCase } from "change-case";

export type TocHeading = {
  text: string;
  level: number;
  id: string;
};

export type TocSection = {
  section: string;
  headings: TocHeading[];
};

export type Toc = TocSection[];

function extractText(node: any): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (node.children) return (node.children as any[]).map(extractText).join("");
  return "";
}

export function extractToc(mdast: any): Toc {
  const toc: Toc = [];

  for (const node of mdast.children ?? []) {
    if (node.type !== "mdxJsxFlowElement" || node.name !== "Section") continue;

    const idAttr = (node.attributes ?? []).find(
      (a: any) => a.type === "mdxJsxAttribute" && a.name === "id",
    );
    if (!idAttr || typeof idAttr.value !== "string") continue;

    const section = idAttr.value as string;
    const headings: TocHeading[] = [];

    for (const child of node.children ?? []) {
      if (child.type !== "heading") continue;
      const text = extractText(child);
      headings.push({ text, level: child.depth, id: kebabCase(text) });
    }

    toc.push({ section, headings });
  }

  return toc;
}
