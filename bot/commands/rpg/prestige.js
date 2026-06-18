/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    if (context.args[0] !== "confirm") {
        return context.reply("⚠️ **ADVERTENCIA:** Prestigiarte ELIMINARÁ todo tu dinero, restablecerá tu herramienta al nivel 1 y borrará tu inventario. A cambio, obtendrás un multiplicador de Prestigio permanente.\nPara continuar, escribe: `/rpg prestige confirm`.")
    }

    const newPrestige = await context.container.rpgService.executePrestige(context.username);

    context.reply(`🌟 **¡PRESTIGIO ALCANZADO!** 🌟\n**${context.username}** ha sacrificado su riqueza y ha alcanzado el **Nivel de Prestigio ${newPrestige}**. ¡Su nombre será recordado para siempre en las leyendas!`);
}