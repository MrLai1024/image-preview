import path from "path";
import vscode, {
  ExtensionContext,
  Position,
  TextDocument,
  Hover,
  MarkdownString,
} from "vscode";
import {
  isImportModule,
  fetchImgInfo,
  isCompleteHttpUrl,
  extractImportPath,
  extractAbsolutePath,
  getFileText,
  isDirectory,
  isFileExists,
} from "./utils";

export function activate(context: ExtensionContext) {
  console.log("Image Hover Preview Started!");

  const settings = vscode.workspace.getConfiguration("imageHover");
  const { languages } = settings;

  async function provideHover(document: TextDocument, position: Position) {
    let imgUrl = "";
    const fileName = document.fileName;
    const { line: lineNum, character: colNum } = position;
    const lineText = document.lineAt(lineNum).text;
    const dir = path.dirname(fileName);
    console.log(dir.split("/src")[0]);

    if (isImportModule(lineText)) {
      return;
    }

    const str = lineText?.trim().match(/"`*([^`]+)`*"/)?.[1] || "";
    // console.log(lineText?.trim().match(/"`*([^`]+)`*"/)?.[1]);

    if (isCompleteHttpUrl(str)) {
      imgUrl = str;
    } else {
      const value = str.match(/\${(.*?)}/)?.[1] || "";
      // console.log(extractImportPath(document.getText(), value));
      const importPath = extractImportPath(document.getText(), value);
      const absolutePath = extractAbsolutePath(importPath);
      const completePath = `${dir.split("/src")[0]}${absolutePath}`;

      let fileText = "";

      if (isDirectory(completePath)) {
        [".js", ".ts", ".vue", ".jsx", ".tsx"].forEach((item) => {
          if (isFileExists(`${completePath}/index${item}`)) {
            fileText = getFileText(`${completePath}/index${item}`);
          }
        });
      } else {
        fileText = getFileText(completePath);
      }
      let pattern = new RegExp(`${value}\\s*=\\s*([^\\s]*)`);
      console.log(pattern.exec(fileText));
      let x = /['"]([^'"]+)['"]/.exec(pattern.exec(fileText)?.[1] || "")?.[1];
      console.log(x);

      imgUrl = `${x}${str?.split("}")[1]}`;
    }

    const getImageInfo = await (async () => {
      const { width, height, size } = await fetchImgInfo(imgUrl);
      return `${size}(${width}x${height})`;
    })();

    const markdownString = new MarkdownString(`
  \r\n[![](${imgUrl})](${imgUrl})
  \r\n${getImageInfo}`);

    return new Hover(markdownString);
  }

  languages.forEach((language: string) => {
    vscode.languages.registerHoverProvider(language, {
      provideHover,
    });
  });
}

export function deactivate() {
  console.log("deactivate");
}
