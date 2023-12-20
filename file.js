import fs from "fs"
import path from "path"
import furl from "url"

const __dirname = path.dirname(furl.fileURLToPath(import.meta.url));
console.log(__dirname);
console.log(path.resolve("public/img/Screenshot 2023-09-08 154227.png"));


const data = fs.readFileSync(path.resolve("public/img/Screenshot 2023-09-08 154227.png"));

console.log(data);