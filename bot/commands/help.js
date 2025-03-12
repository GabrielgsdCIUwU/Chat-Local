class EmbedMessage {
    constructor() {
        this.fields = [];
    }
    addField(name, value) {
        this.fields.push({ name, value });
        return this;
    }

    toString() {
        return this.fields.map(field => `**${field.name}:** ${field.value}`).join("\n");
    }
}

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
    .addField("- gambling banca rota", "/bot gambling bancaRota");

    // Emitir mensaje del bot al cliente
    io.emit("sendmsg", { user: "🤖 Bot", message: embed.toString(), timestamp });
}