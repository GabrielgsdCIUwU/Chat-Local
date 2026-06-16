import { calculateNetEarnings } from "../../utility/calculateNetEarnings.js";

const pendingDuels = new Map();
export const params = [
    {name: "usuario", type: "user", required: false},
    {name: "cantidad", type: "number", required: false},
    {name: "acción", type: "string", required: false, values: ["aceptar", "rechazar"]}
];

/**
 * @param {import("./types/CommandContext.js").CommandContext} context 
 */
export function execute(context) {

    const action = context.args[0];
    
    if (action === "aceptar") {
        if (!pendingDuels.has(context.username)) {
            return io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username} No tienes ningún duelo pendiente`, timestamp: context.timestamp });
        }

        const { challengerName, amount } = pendingDuels.get(context.username);
        pendingDuels.delete(context.username);

        try {
            const { sender: challenger, target: accepter } = context.gamblingService.validateTransaction(context.users, challengerName, context.username, amount);

            const result = Math.random();

            if (result < 0.5) {
                accepter.money += calculateNetEarnings(amount, accepter);
                challenger.money = Math.max(0, challenger.money - amount);
                accepter.duelWin = (accepter.duelWin || 0) + 1;
                challenger.duelLose = (challenger.duelLose || 0) + 1;

                context.io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username} ha ganado el duelo contra ${challengerName} y se lleva ${amount}€`, timestamp: context.timestamp });
            } else {
                accepter.money = Math.max(0, accepter.money - amount);
                challenger.money += calculateNetEarnings(amount, challenger);
                accepter.duelLose = (accepter.duelLose || 0) + 1;
                challenger.duelWin = (accepter.duelWin || 0) + 1;

                context.io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username} ha perdido el duelo contra ${challengerName} y le entrega ${amount}€`, timestamp: context.timestamp });
            }
        } catch (error) {
            return context.io.emit("sendmsg", { user: "🤖 Bot", message: `El duelo fue cancelado: ${error.message}`, timestamp: context.timestamp });
        }
    } else if (action === "rechazar") {
        if (pendingDuels.has(context.username)) {
            pendingDuels.delete(context.username);
            context.io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username} ha rechazado el duelo.`, timestamp: context.timestamp });
        } else {
            context.io.emit("sendmsg", { user: "🤖 Bot", message: `No tienes duelos pendientes @${context.username}.`, timestamp: context.timestamp });
        }
    } else {
        const targetName = context.args.slice(0, -1).join(" ");
        const amount = Number.parseInt(context.args.at(-1));

        try {
            context.gamblingService.validateTransaction(context.users, context.username, targetName, amount);

            if (pendingDuels.has(targetName)) {
                 return context.io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username} el usuario ${targetName} ya tiene un duelo pendiente.`, timestamp: context.timestamp });
            }

            pendingDuels.set(targetName, { challengerName: context.username, amount });
            context.io.emit("sendmsg", { user: "🤖 Bot", message: `**${context.username}** ha retado a ${targetName} con ${amount}€, usa el comando /gambling duelo (**aceptar** || **rechazar**)`, timestamp: context.timestamp });
        } catch (error) {
            context.io.emit("sendmsg", { user: "🤖 Bot", message: `${context.username}, ${error.message}`, timestamp: context.timestamp });
        }
    }
}