import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseCommand } from "../core/BaseCommand.js";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Router command for Economy module.
 * @extends BaseCommand
 */
class EcoRouter extends BaseCommand {
    constructor() {
        super({
            name: "eco",
            description: "Módulo principal de economía. Usa subcomandos para gestionar tu dinero.",
        });
    }

    /**
     * @param {import('../core/BotContext.js').BotContext} context 
     */
    async run(context) {
        const subcommandsPath = path.join(__dirname, "./eco");
        await SubcommandRouter.route(context, subcommandsPath, this.name);
    }
}

export default new EcoRouter();