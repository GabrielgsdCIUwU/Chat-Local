import { BOT_CONFIG } from "../../../backend/core/constants.js";
import { BaseCommand } from "../../core/BaseCommand.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const description = "Muestra el ranking de los jugadores más ricos del servidor.";

/**
 * Displays the economy leaderboard.
 * @extends BaseCommand
 */
class TopEcoCommand extends BaseCommand {
    constructor() {
        super({
            name: "top",
            description: "Muestra el ranking de los jugadores más ricos del servidor."
        });
    }

    async run(context) {
        const topWallets = await context.container.economyService.getTopRicher(BOT_CONFIG.TOP_LIMIT_DEFAULT);

        const embed = new EmbedMessage();
        topWallets.forEach((wallet, index) => {
            embed.addField(`#${index + 1} ${wallet.name}`, `💰 ${wallet.money}€`);
        });

        context.reply(`🏆 **Los más ricos**\n${embed.toString()}`);
    }
}

export default new TopEcoCommand();