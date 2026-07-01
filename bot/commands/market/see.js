import { BOT_CONFIG } from "../../../backend/core/constants.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";
import { BaseCommand } from "../../core/BaseCommand.js";

export const description = "Muestra las subastas activas más baratas del mercado.";

/**
 * Command to view the cheapest active auctions.
 * @extends BaseCommand
 */
class SeeCommand extends BaseCommand {
    constructor() {
        super({
            name: "see",
            description: "Muestra las subastas activas más baratas del mercado."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const auctions = await context.container.marketService.getActiveAuctions();

        if (auctions.length === 0) {
            throw new Error("No hay ninguna subasta activa en este momento.");
        }

        const embed = new EmbedMessage();
        
        const sorted = auctions.toSorted((a, b) => a.price - b.price).slice(0, BOT_CONFIG.MARKET_TOP_LIMIT);

        sorted.forEach((auc) => {
            embed.addField(
                `🛒 ID: \`${auc.id}\` | ${auc.amount}x ${auc.itemName}`, 
                `💰 Precio: **${auc.price.toLocaleString('es-ES')}€** (Vendedor: ${auc.seller})`
            );
        });

        context.reply(`⚖️ **Mercado Global (Top 15 más baratos)**\n*(Usa \`/market buy ID\` para adquirir uno)*\n${embed.toString()}`);
    }
}

export default new SeeCommand();