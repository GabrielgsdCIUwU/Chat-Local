import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to publish items into the global auction house.
 * @extends BaseCommand
 */
class PublishCommand extends BaseCommand {
    constructor() {
        super({
            name: "publish",
            description: "Publica materiales de tu inventario en el mercado global.",
            params: [
                { name: "amount", type: "number", required: true, description: "Cantidad de material a vender." },
                { name: "price", type: "number", required: true, description: "Precio total por el lote." },
                { name: "itemName", type: "inventory_item", required: true, description: "Nombre del material a vender." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { amount, price, itemName } = args;

        const auction = await context.container.marketService.publishAuction(
            context.username,
            itemName,
            amount,
            price
        );

        context.reply(`📢 **NUEVA SUBASTA**\n**${context.username}** ha publicado **${auction.amount}x ${auction.itemName}** por **${auction.price}€**.\n*(Usa \`/market buy ${auction.id}\` para comprarlo)*`);
    }
}

export default new PublishCommand();