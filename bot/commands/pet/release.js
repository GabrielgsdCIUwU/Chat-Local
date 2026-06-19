export const description = "Libera a una de tus mascotas a cambio de una compensación económica del 50%.";
export const params = [
    { name: "id_mascota", type: "string", required: true, description: "ID de la mascota (míralo usando /pet list)." }
];

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context
 */
export async function execute(context) {
    const petId = context.args[0].trim();

    const { petConfig, refundAmount } = await context.container.petService.releasePet(context.username, petId);

    context.reply(`🌿 **¡MASCOTA LIBERADA!**\n**${context.username}** ha liberado a su ${petConfig.emoji} **${petConfig.name}** en la naturaleza.\nComo agradecimiento por cuidarla, el Gremio de Aventureros te ha compensado con **${refundAmount}€**.`);
}