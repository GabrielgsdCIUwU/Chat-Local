const pendingDuels = new Map();

export function execute({ args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt }) {
    if (args[0] === "aceptar") {
        if (!pendingDuels.has(username)) {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} No tienes ningún duelo pendiente`, timestamp });
        }

        const { challengerName, amount } = pendingDuels.get(username);
        const challengerIndex = currenData.findIndex(user => user.name === challengerName);

        if (challengerIndex === -1) {
            pendingDuels.delete(username);
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} El usuario retador ya no existe `, timestamp });
        }

        let gambler = currenData[userIndex];
        let challengerGambler = currenData[challengerIndex];

        const resultado = Math.random();

        if (resultado < 0.5) {
            gambler.money += actualEarningsPayingDebt(amount, gambler);
            challengerGambler.money -= amount;
            gambler.duelWin++;
            challengerGambler.duelLose++;
            io.emit("sendmsg", { user: "🤖 Bot", message: `${username} ha ganado el duelo contra ${challengerName} y se lleva ${amount}€`, timestamp });
        } else {
            gambler.money -= amount;
            challengerGambler.money += actualEarningsPayingDebt(amount, challengerGambler);
            gambler.duelLose++;
            challengerGambler.duelWin++;
            io.emit("sendmsg", { user: "🤖 Bot", message: `${username} ha perdido el duelo contra ${challengerName} y le entrega ${amount}€`, timestamp });
        }

        pendingDuels.delete(username);
    } else if (args[0] === "rechazar") {
        if (pendingDuels.has(username)) {
            pendingDuels.delete(username);
            io.emit("sendmsg", { user: "🤖 Bot", message: `${username} ha rechazado el duelo.`, timestamp });
        } else {
            io.emit("sendmsg", { user: "🤖 Bot", message: `No tienes duelos pendientes @${username}.`, timestamp });
        }
    } else {
        let challenger = currenData[userIndex];
        const targetName = args[0];
        const targetIndex = currenData.findIndex((user) => user.name === targetName);

        if (targetIndex === -1 || targetName === username) {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} el usuario ${targetName} no es válido o no existe.`, timestamp });
        }

        let target = currenData[targetIndex];
        const amount = args[1] ? parseInt(args[1]) : 0;

        if (isNaN(amount) || amount <= 0 || amount > target.money) {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} tu cantidad no es válida o ${target.name} no tiene ese dinero.`, timestamp });
        }

        if (pendingDuels.has(targetName)) {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} el usuario ${targetName} tiene un duelo pendiente.`, timestamp });
        }

        let challengerName = challenger.name

        pendingDuels.set(targetName, { challengerName, amount });

        console.log(pendingDuels);

        return io.emit("sendmsg", { user: "🤖 Bot", message: `**${challengerName}** ha retado a ${targetName} con ${amount}€, usa el comando /bot gambling duelo (**aceptar** || **rechazar**)`, timestamp });


    }
}