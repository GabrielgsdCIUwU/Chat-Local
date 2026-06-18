export const description = "Dona dinero al banco de tu gremio para subirlo de nivel.";
export const params = [
    { name: "cantidad", type: "number", required: true, description: "Cantidad de dinero a donar." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const amount = Number.parseInt(context.args[0], 10);

    const result = await context.container.guildService.donate(context.username, amount);

    let msg = `💰 **DONACIÓN**\n**${context.username}** ha donado **${amount.toLocaleString('es-ES')}€** al banco de su gremio.`;
    
    if (result.levelUp) {
        msg += `\n🌟 **¡SUBIDA DE NIVEL!** El gremio ha alcanzado el **Nivel ${result.currentLevel}**.`;
    }

    context.reply(msg);
}