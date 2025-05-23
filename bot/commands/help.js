import { EmbedMessage } from "../utility/EmbedMessage.js";

export function execute({ args, socket, io }) {
    const timestamp = new Date().getTime();
    const embed = new EmbedMessage()
    .addField("Estos son todos los comandos:", "")
    .addField("- ping", "/bot ping")
    .addField("- 8ball", "/bot 8ball (pregunta)")
    .addField("- chiste", "/bot chiste")
    .addField("- horoscopo", "/bot horoscopo")
    .addField("- rate", "/bot rate (texto)")
    .addField("- gambling", "Subcomandos:")
    .addField("- gambling info", "/bot gambling info")
    .addField("- gambling loteria", "/bot gambling loteria (cantidad)")
    .addField("- gambling robar", "/bot gambling robar (usuario) (cantidad)")
    .addField("- gambling banca rota", "/bot gambling bancaRota")
    .addField("- gambling duelo", "/bot gambling duelo (usuario) (cantidad)")
    .addField("- gambling top", "/bot gambling top");

    // Emitir mensaje del bot al cliente
    io.emit("sendmsg", { user: "🤖 Bot", message: embed.toString(), timestamp });
}