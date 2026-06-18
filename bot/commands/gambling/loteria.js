export const description = "Compra un ticket de lotería. ¡Si aciertas, multiplicas tu apuesta x5!";
export const params = [
    { name: "cantidad", type: "number", required: true, description: "Cantidad de dinero a apostar." }
];

/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export async function execute(context) {
    const gambler = context.currentUser;
    const eco = context.container.economyService;
    const bet = Number.parseInt(context.args[0]);

    if (Number.isNaN(bet) || bet <= 0) return context.reply("Apuesta no válida.");

    try {
        await eco.removeFunds(context.username, bet);
        gambler.spend = (gambler.spend || 0) + bet;

        const winnerNumber = Math.floor(Math.random() * 6) + 1;
        const playerNumber = Math.floor(Math.random() * 6) + 1;

        if (playerNumber === winnerNumber) {
            const actualEarnings = await eco.addFunds(context.username, bet * 5);
            gambler.totalEarnings = (gambler.totalEarnings || 0) + actualEarnings;
            return context.reply(`🎉 ¡Felicidades ${context.username}! Has ganado ${actualEarnings}€ netos en la lotería.`);
        } else {
            return context.reply(`💸 Lo siento ${context.username}, has perdido ${bet}€ en la lotería.`);
        }
    } catch (error) {
        return context.reply(`❌ ${context.username}: ${error.message}`);
    }
}