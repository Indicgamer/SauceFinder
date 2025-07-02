import express from "express";
import bodyParser from "body-parser";
import fileupload from "express-fileupload";
import axios from "axios";
import ejs from "ejs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { time } from "console";


const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileupload());

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/submit", async (req, res) => {
  let contarr = [];
  const img = req.files.image;

  if (!img) return res.sendStatus(400);

  await img.mv(__dirname + "/public/uploads/" + img.name);

  const type = path.extname(img.name).slice(1);




  try {
    const result = await axios.post(
      "https://api.trace.moe/search",
      fs.readFileSync(path.resolve("public/uploads/" + img.name)),
      {
        headers: {
          "Content-Type": "image/" + type,
        },
      }
    );

    var query = `
  query ($id: Int) { # Define which variables will be used in the query (id)
    Media (id: $id) { # Insert our variables into the query arguments (id) (type: ANIME is hard-coded in the query)
      id
      title {
        romaji
        english
        native
      }
    }
  }
  `;

    for (let index = 0; index < result.data.result.length; index++) {
      var element = result.data.result[index];
      var variables = {
        id: result.data.result[index].anilist,
      };
      const body = {
        query: query,
        variables: variables,
      };
      const result2 = await axios.post("https://graphql.anilist.co", body, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      contarr.push({
        Name: result2.data.data.Media.title.english || result2.data.data.Media.title.romaji ,
        ep_no: element.episode,
        to: element.to,
        from: element.from,
        similarity: element.similarity,
        video: element.video,
        image: element.image,
      });
    }

    res.render("index.ejs", { data: contarr });
  } 
  catch (error) {
    console.log(error)
    if(error.response.status==429){
      res.render("index.ejs",{
        error: "Error, you are being rate limited"
      });
    }
    else if(error.response.status==404){
      res.render("index.ejs",{
        error: "error, result not found"
      });
    }
    else if(error.response.status==400){
      res.render("index.ejs",{
        error: "error processing the image, try another"
      });
    }
    else{
      res.render("index.ejs",{
        error: "Error, "+error
      });
    }
  }

});

app.listen(3000, () => {
  console.log("Server started on port " + 3000);
});

export default app;
