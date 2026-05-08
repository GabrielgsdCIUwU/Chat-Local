import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { getUserNames } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "../bot/commands");

const router = express.Router();

router.get("/msg", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/messages.html"));
});

//region commands

async function readCommands(dir) {
    const files = fs.readdirSync(dir, {withFileTypes: true});
    const commands = {};

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            const subTree = await readCommands(fullPath);
            const commandName = file.name;

            //merge commands with the father command
            if(commands[commandName]) {
                commands[commandName] = {...commands[commandName], ...subTree}
            } else {
                commands[commandName] = subTree;
            }
            continue;
        }

        if (file.name.endsWith(".js")) {
            const commandName = path.basename(file.name, ".js");
            const module = await import(pathToFileURL(fullPath).href).catch(() => null);

            if (commands[commandName]) {
                commands[commandName] = {...commands[commandName], params: module?.params || []};
            } else {
                commands[commandName] = {params: module?.params || []}
            }

        }
    }
    return commands;
}

router.get("/commands", async (req, res) => {
    if (!isIpAllowed(req.ip)) return;
    const tree = await readCommands(commandsPath);
    res.json(tree);
});

router.get("/users", (req, res) => {
    if (!isIpAllowed(req.ip)) return;
    res.json(getUserNames());
});


export default router;