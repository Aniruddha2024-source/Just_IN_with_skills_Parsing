/*import DataUriParser from "datauri/parser.js"

import path from "path";

const getDataUri = (file) => {
    const parser = new DataUriParser();
    const extName = path.extname(file.originalname).toString();
    return parser.format(extName, file.buffer);
}

export default getDataUri;*/


import DataUriParser from "datauri/parser.js";
import path from "path";

const parser = new DataUriParser();

export const getDataUri = (file) => {
  if (!file) throw new Error("File not provided to getDataUri");

  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

export default getDataUri;
