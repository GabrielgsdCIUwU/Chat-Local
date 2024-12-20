export function execute({ args, socket, io, msg }) {
    const timestamp = new Date().getTime();


    function random() {
        let max = 10;
        let v = Math.round(Math.random() * (max -1) + 1);
        return v;
    }

    const texto = `${msg.replace("/bot rate", "").trim()}`

    const response = `Yo le doy a ${texto} un ${random()}`

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}