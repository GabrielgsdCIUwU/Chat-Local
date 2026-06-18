export const description = "Transfiere dinero de tu cartera a otro jugador.";
export const params = [
    { name: "usuario", type: "user", required: true, description: "Usuario que recibirá el dinero." },
    { name: "cantidad", type: "number", required: true, description: "Cantidad a transferir." }
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