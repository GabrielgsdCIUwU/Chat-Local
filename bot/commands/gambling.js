import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseCommand } from "../core/BaseCommand.js";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Router command for Gambling module.
 * @extends BaseCommand
 */
class GamblingRouter extends BaseCommand {
    constructor() {
        super({
            name: "gambling",
            description: "Módulo del casino y apuestas. ¡Juega bajo tu propio riesgo!",
        });
    }

    /**
     * @param {import('../core/BotContext.js').BotContext} context 
     */
    async run(context) {
        const subcommandsPath = path.join(__dirname, "./gambling");
        await SubcommandRouter.route(context, subcommandsPath, this.name);
    }
}

export default new GamblingRouter();