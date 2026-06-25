import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseCommand } from "../core/BaseCommand.js";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Router command for RPG module.
 * @extends BaseCommand
 */
class RPGRouter extends BaseCommand {
    constructor() {
        super({
            name: "rpg",
            description: "Módulo de rol. Trabaja, craftea y mejora tus herramientas.",
        });
    }

    /**
     * @param {import('../core/BotContext.js').BotContext} context 
     */
    async run(context) {
        const subcommandsPath = path.join(__dirname, "./rpg");
        await SubcommandRouter.route(context, subcommandsPath, this.name);
    }
}

export default new RPGRouter();