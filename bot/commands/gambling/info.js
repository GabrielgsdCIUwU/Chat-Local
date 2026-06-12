import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const params = [
    {name: "usuario", type: "user", required: false}
];

/**
 * @param {import("./types/CommandContext.js").CommandContext} context 
 */
export function execute(context) {
    const targetName = context.args.join(" ") || context.username;
    const gambler = context.users.find(u => u.name === targetName);
    if (!gambler) {
        return context.io.emit("sendmsg", { user: "🤖 Bot", message: `${targetName} no existe o no tiene estadísticas de apuestas @${context.username}`, timestamp: context.timestamp });
    }

    const totalGames = (gambler.totalEarnings || 0) + (gambler.spend || 0);
    const success = totalGames > 0 ? (gambler.totalEarnings / totalGames) * 100 : 0;

    const totalDuels = (gambler.duelWin || 0) + (gambler.duelLose || 0);
    const duelSuccess = totalDuels > 0 ? (gambler.duelWin / totalDuels) * 100 : 0;
    
    const embed = new EmbedMessage()
        .addField("📌 Nombre", gambler.name)
        .addField("💰 Dinero actual", `${gambler.money}€`)
        .addField("💶 Total ganancias", `${gambler.totalEarnings}€`)
        .addField("💸 Gastado", `${gambler.spend}€`)
        .addField("📊 Porcentaje de éxito", `${success.toFixed(2)}%`)
        .addField("🕵️ Robado", `${gambler.timesSteal} veces`)
        .addField("🏴‍☠️ Dinero robado: ", `${gambler.moneySteal}€`)
        .addField("📤 Dinero donado: ", `${gambler.donated ?? 0}€`)
        .addField("🤺 Duelos ganados", gambler.duelWin)
        .addField("💀 Duelos perdidos", gambler.duelLose)
        .addField("📊 Exito de duelos", `${duelSuccess.toFixed(2)}%`)
        .addField("🏦 Banca rota", `${gambler.bankRupt} veces`)
        .addField("💳 Deuda", `${gambler.debt}€`);


    return context.io.emit("sendmsg", { user: "🤖 Bot", message: embed.toString(), timestamp: context.timestamp })

}