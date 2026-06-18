export const description = "Compra un lote de materiales del mercado usando su ID.";
export const params = [
    { name: "ID_Subasta", type: "string", required: true, description: "El código de la subasta a comprar." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const auctionId = context.args[0].trim().toLowerCase();

    const boughtAuction = await context.container.marketService.buyAuction(context.username, auctionId);
    
    context.reply(`🛍️ **¡COMPRA EXITOSA!**\n**${context.username}** ha comprado **${boughtAuction.amount}x ${boughtAuction.itemName}** a **${boughtAuction.seller}** por **${boughtAuction.price}€**.`);
}