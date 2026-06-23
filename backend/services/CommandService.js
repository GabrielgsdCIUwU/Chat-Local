import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export class CommandService {
    /**
     * @param {string} commandsPath - Base directory path where commands are stored.
     */
    constructor(commandsPath) {
        this.commandsPath = commandsPath;
    }

    /**
     * Recursively reads the command directory to generate a command tree.
     * @param {string} [dir] - The directory to read (defaults to base commands path).
     * @returns {Promise<Object>} A nested object representing the command tree.
     */
     async getCommandTree(dir = this.commandsPath) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        const commands = {};

        for (const file of files) {
            if (file.isDirectory() && (file.name === "types")) continue;
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
                const subTree = await this.getCommandTree(fullPath);
                const commandName = file.name;

                if (commands[commandName]) {
                    commands[commandName] = { ...commands[commandName], ...subTree };
                } else {
                    commands[commandName] = subTree;
                }
                continue;
            }

            if (file.name.endsWith(".js")) {
                const commandName = path.basename(file.name, ".js");
                const module = await import(pathToFileURL(fullPath).href).catch(() => null);

                if (commands[commandName]) {
                    commands[commandName] = {
                        ...commands[commandName],
                        params: module?.params || [],
                        description: module?.description || "Sin descripción.",
                        adminOnly: module?.adminOnly || false
                    };
                } else {
                    commands[commandName] = {
                        params: module?.params || [],
                        description: module?.description || "Sin descripción.",
                        adminOnly: module?.adminOnly || false
                    };
                }
            }
        }
        return commands;
     }
}