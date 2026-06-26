import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to sell items to the system.
 * @extends BaseCommand
 */
class SellCommand extends BaseCommand {
    constructor() {
        super({
            name: "sell",
            description: "Vende tus materiales rápidamente al sistema por un precio base fijo.",
            params: [
                { name: "item", type: "inventory_item", required: true, description: "El material que quieres vender." },
                { name: "cantidad", type: "number", required: true, description: "La cantidad que vas a vender." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { amount, itemName } = args;

        const result = await context.container.rpgService.sellItem(context.username, itemName, amount);
        context.reply(`⚖️ **${context.username}** ha vendido ${amount}x ${result.itemName} y ha recibido **${result.totalValue}€**.`);
    }
}
export default new SellCommand();