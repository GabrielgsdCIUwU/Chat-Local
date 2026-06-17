import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const params = [
    {name: "usuario", type: "user", required: false}
];

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const targetName = context.args.join(" ") || context.username;

    try {
        const wallet = await context.container.economyService.getBalance(targetName);

        const embed = new EmbedMessage()
            .addField("📌 Usuario", wallet.name)
            .addField("💰 Dinero actual", `${wallet.money.toLocaleString('es-ES')}€`);
        
        if (wallet.debt > 0) {
            embed.addField("💳 Deuda pendiente", `${wallet.debt}€`);
        }

        context.reply(embed.toString());
    } catch (error) {
        context.reply(error.message);
    }
}