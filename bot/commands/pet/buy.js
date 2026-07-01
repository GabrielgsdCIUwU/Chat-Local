import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to purchase gacha eggs.
 * @extends BaseCommand
 */
class BuyCommand extends BaseCommand {
    constructor() {
        super({
            name: "buy",
            description: `Compra uno o varios huevos sorpresa de mascota (Precio: ${RPG_CONFIG.EGG_PRICE}€ c/u).`,
            params: [
                { name: "amount", displayName: "Cantidad", type: "number", required: false, description: "Cantidad de huevos a comprar (por defecto 1)." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const amount = args.amount || 1;

        const totalCost = await context.container.petService.buyEgg(context.username, amount);

        context.reply(`🥚 **¡COMPRA EXITOSA!**\n**${context.username}** ha comprado **${amount} huevo(s)** por **${totalCost}€**.\n*(Usa \`/pet open\` para ver qué hay dentro)*`);
    }
}
export default new BuyCommand();