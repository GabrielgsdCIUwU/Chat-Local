/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const result = await context.container.rpgService.work(context.username);

    const itemsText = Object.entries(result.items)
        .map(([item, amount]) => `${amount}x ${item}`)
        .join(", ");
    
    context.reply(`${result.actionText} y ha conseguido:\n📦 **Botín:** ${itemsText}`);
}