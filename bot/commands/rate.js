export const params = [
    {name: "valorar", type: "string", required: true}
];
export function execute({ args, socket, io, msg }) {
    const timestamp = new Date().getTime();

    const valoracion = args[0];

    if(!valoracion) {
        io.emit("sendmsg", { user: "🤖 Bot", message: "Debes hacerme una pregunta.", timestamp });
        return;
    }


    function random() {
        let max = 10;
        let v = Math.round(Math.random() * (max -1) + 1);
        return v;
    }

    const texto = `${valoracion.trim()}`

    const response = `Yo le doy a ${texto} un ${random()}`

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}