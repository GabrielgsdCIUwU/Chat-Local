import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

const pendingDuels = new Map();

/**
 * Command to challenge other players to a duel.
 * @extends BaseCommand
 */
class DueloCommand extends BaseCommand {
    constructor() {
        super({
            name: "duelo",
            description: "Reta a otro jugador a duelo a muerte por dinero.",
            params: [
                { name: "usuario", type: "user", required: false, description: "Usuario a retar." },
                { name: "cantidad", type: "number", required: false, description: "Cantidad a apostar." },
                { name: "acción", type: "string", required: false, values: ["aceptar", "rechazar"], description: "Acepta o rechaza un duelo pendiente." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { action, amount, targetUser } = args;
        const eco = context.container.economyService;

        if (action === "aceptar") {
            if (!pendingDuels.has(context.username)) {
                throw new Error("No tienes ningún duelo pendiente.");
            }

            const { challengerName, amount: duelAmount } = pendingDuels.get(context.username);
            pendingDuels.delete(context.username);

            const challengerWallet = await eco.getBalance(challengerName);
            const accepterWallet = await eco.getBalance(context.username);

            if (challengerWallet.money < duelAmount) throw new Error(`El duelo se cancela: ${challengerName} ya no tiene fondos.`);
            if (accepterWallet.money < duelAmount) throw new Error(`El duelo se cancela: no tienes fondos suficientes.`);

            const result = Math.random();
            let finalMessage = "";

            if (result < 0.5) {
                await eco.transferFunds(challengerName, context.username, duelAmount);
                await this.#updateDuelStats(context.container, context.username, challengerName);
                finalMessage = `⚔️ **${context.username}** ha ganado el duelo contra **${challengerName}** y se lleva **${duelAmount}€**`;
            } else {
                await eco.transferFunds(context.username, challengerName, duelAmount);
                await this.#updateDuelStats(context.container, challengerName, context.username);
                finalMessage = `⚔️ **${context.username}** ha perdido el duelo contra **${challengerName}** y le entrega **${duelAmount}€**`;
            }

            return context.reply(finalMessage);

        } else if (action === "rechazar") {
            if (pendingDuels.has(context.username)) {
                pendingDuels.delete(context.username);
                return context.reply(`❌ **${context.username}** ha rechazado el duelo.`);
            }
            throw new Error("No tienes ningún duelo pendiente para rechazar.");

        } else if (action === "retar") {
            if (!targetUser || !amount) {
                throw new Error("Para retar debes especificar la cantidad y el usuario. Ej: `/gambling duelo retar 100 Usuario`.");
            }
            if (context.username === targetUser) throw new Error("No puedes retarte a ti mismo.");

            const senderWallet = await eco.getBalance(context.username);
            if (senderWallet.money < amount) throw new Error(`No tienes suficiente dinero para apostar ${amount}€.`);

            if (pendingDuels.has(targetUser)) throw new Error(`El usuario ${targetUser} ya tiene un duelo pendiente.`);

            pendingDuels.set(targetUser, { challengerName: context.username, amount });
            return context.reply(`⚔️ **${context.username}** ha retado a **${targetUser}** con **${amount}€**. Usa \`/gambling duelo aceptar\` o \`/gambling duelo rechazar\`.`);
        }
    }

    async #updateDuelStats(container, winner, loser) {
        await container.gamblingRepository.executeTransaction(async (users) => {
            const winnerGambler = container.gamblingRepository.ensureUser(users, winner);
            const loserGambler = container.gamblingRepository.ensureUser(users, loser);
            winnerGambler.duelWin = (winnerGambler.duelWin || 0) + 1;
            loserGambler.duelLose = (loserGambler.duelLose || 0) + 1;
        });
    }
}

export default new DueloCommand();