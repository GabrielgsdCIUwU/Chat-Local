import { GAME_CONFIG } from '../../../backend/core/constants.js';
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to create a new Guild.
 * @extends BaseCommand
 */
class CreateGuildCommand extends BaseCommand {
    constructor() {
        super({
            name: "create",
            description: "Funda un nuevo gremio inviertiendo dinero.",
            params: [
                { name: "guildName", type: "string", required: true, description: "El nombre de tu nuevo gremio." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { guildName } = args;

        const newGuild = await context.container.guildService.createGuild(context.username, guildName);

        context.reply(`🏰 **¡SE HA FUNDADO UN NUEVO GREMIO!**\n**${context.username}** ha invertido ${GAME_CONFIG.GUILD_CREATION_COST.toLocaleString("es-ES")}€ para fundar el gremio **[${newGuild.name}]**. ¡Que su legado perdure a través de las eras!`);
    }
}
export default new CreateGuildCommand();