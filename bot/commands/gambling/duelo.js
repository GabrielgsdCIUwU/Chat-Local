import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/** @type {Map<string, { challengerName: string, amount: number }>} */
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
                { name: "action", displayName: "Acción", type: "string", required: true, values: ["retar", "aceptar", "rechazar"], description: "Elige entre retar, aceptar o rechazar un duelo." },
                { name: "targetUser", displayName: "Usuario", type: "user", required: false, description: "Usuario al que quieres retar (requerido para retar)." },
                { name: "amount", displayName: "Cantidad", type: "number", required: false, description: "Cantidad de dinero a apostar (requerido para retar)." }
            ]
        });
    }

    /**
     * Executes the duel resolution and statistics assignment.
     * 
     * @param {BotContext} context - Command execution context.
     * @param {Record<string, any>} args - Parameter arguments.
     * @returns {Promise<void>}
     */
    async run(context, args) {
        const { action, amount, targetUser } = args;
        const eco = context.container.economyService;
        const actionLower = action.toLowerCase();

        if (actionLower === "aceptar") {
            if (!pendingDuels.has(context.username)) {
                throw new Error("No tienes ningún duelo pendiente.");
            }

            const duelData = pendingDuels.get(context.username);
            if (!duelData) throw new Error("No se pudo recuperar los datos del duelo.");

            const { challengerName, amount: duelAmount } = duelData;
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

        } else if (actionLower === "rechazar") {
            if (pendingDuels.has(context.username)) {
                pendingDuels.delete(context.username);
                return context.reply(`❌ **${context.username}** ha rechazado el duelo.`);
            }
            throw new Error("No tienes ningún duelo pendiente para rechazar.");

        } else if (actionLower === "retar") {
            if (!targetUser || !amount) {
                throw new Error("Para retar debes especificar la cantidad y el usuario. Ej: `/gambling duelo retar Usuario 100`.");
            }
            if (context.username === targetUser) throw new Error("No puedes retarte a ti mismo.");

            const senderWallet = await eco.getBalance(context.username);
            if (senderWallet.money < amount) throw new Error(`No tienes suficiente dinero para apostar ${amount}€.`);

            if (pendingDuels.has(targetUser)) throw new Error(`El usuario ${targetUser} ya tiene un duelo pendiente.`);

            pendingDuels.set(targetUser, { challengerName: context.username, amount });
            return context.reply(`⚔️ **${context.username}** ha retado a **${targetUser}** con **${amount}€**. Usa \`/gambling duelo aceptar\` o \`/gambling duelo rechazar\`.`);
        }
    }

    /**
     * Sequentially updates statistical parameters of duelists.
     * 
     * @param {typeof import('../../../backend/core/DIContainer.js').container} container - Dependency injection container.
     * @param {string} winner - Match winner username.
     * @param {string} loser - Match loser username.
     * @returns {Promise<void>}
     */
    async #updateDuelStats(container, winner, loser) {
        await container.gamblingRepository.updateTransactional(winner, (winnerGambler) => {
            winnerGambler.recordDuelWin();
        });
        await container.gamblingRepository.updateTransactional(loser, (loserGambler) => {
            loserGambler.recordDuelLose();
        });
    }
}

export default new DueloCommand();