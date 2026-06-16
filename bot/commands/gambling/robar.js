import { calculateNetEarnings } from "../../utility/calculateNetEarnings.js";

export const params = [
    {name: "usuario", type: "user", required: true},
    {name: "dinero", type: "number", required: true}
]

/**
 * 
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export function execute(context) {
    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));

    try {
        const { sender, target } = context.container.gamblingService.validateTransaction(context.users, context.username, targetName, amount);

        sender.timesSteal = (sender.timesSteal || 0) + 1;
        const probability = Math.random();

        if (probability < 0.5) {
            target.money -= amount;
            sender.money += calculateNetEarnings(amount, sender);
            sender.moneySteal = (sender.moneySteal || 0) + amount;
            return context.reply(`${context.username} ha robado ${amount}€ a ${targetName}`);
        } else {
            const moneyLost = amount + Math.floor(Math.random() * amount / 4);
            sender.money -= moneyLost;
            if (sender.money < 0) sender.money = 0;
            return context.reply(`${context.username} ha intentado robar a ${targetName} pero ha fallado, perdiendo ${moneyLost}€`);
        }
    } catch (error) {
        context.reply(`${context.username}, ${error.message}`);
    }
}