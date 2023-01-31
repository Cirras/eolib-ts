import * as fs from "fs";

export function findFiles(directory: string, predicate: (file: string) => {}) {
  let files = new Array<string>();
  const items = fs.readdirSync(directory, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = [...files, ...findFiles(`${directory}/${item.name}`, predicate)];
    } else {
      const file = `${directory}/${item.name}`;
      if (predicate(file)) {
        files.push(file);
      }
    }
  }

  return files;
}
