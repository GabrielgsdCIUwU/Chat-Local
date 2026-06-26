import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to propose or resolve a direct trade between players.
 * @extends BaseCommand
 */
class TradeCommand extends BaseCommand {
    constructor() {
        super({
            name: "trade",
            description: "Propón un intercambio directo a otro jugador o acepta/rechaza uno.",
            params: [
                { name: "action", displayName: "Usuario o acción", type: "string", required: true, description: "Usuario, o 'aceptar'/'rechazar'." },
                { name: "sendAmount", displayName: "Cantidad ofreces", type: "number", required: false, description: "Cantidad que ofreces." },
                { name: "sendItem", displayName: "Item ofreces", type: "inventory_item", required: false, description: "Item que ofreces." },
                { name: "reqAmount", displayName: "Cantidad pides", type: "number", required: false, description: "Cantidad que pides." },
                { name: "reqItem", displayName: "Item pides", type: "string", required: false, description: "Item que pides." }
            ]
        });
    }
    
    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
         const { action, sendAmount, sendItem, reqAmount, reqItem } = args;
        const actionLower = action.toLowerCase();
        
        if (actionLower === "aceptar" || actionLower === "rechazar") {
            const isAccept = actionLower === "aceptar";
            const trade = await context.container.marketService.resolveTrade(context.username, isAccept);
            
            if (!isAccept) {
                return context.reply(`❌ **${context.username}** ha rechazado el intercambio pendiente.`);
            }

            return context.reply(`🤝 **¡INTERCAMBIO EXITOSO!**\n**${trade.senderName}** ha entregado ${trade.sendAmount}x ${trade.sendItem} a cambio de ${trade.reqAmount}x ${trade.reqItem} de **${context.username}**.`);
        }

        const targetName = action;

        if (!sendAmount || !sendItem || !reqAmount || !reqItem) {
            throw new Error("Faltan parámetros. Uso: `/market trade [usuario] [mi_cantidad] [mi_item] [su_cantidad] [su_item]`");
        }

        const result = await context.container.marketService.proposeTrade(context.username, targetName, sendItem, sendAmount, reqItem, reqAmount);

        context.reply(`🔄 **NUEVA PROPUESTA DE INTERCAMBIO**\n**${context.username}** ofrece **${sendAmount}x ${result.sItemActual}** a **${targetName}** a cambio de **${reqAmount}x ${result.rItemActual}**.\n*(Usa \`/market trade aceptar\` o \`/market trade rechazar\`)*`);
    }
}
export default new TradeCommand();