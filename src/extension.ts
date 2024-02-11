import path from "path";
import vscode, {
  ExtensionContext,
  Position,
  TextDocument,
  Hover,
  MarkdownString,
} from "vscode";
import { isImportModule, fetchImgInfo, isCompleteHttpUrl } from "./utils";

export function activate(context: ExtensionContext) {
  console.log("Image Hover Preview Started!");

  const settings = vscode.workspace.getConfiguration("imageHover");
  const { languages } = settings;

  async function provideHover(document: TextDocument, position: Position) {
    let reqUrl = "";
    const fileName = document.fileName;
    const { line: lineNum, character: colNum } = position;
    const lineText = document.lineAt(lineNum).text;
    const dir = path.dirname(fileName);

    if (isImportModule(lineText)) {
      return;
    }

    const imgUrl = lineText?.trim().match(/(`|')([^`]*)(`|')/)?.[1] || "";

    if (isCompleteHttpUrl(imgUrl)) {
      reqUrl = imgUrl;
    } else {
      reqUrl = `https://img.betterwood.com/minapp${imgUrl?.split("}")[1]}`;
    }

    // console.log("lineText", lineText.trim().match(/`([^`]*)`/));
    console.log("dir", reqUrl);
    console.log("imgUrl", imgUrl);

    const getImageInfo = await (async () => {
      const { width, height, size } = await fetchImgInfo(reqUrl);
      return `${size}(${width}x${height})`;
    })();

    const markdownString = new MarkdownString(`
  \r\n[![](${reqUrl})](${reqUrl})
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
