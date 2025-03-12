export function execute({  args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt }) {
    const timestamp = new Date().getTime()
    let gambler = currenData[userIndex];
    const apuesta = parseInt(args[0]);

    if (isNaN(apuesta) || apuesta <= 0 || apuesta > gambler.money) {
        if (apuesta > gambler.money) {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} No puedes hacer gambling si NO TIENES ese dinero!!!`, timestamp });
        } else {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} apuesta no válida o no tienes dinero: ${apuesta}`, timestamp });
        }
    }

    const numeroGanador = Math.floor(Math.random() * 6) + 1;
    const numeroJugador = Math.floor(Math.random() * 6) + 1;

    if (numeroJugador === numeroGanador) {
        gambler.money += actualEarningsPayingDebt(apuesta * 5, gambler);
        io.emit("sendmsg", { user: "🤖 Bot", message: `¡Felicidades ${username}! Has ganado ${apuesta * 5}€ en la lotería.`, timestamp });
    } else {
        gambler.money -= apuesta;
        gambler.spend += apuesta;
        io.emit("sendmsg", { user: "🤖 Bot", message: `Lo siento ${username}, has perdido ${apuesta}€ en la lotería.`, timestamp });
    }
}