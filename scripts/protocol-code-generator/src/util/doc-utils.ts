import { CodeBlock } from "../generate/code-block";

export function generateTsDoc(
  protocolComment: string,
  notes: string[] = []
): CodeBlock {
  let lines: string[] = [];

  if (protocolComment) {
    lines.push(
      ...escapeHtml(protocolComment)
        .trim()
        .replace(/\n/g, "\n<br>\n")
        .split("\n")
        .map((line) => line.trim())
    );
  }

  if (notes.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }

    lines.push("@remarks");
    lines.push("<ul>");
    notes
      .map((line) => `  <li>${line}</li>`)
      .forEach((line) => lines.push(line));
    lines.push("</ul>");
  }

  const result = new CodeBlock();
  if (lines.length > 0) {
    result.add(`/**\n * ${lines.join("\n * ")}\n */\n`);
  }
  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
