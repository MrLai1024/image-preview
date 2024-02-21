import sizeOf from "image-size";
import fetch from "node-fetch";
const path = require("path");
const fs = require("fs");

export function isImportModule(lineText: string) {
  return (
    lineText.indexOf("import") !== -1 || lineText.indexOf("require") !== -1
  );
}

export function isCompleteHttpUrl(url: string) {
  const regex = /^(http|https):\/\/[^\s/$.?#].[^\s]*$/i;
  return regex.test(url);
}

export function fetchImgInfo(url: string) {
  return fetch(url)
    .then((res: any) => res.buffer())
    .then((buffer: Buffer) => {
      const size = sizeOf(buffer);
      return {
        width: size.width,
        height: size.height,
        size: humanFileSize(buffer.length, true),
      };
    })
    .catch((err: Error) => {
      return Promise.reject(err);
    });
}

export function extractImportPath(str: string, keyword: string) {
  let pattern = /import\s+{\s+(?:\w+\s*,\s*)*\w+\s+}\s+from\s+'(.*?)'/g;
  let match;

  while ((match = pattern.exec(str)) !== null) {
    let importStatement = match[0];
    let importPath = match[1];

    if (importStatement.includes(keyword)) {
      return importPath;
    }
  }

  return "";
}

export function extractAbsolutePath(pathStr: string) {
  let pattern = /^(@\/|~\/)/;
  const relativePath = pathStr.replace(pattern, "src/");
  return path.resolve(relativePath);
}

export function getFileText(filePath: string) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("无法读取文件:", error);
    return "";
  }
}

export function isDirectory(pathStr: string) {
  try {
    return fs.statSync(pathStr).isDirectory();
  } catch (error) {
    console.error("无法获取路径信息:", error);
    return false;
  }
}

export function isFileExists(pathStr: string) {
  return fs.existsSync(pathStr);
}
/**
 * from https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}
