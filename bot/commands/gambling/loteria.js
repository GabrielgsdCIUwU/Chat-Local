import { calculateNetEarnings } from "../../utility/calculateNetEarnings.js";
export const params = [
    {name: "cantidad", type: "number", required: true}
];

/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export function execute(context) {
    const gambler = context.currentUser;
    const bet = Number.parseInt(context.args[0]);

    if (Number.isNaN(bet) || bet <= 0 || bet > gambler.money) {
        const msg = bet > gambler.money 
            ? "¡No puedes hacer gambling si NO TIENES ese dinero!" 
            : `Apuesta no válida: ${bet}`;

        return context.reply(msg);
    }

    const winnerNumber = Math.floor(Math.random() * 6) + 1;
    const playerNumber = Math.floor(Math.random() * 6) + 1;

    if (playerNumber === winnerNumber) {
        gambler.money += calculateNetEarnings(bet * 5, gambler);
        return context.reply(`¡Felicidades ${context.username}! Has ganado ${bet * 5}€ en la lotería.`);
    } else {
        gambler.money -= bet;
        gambler.spend = (gambler.spend || 0) + bet;
        context.reply(`Lo siento ${context.username}, has perdido ${bet}€ en la lotería.`)
    }
}