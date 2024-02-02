import path from "path";
import vscode, {
  ExtensionContext,
  Position,
  TextDocument,
  CancellationToken,
  Hover,
} from "vscode";
import { isImportModule } from "./utils";

export function activate(context: ExtensionContext) {
  console.log("Image Hover Preview Started!");

  const settings = vscode.workspace.getConfiguration("imageHover");
  const { languages } = settings;

  async function provideHover(document: TextDocument, position: Position) {
    const fileName = document.fileName;
    const { line: lineNum, character: colNum } = position;
    const lineText = document.lineAt(lineNum).text;
    const dir = path.dirname(fileName);

    if (isImportModule(lineText)) {
      return;
    }

    console.log("lineText", lineText);
    console.log("dir", fileName);

    return new Hover("aa");
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
