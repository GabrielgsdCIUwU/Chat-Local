export const params = [
    {name: "item", type: "string", required: true},
    {name: "cantidad", type: "number", required: true}
];


/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const itemName = context.args.slice(0, -1).join(" ");

    const amount = Number.parseInt(context.args.at(-1));

    const result = await context.container.rpgService.sellItem(context.username, itemName, amount);
    context.reply(`⚖️ **${context.username}** ha vendido ${amount}x ${result.itemName} y ha recibido **${result.totalValue}€**.`);
}