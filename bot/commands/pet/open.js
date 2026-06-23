export const description = "Abre un huevo de tu inventario. ¡La rareza de la mascota depende de tu suerte!";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const newPet = await context.container.petService.openEgg(context.username);

    let rarityStars = "⭐";
    if (newPet.rarity === "EPIC") rarityStars = "🌟 ÉPICO 🌟";
    if (newPet.rarity === "LEGENDARY") rarityStars = "🔥🏆 LEYENDA ABSOLUTA 🏆🔥";

    context.socket.emit("gachaAnimation", newPet);

    context.reply(`✨ **¡EL HUEVO ESTÁ ECLOSIONANDO!** ✨\n\n**${context.username}** ha obtenido:\n${newPet.emoji} **${newPet.name}** [${rarityStars}]\n\n📜 *${newPet.description}*\n\n*(Usa \`/pet list\` para ver su ID y \`/pet equip\` para ponértelo)*`);
}