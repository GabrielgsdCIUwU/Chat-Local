import { pathToFileURL } from "node:url";
import path from "node:path";

export class CommandLoader {

    /**
     * Dynamically imports a JS file from a given base path.
     * @param {string} basePath - The directory path where the file is located.
     * @param {string} commandName - The name of the file without the .js extension.
     * @returns {Promise<any | null>} The imported module, or null if it fails/doesn't exist.
     */
    static async load(basePath, commandName) {
        try {
            const commandPath = pathToFileURL(path.join(basePath, `${commandName}.js`)).href;
            return await import(commandPath);
        } catch (error) {
            return null;
        }
    }
}