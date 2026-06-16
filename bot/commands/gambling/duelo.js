import { calculateNetEarnings } from "../../utility/calculateNetEarnings.js";

const pendingDuels = new Map();
export const params = [
    {name: "usuario", type: "user", required: false},
    {name: "cantidad", type: "number", required: false},
    {name: "acción", type: "string", required: false, values: ["aceptar", "rechazar"]}
];

/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export function execute(context) {

    const action = context.args[0];
    
    if (action === "aceptar") {
        if (!pendingDuels.has(context.username)) {
            return context.reply(`${context.username} No tienes ningún duelo pendiente`)
        }

        const { challengerName, amount } = pendingDuels.get(context.username);
        pendingDuels.delete(context.username);

        try {
            const { sender: challenger, target: accepter } = context.container.gamblingService.validateTransaction(context.users, challengerName, context.username, amount);

            const result = Math.random();

            if (result < 0.5) {
                accepter.money += calculateNetEarnings(amount, accepter);
                challenger.money = Math.max(0, challenger.money - amount);
                accepter.duelWin = (accepter.duelWin || 0) + 1;
                challenger.duelLose = (challenger.duelLose || 0) + 1;

                return context.reply(`${context.username} ha ganado el duelo contra ${challengerName} y se lleva ${amount}€`);
            } else {
                accepter.money = Math.max(0, accepter.money - amount);
                challenger.money += calculateNetEarnings(amount, challenger);
                accepter.duelLose = (accepter.duelLose || 0) + 1;
                challenger.duelWin = (accepter.duelWin || 0) + 1;

                return context.reply(`${context.username} ha perdido el duelo contra ${challengerName} y le entrega ${amount}€`)
            }
        } catch (error) {
            return context.reply(`El duelo fue cancelado: ${error.message}`);
        }
    } else if (action === "rechazar") {
        if (pendingDuels.has(context.username)) {
            pendingDuels.delete(context.username);
            return context.reply(`${context.username} ha rechazado el duelo.`);
        } else {
            context.reply(`No tienes duelos pendientes @${context.username}.`);
        }
    } else {
        const targetName = context.args.slice(0, -1).join(" ");
        const amount = Number.parseInt(context.args.at(-1));

        try {
            context.container.gamblingService.validateTransaction(context.users, context.username, targetName, amount);

            if (pendingDuels.has(targetName)) {
                return context.reply(`${context.username} el usuario ${targetName} ya tiene un duelo pendiente.`);
            }

            pendingDuels.set(targetName, { challengerName: context.username, amount });
            return context.reply(`**${context.username}** ha retado a ${targetName} con ${amount}€, usa el comando /gambling duelo (**aceptar** || **rechazar**)`);
        } catch (error) {
            return context.reply(`${context.username}, ${error.message}`)
        }
    }
}