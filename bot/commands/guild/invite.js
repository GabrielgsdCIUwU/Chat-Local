import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */


/**
 * Command to invite a user to the guild.
 * @extends BaseCommand
 */
class InviteGuildCommand extends BaseCommand {
    constructor() {
        super({
            name: "invite",
            description: "Invita a un jugador a tu gremio (Solo Líder/Oficial).",
            params: [
                { name: "targetUser", displayName: "Usuario", type: "user", required: true, description: "Usuario al que quieres invitar." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { targetUser } = args;

        if (targetUser === context.username) {
            throw new Error("No puedes invitarte a ti mismo.");
        }

        const guildName = await context.container.guildService.inviteMember(context.username, targetUser);
        context.reply(`🏰 **INVITACIÓN A GREMIO**\n**${context.username}** ha invitado a **${targetName}** a unirse al gremio **[${guildName}]**.\n*(Usa \`/guild join\` o \`/guild reject\`)*`);
    }
}
export default new InviteGuildCommand();