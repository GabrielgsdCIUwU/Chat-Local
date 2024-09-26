import express from "express";
import path from "path"
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import http from "http";

import webrouter from "./router/paginas.js";
import admin from "./router/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env")
dotenv.config({ path: envFilePath });

const app = express();

app.use(express.json());
app.disable("x-powered-by");

const port = process.env.PORT || 3000;

const server = http.createServer(app);


app.use("/public", express.static(path.join(__dirname, "public")));

app.use(webrouter)

app.use(admin)
server.listen(port, () => {
    console.log("Escuchando: " + port);
})