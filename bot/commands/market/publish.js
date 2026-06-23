export const description = "Publica materiales de tu inventario en el mercado global.";
export const params = [
    { name: "item", type: "string", required: true, description: "Nombre del material a vender." },
    { name: "cantidad", type: "number", required: true, description: "Cantidad de material a vender." },
    { name: "precio_total", type: "number", required: true, description: "Precio total por el lote entero." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const price = Number.parseInt(context.args.at(-1));
    const amount = Number.parseInt(context.args.at(-2));
    const itemName = context.args.slice(0, -2).join(" ");

    const auction = await context.container.marketService.publishAuction(
        context.username,
        itemName,
        amount,
        price
    );

    context.reply(`📢 **NUEVA SUBASTA**\n**${context.username}** ha publicado **${auction.amount}x ${auction.itemName}** por **${auction.price}€**.\n*(Usa \`/market buy ${auction.id}\` para comprarlo)*`);
}