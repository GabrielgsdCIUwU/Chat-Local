import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to play the lottery.
 * @extends BaseCommand
 */
class LoteriaCommand extends BaseCommand {
    constructor() {
        super({
            name: "loteria",
            description: "Compra un ticket de lotería. ¡Si aciertas, multiplicas tu apuesta x5!",
            params: [
                { name: "amount", displayName: "Cantidad", type: "number", required: true, description: "Cantidad de dinero a apostar." }
            ]
        })
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { amount } = args;
        const eco = context.container.economyService;

        await eco.removeFunds(context.username, amount);

        const winnerNumber = Math.floor(Math.random() * 6) + 1;
        const playerNumber = Math.floor(Math.random() * 6) + 1;
        let finalMessage = "";

        if (playerNumber === winnerNumber) {
            const baseWinnings = amount * 5;
            const { actualEarnings, petMsg } = await context.container.gamblingService.addRewardWithBonus(context.username, baseWinnings);

            await context.container.gamblingRepository.executeTransaction(async (users) => {
                const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
                gambler.spend = (gambler.spend || 0) + amount;
                gambler.totalEarnings = (gambler.totalEarnings || 0) + actualEarnings;
            });
            finalMessage = `🎉 ¡Felicidades **${context.username}**! Has ganado **${actualEarnings}€** netos en la lotería.${petMsg}`;
        } else {
            await context.container.gamblingRepository.executeTransaction(async (users) => {
                const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
                gambler.spend = (gambler.spend || 0) + amount;
            });
            finalMessage = `💸 Lo siento **${context.username}**, has perdido **${amount}€** en la lotería.`;
        }

        context.reply(finalMessage);
    }
}
export default new LoteriaCommand();