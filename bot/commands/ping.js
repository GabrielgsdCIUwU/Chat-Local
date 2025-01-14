export function execute({ args, socket, io }) {
    const response = "Pong!"; // Respuesta del comando
    const timestamp = new Date().getTime();

    // Emitir mensaje del bot al cliente
    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}