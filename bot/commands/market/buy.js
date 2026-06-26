import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to purchase an active auction.
 * @extends BaseCommand
 */
class BuyCommand extends BaseCommand {
    constructor() {
        super({
            name: "buy",
            description: "Compra un lote de materiales del mercado usando su ID.",
            params: [
                { name: "auctionId", displayName: "ID", type: "string", required: true, description: "El código de la subasta a comprar." }
            ]
        });
    }
    
    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const auctionId = args.auctionId.toLowerCase();

        const boughtAuction = await context.container.marketService.buyAuction(context.username, auctionId);

        context.reply(`🛍️ **¡COMPRA EXITOSA!**\n**${context.username}** ha comprado **${boughtAuction.amount}x ${boughtAuction.itemName}** a **${boughtAuction.seller}** por **${boughtAuction.price}€**.`);
    }
}

export default new BuyCommand();