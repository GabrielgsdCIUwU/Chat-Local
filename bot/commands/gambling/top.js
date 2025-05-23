import { EmbedMessage } from "../../utility/EmbedMessage.js";

export function execute({  args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt}) {
    const timestamp = new Date().getTime();

    const sorted = [...currenData].sort((a, b) => {
        if (b.money !== a.money) {
            return b.money - a.money;
        }

        // Calcular % exito en duelos
        const aDuels = (a.duelWin || 0) + (a.duelLose || 0);
        const bDuels = (b.duelWin || 0) + (b.duelLose || 0);

        const aWinRate = aDuels > 0 ? a.duelWin / aDuels : 0;
        const bWinRate = bDuels > 0 ? b.duelWin / bDuels : 0;

        return bWinRate - aWinRate;
    });

    const topList = sorted.slice(0, 10).map((user, index) => {
        const totalDuels = (user.duelWin || 0) + (user.duelLose || 0);
        const winRate = totalDuels > 0
        ? ((user.duelWin / totalDuels) * 100).toFixed(2) + "%"
        : "N/A";

        return {
            name: `#${index + 1} ${user.name}`,
            value: `💰 ${user.money}€ | 🥊 Éxito en duelos: ${winRate}`
        };
    });

    const embed = new EmbedMessage();
    topList.forEach(entry => embed.addField(entry.name, entry.value));

    io.emit("sendmsg", { user: "🤖 Bot", message: `🏆 Ranking de riqueza\n${embed.toString()}`, timestamp });
}