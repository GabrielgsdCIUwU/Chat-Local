export const params = [
    {name: "usuario", type: "user", required: true},
    {name: "dinero", type: "number", required: true}
]

/**
 * 
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export async function execute(context) {
    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));
    const eco = context.container.economyService;
    const gambler = context.currentUser;

    if (context.username === targetName) return context.reply("No puedes robarte a ti mismo.");
    if (Number.isNaN(amount) || amount <= 0) return context.reply("Cantidad no válida.");

    try {
        const victimWallet = await eco.getBalance(targetName);
        if (victimWallet.money < amount) return context.reply(`La víctima solo tiene ${victimWallet.money}€.`);

        gambler.timesSteal = (gambler.timesSteal || 0) + 1;
        const probability = Math.random();

        if (probability < 0.5) {
            await eco.transferFunds(targetName, context.username, amount);
            gambler.moneySteal = (gambler.moneySteal || 0) + amount;
            gambler.totalEarnings = (gambler.totalEarnings || 0) + amount;
            return context.reply(`🕵️ ${context.username} ha robado ${amount}€ a ${targetName} con éxito.`);
        } else {
            const moneyLost = amount + Math.floor(Math.random() * (amount / 4));
            const actuallyLost = await eco.forceRemoveFunds(context.username, moneyLost);
            gambler.spend = (gambler.spend || 0) + actuallyLost;
            return context.reply(`👮 ${context.username} intentó robar a ${targetName} pero la policía lo atrapó, perdiendo ${actuallyLost}€ en multas.`);
        }
    } catch (error) {
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
}