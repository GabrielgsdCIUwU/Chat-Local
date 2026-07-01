import { BaseCommand } from "../../core/BaseCommand.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";

/**
 * Displays user's current economy balance.
 * @extends BaseCommand
 */
class BalanceCommand extends BaseCommand {
    constructor() {
        super({
            name: "balance",
            description: "Muestra tu saldo actual y tus deudas pendientes.",
            params: [
                { name: "targetUser", displayName: "Usuario", type: "user", required: false, description: "Usuario del que quieres ver el balance (opcional)." }
            ]
        });
    }

    async run(context, args) {
        const targetName = args.targetUser || context.username;

        const wallet = await context.container.economyService.getBalance(targetName);

        const embed = new EmbedMessage()
            .addField("📌 Usuario", wallet.name)
            .addField("💰 Dinero actual", `${wallet.money.toLocaleString('es-ES')}€`);
        
        if (wallet.debt > 0) {
            embed.addField("💳 Deuda pendiente", `${wallet.debt}€`);
        }

        context.reply(embed.toString());
    }
}

export default new BalanceCommand();