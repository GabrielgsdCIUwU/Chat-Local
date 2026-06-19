export const description = "Equipa una mascota usando su ID para recibir sus bonificaciones, o desequípala.";
export const params = [
    { name: "id_mascota", type: "string", required: true, description: "ID de la mascota (míralo en /pet list), o 'none' para desequipar." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const petId = context.args[0].trim();

    const equippedPet = await context.container.petService.equipPet(context.username, petId);

    if (equippedPet === null) {
        context.reply(`📦 **${context.username}** ha guardado su mascota. Ya no tiene ninguna equipada.`);
    } else {
        context.reply(`💖 **${context.username}** ha equipado a ${equippedPet.emoji} **${equippedPet.name}**.\n*¡Sus bonificaciones mágicas ya están activas!*`);
    }
}