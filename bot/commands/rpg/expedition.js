import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';

export const description = "Envía a tu personaje a una expedición (Idle) para conseguir materiales pasivamente.";
export const params = [
    { name: "zona", type: "string", required: true, values: Object.keys(RPG_CONFIG.EXPEDITIONS), description: "La zona a explorar." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const zoneKey = context.args[0];

    const config = await context.container.rpgService.startExpedition(context.username, zoneKey);

    const hours = config.durationMs / (1000 * 60 * 60);
    context.reply(`🏕️ **¡VIAJE INICIADO!**\n**${context.username}** ha pagado **${config.cost}€** y se ha adentrado en **${config.name}**.\nRegresará en **${hours} hora(s)** con su botín. Se te notificará automáticamente en el chat.`);
}