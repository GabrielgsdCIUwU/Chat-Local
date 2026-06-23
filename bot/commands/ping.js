export const description = "Comprueba que el bot está activo y responde.";

/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {
    context.reply("Pong!")
}