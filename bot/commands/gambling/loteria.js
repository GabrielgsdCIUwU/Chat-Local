import { calculateNetEarnings } from "../../utility/calculateNetEarnings.js";
export const params = [
    {name: "cantidad", type: "number", required: true}
];

/**
 * @param {import("./types/CommandContext.js").CommandContext} context 
 */
export function execute(context) {
    const gambler = context.users.find(u => u.name === context.username);
    const bet = Number.parseInt(context.args[0]);

    if (Number.isNaN(bet) || bet <= 0 || bet > gambler.money) {
        const msg = bet > gambler.money 
            ? "¡No puedes hacer gambling si NO TIENES ese dinero!" 
            : `Apuesta no válida: ${bet}`;

        return context.io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username}, ${msg}`, timestamp: context.timestamp });
    }

    const winnerNumber = Math.floor(Math.random() * 6) + 1;
    const playerNumber = Math.floor(Math.random() * 6) + 1;

    if (playerNumber === winnerNumber) {
        gambler.money += calculateNetEarnings(bet * 5, gambler);
        context.io.emit("sendmsg", { user: "🤖 Bot", message: `¡Felicidades ${context.username}! Has ganado ${bet * 5}€ en la lotería.`, timestamp: context.timestamp });
    } else {
        gambler.money -= bet;
        gambler.spend = (gambler.spend || 0) + bet;
        context.io.emit("sendmsg", { user: "🤖 Bot", message: `Lo siento ${context.username}, has perdido ${bet}€ en la lotería.`, timestamp: context.timestamp });
    }
}