export const params = [
    { name: "usuario", type: "user", required: false }
]

export function execute({ args, socket, io, username }) {
    const timestamp = new Date().getTime();

    let finalUser;

    const targetName = args[0];
    if (targetName) {
        finalUser = targetName;
    } else {
        finalUser = username;
    }


    function random() {
        let max = 100;
        let v = Math.round(Math.random() * (max - 1) + 1);
        return v;
    }

    const response = `El horóscopo de ${finalUser}:\n**Amor**:${random()}%\n**Salud**:${random()}%\n**Suerte**:${random()}%\n**Dinero**:${random()}%`

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}