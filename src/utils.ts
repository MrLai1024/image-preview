export function isImportModule(lineText: string) {
  return (
    lineText.indexOf("import") !== -1 || lineText.indexOf("require") !== -1
  );
}
