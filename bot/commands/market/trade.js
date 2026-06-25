export const description = "Propón un intercambio directo a otro jugador o acepta/rechaza uno.";
export const params = [
    { name: "accion_o_usuario", type: "string", required: true, description: "Usuario, o 'aceptar'/'rechazar'." },
    { name: "mi_cantidad", type: "number", required: false, description: "Cantidad que ofreces." },
    { name: "mi_item", type: "inventory_item", required: false, description: "Item que ofreces." },
    { name: "su_cantidad", type: "number", required: false, description: "Cantidad que pides." },
    { name: "su_item", type: "string", required: false, description: "Item que pides." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const action = context.args[0].toLowerCase();
    
    if (action === "aceptar" || action === "rechazar") {
        const isAccept = action === "aceptar";
        const trade = await context.container.marketService.resolveTrade(context.username, isAccept);
        
        if (!isAccept) {
            return context.reply(`❌ **${context.username}** ha rechazado el intercambio pendiente.`);
        }

        return context.reply(`🤝 **¡INTERCAMBIO EXITOSO!**\n**${trade.senderName}** ha entregado ${trade.sendAmount}x ${trade.sendItem} a cambio de ${trade.reqAmount}x ${trade.reqItem} de **${context.username}**.`);
    }

    if (context.args.length < 5) {
        throw new Error("Faltan parámetros. Uso: `/market trade [usuario] [mi_cantidad] [mi_item] [su_cantidad] [su_item]`");
    }

    const targetName = context.args[0];
    const sendAmount = Number.parseInt(context.args[1], 10);
    const sendItem = context.args[2];
    const reqAmount = Number.parseInt(context.args[3], 10);
    const reqItem = context.args.slice(4).join(" "); 

    const result = await context.container.marketService.proposeTrade(context.username, targetName, sendItem, sendAmount, reqItem, reqAmount);

    context.reply(`🔄 **NUEVA PROPUESTA DE INTERCAMBIO**\n**${context.username}** ofrece **${sendAmount}x ${result.sItemActual}** a **${targetName}** a cambio de **${reqAmount}x ${result.rItemActual}**.\n*(Usa \`/market trade aceptar\` o \`/market trade rechazar\`)*`);
}