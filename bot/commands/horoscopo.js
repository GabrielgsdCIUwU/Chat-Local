export function execute({ args, socket, io, username }) {
    const timestamp = new Date().getTime();

    function random() {
        let max = 100;
        let v = Math.round(Math.random() * (max - 1) + 1);
        return v;
    }

    const response = `Tu horóscopo ${username}:\n**Amor**:${random()}%\n**Salud**:${random()}%\n**Suerte**:${random()}%\n**Dinero**:${random()}%`

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}