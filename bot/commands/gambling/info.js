import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const description = "Muestra las estadísticas de apuestas, robos y duelos de un jugador.";
export const params = [
    { name: "usuario", type: "user", required: false, description: "Usuario del que quieres ver las estadísticas." }
];

/**
 * 
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const targetName = context.args.join(" ") || context.username;
    
    const users = await context.container.gamblingRepository.getAll();
    const gambler = users.find(u => u.name === targetName);
    
    if (!gambler) {
        return context.reply(`${targetName} no tiene estadísticas de apuestas registradas.`);
    }

    const wallet = await context.container.economyService.getBalance(targetName);

    const totalGames = (gambler.totalEarnings || 0) + (gambler.spend || 0);
    const success = totalGames > 0 ? (gambler.totalEarnings / totalGames) * 100 : 0;
    const totalDuels = (gambler.duelWin || 0) + (gambler.duelLose || 0);
    const duelSuccess = totalDuels > 0 ? (gambler.duelWin / totalDuels) * 100 : 0;
    
    const embed = new EmbedMessage()
        .addField("📌 Nombre", gambler.name)
        .addField("💰 Dinero actual", `${wallet.money}€`)
        .addField("💳 Deuda actual", `${wallet.debt}€`)
        .addField("💶 Total ganado", `${gambler.totalEarnings || 0}€`)
        .addField("💸 Total gastado", `${gambler.spend || 0}€`)
        .addField("📊 Porcentaje de éxito", `${success.toFixed(2)}%`)
        .addField("🕵️ Veces que robó", `${gambler.timesSteal || 0} veces`)
        .addField("🏴‍☠️ Dinero robado", `${gambler.moneySteal || 0}€`)
        .addField("🤺 Duelos ganados", gambler.duelWin || 0)
        .addField("💀 Duelos perdidos", gambler.duelLose || 0)
        .addField("📊 Éxito de duelos", `${duelSuccess.toFixed(2)}%`)
        .addField("🏦 Veces en Banca rota", `${gambler.bankRupt || 0} veces`);

    return context.reply(embed.toString());
}