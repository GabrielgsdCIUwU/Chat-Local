import { actualEarningsPayingDebt } from "../../utility/actualEarningsPayingDebt.js";

export const params = [
    { name: "usuario", type: "user", required: true },
    { name: "dinero", type: "number", required: true }
]
/**
 * 
 * @param {import("./types/CommandContext.js").CommandContext} context 
 */
export function execute(context) {
    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));

    try {
        const { sender, target } = context.gamblingService.validateTransaction(context.users, context.username, targetName, amount);

        sender.money -= amount;
        target.money += actualEarningsPayingDebt(amount, target);

        if (!sender.donated) sender.donated = 0;
        sender.donated += amount;

        context.io.emit("sendmsg", { 
            user: "🤖 Bot", 
            message: `${username} ha regalado ${amount}€ a ${targetName}`, 
            timestamp: context.timestamp
        });
    } catch (error) {
        context.io.emit("sendmsg", { 
            user: "🤖 Bot", 
            message: `${username}, ${error.message}`, 
            timestamp: context.timestamp 
        });
    }

}