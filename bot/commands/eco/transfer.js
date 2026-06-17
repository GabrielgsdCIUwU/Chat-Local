export const params = [
    { name: "usuario", type: "user", required: true },
    { name: "cantidad", type: "number", required: true },
];

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));

    try {
        await context.container.economyService.transferFunds(context.username, targetName, amount);
        context.reply(`💸 **${context.username}** ha transferido ${amount}€ a **${targetName}**.`)
    } catch (error) {
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
}