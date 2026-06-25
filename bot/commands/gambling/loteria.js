export const description = "Compra un ticket de lotería. ¡Si aciertas, multiplicas tu apuesta x5!";
export const params = [
    { name: "cantidad", type: "number", required: true, description: "Cantidad de dinero a apostar." }
];

/**
 * 
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const eco = context.container.economyService;
    const bet = Number.parseInt(context.args[0]);

    if (Number.isNaN(bet) || bet <= 0) return context.reply("Apuesta no válida.");

    try {
        await eco.removeFunds(context.username, bet);

        const winnerNumber = Math.floor(Math.random() * 6) + 1;
        const playerNumber = Math.floor(Math.random() * 6) + 1;
        let finalMessage = "";

        if (playerNumber === winnerNumber) {
            const baseWinnings = bet * 5;
            const { actualEarnings, petMsg } = await context.container.gamblingService.addRewardWithBonus(context.username, baseWinnings);
            
            await context.container.gamblingRepository.executeTransaction(async (users) => {
                const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
                gambler.spend = (gambler.spend || 0) + bet;
                gambler.totalEarnings = (gambler.totalEarnings || 0) + actualEarnings;
            });
            finalMessage = `🎉 ¡Felicidades ${context.username}! Has ganado ${actualEarnings}€ netos en la lotería.${petMsg}`;
        } else {
            await context.container.gamblingRepository.executeTransaction(async (users) => {
                const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
                gambler.spend = (gambler.spend || 0) + bet;
            });
            finalMessage = `💸 Lo siento ${context.username}, has perdido ${bet}€ en la lotería.`;
        }

        return context.reply(finalMessage);
    } catch (error) {
        return context.reply(`❌ ${context.username}: ${error.message}`);
    }
}