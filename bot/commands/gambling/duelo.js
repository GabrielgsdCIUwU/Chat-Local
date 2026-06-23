const pendingDuels = new Map();
export const description = "Reta a otro jugador a un duelo a muerte por dinero.";
export const params = [
    { name: "usuario", type: "user", required: false, description: "Usuario a retar." },
    { name: "cantidad", type: "number", required: false, description: "Cantidad a apostar." },
    { name: "acción", type: "string", required: false, values: ["aceptar", "rechazar"], description: "Acepta o rechaza un duelo pendiente." }
];

/**
 * 
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const action = context.args[0];
    const eco = context.container.economyService;
    
    if (action === "aceptar") {
        if (!pendingDuels.has(context.username)) {
            return context.reply(`${context.username} No tienes ningún duelo pendiente.`)
        }

        const { challengerName, amount } = pendingDuels.get(context.username);
        pendingDuels.delete(context.username);

        try {
            const challengerWallet = await eco.getBalance(challengerName);
            const accepterWallet = await eco.getBalance(context.username);
            
            if (challengerWallet.money < amount) return context.reply(`El duelo se cancela: ${challengerName} ya no tiene fondos.`);
            if (accepterWallet.money < amount) return context.reply(`El duelo se cancela: ${context.username} no tiene fondos.`);

            const result = Math.random();
            let finalMessage = "";

            await context.container.gamblingRepository.executeTransaction(async (users) => {
                const accepterGambler = context.container.gamblingRepository.ensureUser(users, context.username);
                const challengerGambler = context.container.gamblingRepository.ensureUser(users, challengerName);

                if (result < 0.5) {
                    await eco.transferFunds(challengerName, context.username, amount);
                    accepterGambler.duelWin = (accepterGambler.duelWin || 0) + 1;
                    challengerGambler.duelLose = (challengerGambler.duelLose || 0) + 1;
                    finalMessage = `⚔️ **${context.username}** ha ganado el duelo contra **${challengerName}** y se lleva ${amount}€`;
                } else {
                    await eco.transferFunds(context.username, challengerName, amount);
                    accepterGambler.duelLose = (accepterGambler.duelLose || 0) + 1;
                    challengerGambler.duelWin = (challengerGambler.duelWin || 0) + 1;
                    finalMessage = `⚔️ **${context.username}** ha perdido el duelo contra **${challengerName}** y le entrega ${amount}€`;
                }
            });

            return context.reply(finalMessage);
        } catch (error) {
            return context.reply(`El duelo fue cancelado: ${error.message}`);
        }
        
    } else if (action === "rechazar") {
        if (pendingDuels.has(context.username)) {
            pendingDuels.delete(context.username);
            return context.reply(`${context.username} ha rechazado el duelo.`);
        }
    } else {
        const targetName = context.args.slice(0, -1).join(" ");
        const amount = Number.parseInt(context.args.at(-1));

        if (context.username === targetName) return context.reply("No puedes retarte a ti mismo.");
        if (Number.isNaN(amount) || amount <= 0) return context.reply("Cantidad no válida.");

        const senderWallet = await eco.getBalance(context.username);
        if (senderWallet.money < amount) return context.reply(`No tienes suficiente dinero para apostar ${amount}€.`);

        if (pendingDuels.has(targetName)) return context.reply(`El usuario ${targetName} ya tiene un duelo pendiente.`);

        pendingDuels.set(targetName, { challengerName: context.username, amount });
        return context.reply(`⚔️ **${context.username}** ha retado a **${targetName}** con ${amount}€. Usa \`/gambling duelo aceptar\` o \`/gambling duelo rechazar\`.`);
    }
}