import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * Administrator command to inject money into the economy.
 * @extends BaseCommand
 */
class AdminAddCommand extends BaseCommand {
    constructor() {
        super({
            name: "adminadd",
            description: "Comando de administrador para inyectar dinero a un usuario.",
            adminOnly: true,
            params: [
                { name: "targetUser", displayName: "Usuario", type: "user", required: true, description: "Usuario al que se le dará el dinero." },
                { name: "amount", displayName: "Cantidad", type: "number", required: true, description: "Cantidad de dinero a añadir." }
            ]
        });
    }

    /**
     * Executes the injection domain logic.
     * 
     * @param {import('../../core/BotContext.js').BotContext} context 
     * @param {Object} args 
     * @param {string} args.targetUser - The recipient's username.
     * @param {number} args.amount - The amount to inject.
     */
    async run(context, args) {
        const { targetUser, amount } = args;

        await context.container.economyService.addFunds(targetUser, amount);
        
        context.reply(`👑 **ADMIN:** Se han inyectado ${amount}€ en la cuenta de **${targetUser}**.`);
    }
}

export default new AdminAddCommand();