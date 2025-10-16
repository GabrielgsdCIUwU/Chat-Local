export const params = [
    { name: "usuario", type: "user", required: true },
    { name: "dinero", type: "number", required: true }
]

export function execute({ args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt }) {
    const timestamp = new Date().getTime()
    let gambler = currenData[userIndex];
    const targetName = args.slice(0, -1).join(" ");
    const targetIndex = currenData.findIndex((user) => user.name === targetName);

    if (targetIndex === -1 || targetName === username) {
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${targetName} no es válido o no existe @${username}`, timestamp });
    }

    let target = currenData[targetIndex];
    const cantidad = parseInt(args[args.length - 1]);;

    if (isNaN(cantidad) || cantidad <= 0 || cantidad > gambler.money) {
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} tu cantidad no es válida no tienes suficiente dinero para donar.`, timestamp });
    }


    gambler.money -= cantidad;
    target.money += actualEarningsPayingDebt(cantidad, target);
    gambler.donated += cantidad;
    return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} ha regalado ${cantidad}€ a ${targetName}`, timestamp });

}