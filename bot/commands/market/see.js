import { EmbedMessage } from "../../utility/EmbedMessage.js";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const auctions = await context.container.marketService.getActiveAuctions();

    if (auctions.length === 0) {
        return context.reply("⚖️ **Mercado Global**\nNo hay ninguna subasta activa en este momento.");
    }

    const embed = new EmbedMessage();
    
    const sorted = auctions.toSorted((a, b) => a.price - b.price).slice(0, 15);

    sorted.forEach((auc) => {
        embed.addField(
            `🛒 ID: \`${auc.id}\` | ${auc.amount}x ${auc.itemName}`, 
            `💰 Precio: **${auc.price.toLocaleString('es-ES')}€** (Vendedor: ${auc.seller})`
        );
    });

    context.reply(`⚖️ **Mercado Global (Top 15 más baratos)**\n*(Usa \`/mercado buy ID\` para adquirir uno)*\n${embed.toString()}`);
}