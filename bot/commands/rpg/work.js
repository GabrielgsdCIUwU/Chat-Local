import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to execute a work actions.
 * @extends BaseCommand
 */
class WorkCommand extends BaseCommand {
    constructor() {
        super({
            name: "work",
            description: "Trabaja en tu oficio para obtener materiales (tiene tiempo de enfriamiento)."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const result = await context.container.rpgService.work(context.username);

        const itemsText = Object.entries(result.items)
            .map(([item, amount]) => `${amount}x ${item}`)
            .join(", ");

        context.reply(`${result.actionText} y ha conseguido:\n📦 **Botín:** ${itemsText}`);
    }
}
export default new WorkCommand();