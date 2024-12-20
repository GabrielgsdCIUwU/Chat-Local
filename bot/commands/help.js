export function execute({ args, socket, io }) {
    const timestamp = new Date().getTime();

    const response = `Estos son todos los comandos:\n
    - ping \n          **Uso:** /bot ping
    - 8ball \n          **Uso:** /bot 8ball (pregunta)
    - chiste \n         **Uso:** /bot chiste
    `

    // Emitir mensaje del bot al cliente
    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}