import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * Command to transfer money between players.
 * @extends BaseCommand
 */
class TransferCommand extends BaseCommand {
    constructor() {
        super({
            name: "transfer",
            description: "Transfiere dinero de tu cartera a otro jugador.",
            params: [
                { name: "targetUser", displayName: "Usuario", type: "user", required: true, description: "Usuario que recibirá el dinero." },
                { name: "amount", displayName: "Cantidad", type: "number", required: true, description: "Cantidad a transferir." }
            ]
        });
    }

    /**
     * Executes the transfer domain logic.
     * 
     * @param {import('../../core/BotContext.js').BotContext} context 
     * @param {Object} args
     * @param {string} args.targetUser - The recipient's username.
     * @param {number} args.amount - The amount to transfer.
     */
    async run(context, args) {
        const { targetUser, amount } = args;

        await context.container.economyService.transferFunds(context.username, targetUser, amount);
        
        context.reply(`💸 **${context.username}** ha transferido ${amount}€ a **${targetUser}**.`);
    }
}

export default new TransferCommand();