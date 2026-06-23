import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";

export const description = `Compra uno o varios huevos sorpresa de mascota (Precio: ${RPG_CONFIG.EGG_PRICE}€ c/u).`;
export const params = [
    { name: "cantidad", type: "number", required: false, description: "Cantidad de huevos a comprar (por defecto 1)." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    let amount = 1;
    if (context.args[0]) {
        amount = Number.parseInt(context.args[0], 10);
    }

    const totalCost = await context.container.petService.buyEgg(context.username, amount);

    context.reply(`🥚 **¡COMPRA EXITOSA!**\n**${context.username}** ha comprado **${amount} huevo(s)** por **${totalCost}€**.\n*(Usa \`/pet open\` para ver qué hay dentro)*`);
}