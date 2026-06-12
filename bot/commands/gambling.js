import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JsonDatabaseClient } from "../../backend/database/JsonDatabaseClient.js";
import { GamblingRepository } from "../../backend/repositories/GamblingRepository.js";
import { GamblingService } from "../../backend/services/GamblingService.js";
import { CommandLoader } from "../../backend/core/CommandLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const subcommandsPath = path.join(__dirname, "./gambling");

const gamblingDbClient = new JsonDatabaseClient(path.join(__dirname, "../../public/json/gambling.json"));
const gamblingRepository = new GamblingRepository(gamblingDbClient);
const gamblingService = new GamblingService(gamblingRepository);

export async function execute({subcommand, args, socket, io, username, raw }) {
    const timestamp = Date.now();
    
    if (!subcommand || subcommand.length === 0) {
        return io.emit("sendmsg", { user: "🤖 Bot", message: "Debes especificar un subcomando.", timestamp });
    }

    const subcommandName = subcommand[0];
    const subcommandLoaded = await CommandLoader.load(subcommandsPath, subcommandName);

    if (!subcommandLoaded?.execute) {
        return io.emit("sendmsg", { user: "🤖 Bot", message: `El subcomando "${subcommandName}" no existe.`, timestamp });
    }

    try {
        await gamblingRepository.executeTransaction((users) => {
            const currentUser = gamblingService.ensureUserExists(users, username);

            subcommandLoaded.execute({
                args,
                io,
                username,
                currentUser,
                users,
                gamblingService,
                timestamp
            });
        });
    } catch (err) {
        console.error(`Error executing gambling subcommand ${subcommandName}:`, err);
        io.emit("sendmsg", { user: "🤖 Bot", message: "Hubo un error al ejecutar el comando.", timestamp });
    }
}