export function execute({ currenData, userIndex, socket, io, args, actualEarningsPayingDebt }) {
    const timestamp = new Date().getTime()
    let gambler = currenData[userIndex];
    const targetName = args[0];
    const targetIndex = currenData.findIndex((user) => user.name === targetName);

    if (targetIndex === -1 || targetName === username) {
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${targetName} no es válido o no existe @${username}`, timestamp });
    }

    let target = currenData[targetIndex];
    const probabilidad = Math.random();
    const cantidad = args[1] ? parseInt(args[1]) : 0;

    if (isNaN(cantidad) || cantidad <= 0 || cantidad > target.money) {
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} tu cantidad no es válida o ${target.name} no tiene ese dinero.`, timestamp });
    }

    gambler.timesSteal++;
    if (probabilidad < 0.5) {
        target.money -= cantidad;
        gambler.money += actualEarningsPayingDebt(cantidad, gambler);
        gambler.moneySteal += cantidad;
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} ha robado ${cantidad}€ a ${targetName}`, timestamp });
    } else {
        let cantidadPerdido = cantidad + Math.floor(Math.random() * cantidad / 4)
        gambler.money -= cantidadPerdido;
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} ha intentado robar a ${targetName} pero ha fallado, ha perdido ${cantidadPerdido}€`, timestamp });
    }
}