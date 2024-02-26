import path from "path";
import vscode, { ExtensionContext, Position, TextDocument, Hover, MarkdownString } from "vscode";
import { isImportModule, fetchImgInfo, isCompleteHttpUrl, extractValue } from "./utils";

export function activate(context: ExtensionContext) {
  console.log("Image Hover Preview Started!");

  const settings = vscode.workspace.getConfiguration("imageHover");
  const { languages } = settings;

  async function provideHover(document: TextDocument, position: Position) {
    let imgUrl = "";
    let keywordValue = "";
    const fileName = document.fileName;
    const documentText = document.getText();
    const { line: lineNum, character: colNum } = position;
    const lineText = document.lineAt(lineNum).text;
    const dir = path.dirname(fileName);

    if (isImportModule(lineText)) {
      return;
    }

    const hoverUrl = lineText?.trim().match(/[`'"]([^`'"]+)[`'"]/)?.[1] || "";

    if (isCompleteHttpUrl(hoverUrl)) {
      imgUrl = hoverUrl;
    } else {
      const keyword = hoverUrl.match(/\${(.*?)}/)?.[1] || "";

      keywordValue = extractValue({ keyword, documentText, dir });
      imgUrl = `${keywordValue || ""}${hoverUrl.replace(hoverUrl.match(/\${(.*?)}/)?.[0] || "", "")}`;
    }

    if (!isCompleteHttpUrl(imgUrl)) {
      const matchText = documentText.match(/:src="`([^`"]+)`"/)?.[1] || "";
      const substr = matchText.replace(/\${(.*?)}/g, "");
      const keyword = matchText.match(/\${(.*?)}/)?.[1] || "";

      keywordValue = extractValue({ keyword, documentText, dir });
      imgUrl = `${keywordValue}${substr}${imgUrl}`;
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
