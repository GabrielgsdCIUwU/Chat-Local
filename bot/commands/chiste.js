import chistes from "../../public/json/chistes.json" assert { type: "json" };
export function execute({ args, socket, io }) {
    const timestamp = new Date().getTime();

    const randomIndex = Math.floor(Math.random() * chistes.length);
    const chiste = chistes[randomIndex].contenido;

    const response = `✅ He aquí tu chiste:\n${chiste}`;

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}