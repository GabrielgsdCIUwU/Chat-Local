import { EmbedMessage } from "../utility/EmbedMessage.js";

/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {
    const embed = new EmbedMessage()
    .addField("Estos son todos los comandos:", "")
    .addField("- ping", "/ping")
    .addField("- 8ball", "/8ball (pregunta)")
    .addField("- chiste", "/chiste")
    .addField("- horoscopo", "/horoscopo")
    .addField("- rate", "/rate (texto)")
    .addField("- gambling", "Subcomandos:")
    .addField("- gambling info", "/gambling info")
    .addField("- gambling loteria", "/gambling loteria (cantidad)")
    .addField("- gambling robar", "/gambling robar (usuario) (cantidad)")
    .addField("- gambling banca rota", "/gambling bancaRota")
    .addField("- gambling duelo", "/gambling duelo (usuario) (cantidad)")
    .addField("- gambling top", "/gambling top");

    context.reply(embed.toString())
}