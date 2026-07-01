import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to open a gacha egg and receive a random pet.
 * @extends BaseCommand
 */
class OpenCommand extends BaseCommand {
    constructor() {
        super({
            name: "open",
            description: "Abre un huevo de tu inventario. ¡La rareza de la mascota depende de tu suerte!"
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const newPet = await context.container.petService.openEgg(context.username);

        let rarityStars = "⭐";
        if (newPet.rarity === "EPIC") rarityStars = "🌟 ÉPICO 🌟";
        if (newPet.rarity === "LEGENDARY") rarityStars = "🔥🏆 LEYENDA ABSOLUTA 🏆🔥";

        context.socket.emit("gachaAnimation", newPet);

        context.reply(`✨ **¡EL HUEVO ESTÁ ECLOSIONANDO!** ✨\n\n**${context.username}** ha obtenido:\n${newPet.emoji} **${newPet.name}** [${rarityStars}]\n\n📜 *${newPet.description}*\n\n*(Usa \`/pet list\` para ver su ID y \`/pet equip\` para ponértelo)*`);
    }
}
export default new OpenCommand();