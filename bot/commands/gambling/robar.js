import { GAME_CONFIG } from "../../../backend/core/constants.js";

export const description = "Intenta robar dinero a otro jugador. A mayor cantidad, más fácil que te atrapen.";
export const params = [
    { name: "usuario", type: "user", required: true, description: "Víctima a la que deseas robar." },
    { name: "dinero", type: "number", required: true, description: "Cantidad que vas a intentar robar." }
];

const calculatePenalty = (amount) => {
    return amount + Math.floor(amount / GAME_CONFIG.ROB_CONFIG.PENALTY_DIVISOR);
};

const getCooldownMessage = (timeLeftMs) => {
    const minutes = Math.floor(timeLeftMs / 60000);
    const seconds = Math.floor((timeLeftMs % 60000) / 1000);
    return `🚨 **Buscado por la policía:** Debes permanecer escondido durante **${minutes}m y ${seconds}s** antes de intentar robar de nuevo.`;
};

const getSuccessMessage = (thief, victim, amount, percentage, petMsg) => {
    const { STEALTH, HEIST } = GAME_CONFIG.ROB_CONFIG.THRESHOLDS;
    
    if (percentage <= STEALTH) return `👻 **Como un fantasma:** ${thief} le robó **${amount}€** a ${victim} y ni se dio cuenta${petMsg}.`;
    if (percentage >= HEIST) return `👑 **¡EL GOLPE DEL SIGLO!** Contra todo pronóstico, ${thief} le vació los bolsillos (**${amount}€**) a ${victim} con maestría${petMsg}.`;
    
    return `🕵️ ${thief} ha robado **${amount}€** a ${victim} con éxito${petMsg}.`;
};

const getFailureMessage = (thief, victim, penalty, percentage) => {
    const { CLUMSY, GREEDY } = GAME_CONFIG.ROB_CONFIG.THRESHOLDS;
    
    if (percentage >= GREEDY) return `🚨 **Demasiado avaricioso:** ${thief} intentó robar casi todo el dinero de ${victim}. Hizo tanto ruido que la policía lo atrapó al instante, pagando **${penalty}€** en multas.`;
    if (percentage <= CLUMSY) return `🤦 **Mala suerte:** ${thief} intentó robar una miseria a ${victim}, pero tropezó absurdamente y la policía lo atrapó, perdiendo **${penalty}€**.`;
    
    return `👮 ${thief} intentó robar a ${victim} pero la policía lo atrapó, perdiendo **${penalty}€** en multas.`;
};

/**
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));
    const eco = context.container.economyService;
    const now = Date.now();

    if (context.username === targetName) return context.reply("No puedes robarte a ti mismo.");
    if (Number.isNaN(amount) || amount <= 0) return context.reply("Cantidad no válida.");

    const users = await context.container.gamblingRepository.getAll();
    const thiefProfile = users.find(u => u.name === context.username);
    
    if (thiefProfile?.lastRobbery) {
        const timePassed = now - thiefProfile.lastRobbery;
        if (timePassed < GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS) {
            return context.reply(getCooldownMessage(GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS - timePassed));
        }
    }

    const thiefWallet = await eco.getBalance(context.username);
    const maxPossibleFine = calculatePenalty(amount);
    
    if (thiefWallet.money < maxPossibleFine) {
        return context.reply(`Para intentar robar **${amount}€**, necesitas tener al menos **${maxPossibleFine}€** en tu cuenta para cubrir la fianza en caso de que la policía te atrape.`);
    }

    try {
        const victimWallet = await eco.getBalance(targetName);
        if (victimWallet.money < amount) return context.reply(`La víctima solo tiene ${victimWallet.money}€.`);

        const percentageStolen = amount / victimWallet.money; 
        const { MAX_CHANCE, CHANCE_SCALING } = GAME_CONFIG.ROB_CONFIG;
        const successChance = MAX_CHANCE - (percentageStolen * CHANCE_SCALING);

        const wardConsumed = await context.container.craftingService.consumeBuff(targetName, "anti_rob");
        let finalMessage = "";

        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
            gambler.timesSteal = (gambler.timesSteal || 0) + 1;
            gambler.lastRobbery = now;

            if (wardConsumed) {
                const penaltyLost = await eco.forceRemoveFunds(context.username, calculatePenalty(amount));
                gambler.spend = (gambler.spend || 0) + penaltyLost;
                finalMessage = `🛡️ **¡THIEF WARD ACTIVADO!**\n¡**${targetName}** estaba protegido por una poderosa barrera mágica! La protección se rompió al bloquear el robo y **${context.username}** fue repelido violentamente, pagando una multa de **${penaltyLost}€**.`;
                return;
            }

            if (Math.random() < successChance) {
                const { totalEarned, petMsg } = await context.container.gamblingService.processRobberyWin(context.username, targetName, amount);
                              
                gambler.moneySteal = (gambler.moneySteal || 0) + totalEarned;
                gambler.totalEarnings = (gambler.totalEarnings || 0) + totalEarned;
                
                finalMessage = getSuccessMessage(context.username, targetName, amount, percentageStolen, petMsg);
            
            } else {
                const penaltyLost = await eco.forceRemoveFunds(context.username, calculatePenalty(amount));
                gambler.spend = (gambler.spend || 0) + penaltyLost;
                
                finalMessage = getFailureMessage(context.username, targetName, penaltyLost, percentageStolen);
            }
        });

        return context.reply(finalMessage);
    } catch (error) {
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
}