export const description = "Intenta robar dinero a otro jugador. Cuidado con la policía.";
export const params = [
    { name: "usuario", type: "user", required: true, description: "Víctima a la que deseas robar." },
    { name: "dinero", type: "number", required: true, description: "Cantidad que vas a intentar robar." }
];

/**
 * 
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));
    const eco = context.container.economyService;

    if (context.username === targetName) return context.reply("No puedes robarte a ti mismo.");
    if (Number.isNaN(amount) || amount <= 0) return context.reply("Cantidad no válida.");

    const thiefWallet = await eco.getBalance(context.username);
    const maxPossibleFine = amount + Math.floor(amount / 4);
    
    if (thiefWallet.money < maxPossibleFine) {
        return context.reply(`Para intentar robar **${amount}€**, necesitas tener al menos **${maxPossibleFine}€** en tu cuenta para cubrir la fianza en caso de que la policía te atrape.`);
    }

    try {
        const victimWallet = await eco.getBalance(targetName);
        if (victimWallet.money < amount) return context.reply(`La víctima solo tiene ${victimWallet.money}€.`);

        const wardConsumed = await context.container.craftingService.consumeBuff(targetName, "anti_rob");
        let finalMessage = "";

        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
            gambler.timesSteal = (gambler.timesSteal || 0) + 1;

            if (wardConsumed) {
                const moneyLost = amount + Math.floor(Math.random() * (amount / 4));
                const actuallyLost = await eco.forceRemoveFunds(context.username, moneyLost);
                gambler.spend = (gambler.spend || 0) + actuallyLost;
                finalMessage = `🛡️ **¡THIEF WARD ACTIVADO!**\n¡**${targetName}** estaba protegido por una poderosa barrera mágica! La protección se rompió al bloquear el robo y **${context.username}** fue repelido violentamente, pagando una multa de **${actuallyLost}€**.`;
                return;
            }

            const probability = Math.random();

            if (probability < 0.5) {
                const { totalEarned, petMsg } = await context.container.gamblingService.processRobberyWin(context.username, targetName, amount);
                gambler.moneySteal = (gambler.moneySteal || 0) + totalEarned;
                gambler.totalEarnings = (gambler.totalEarnings || 0) + totalEarned;
                finalMessage = `🕵️ ${context.username} ha robado ${amount}€ a ${targetName} con éxito${petMsg}.`;
            } else {
                const moneyLost = amount + Math.floor(Math.random() * (amount / 4));
                const actuallyLost = await eco.forceRemoveFunds(context.username, moneyLost);
                gambler.spend = (gambler.spend || 0) + actuallyLost;
                finalMessage = `👮 ${context.username} intentó robar a ${targetName} pero la policía lo atrapó, perdiendo ${actuallyLost}€ en multas.`;
            }
        });

        return context.reply(finalMessage);
    } catch (error) {
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
}