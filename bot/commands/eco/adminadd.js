import { ROLES } from "../../../backend/core/constants.js";

export const params = [
    { name: "usuario", type: "user", required: true },
    { name: "cantidad", type: "number", required: true }
];

export async function execute(context) {
    const user = await context.container.userRepository.findByName(context.username);
    if (!user?.roles.includes(ROLES.ADMIN)) {
        return context.reply("❌ No tienes permisos de administrador para usar este comando.");
    }

    const targetName = context.args.slice(0, -1).join(" ");
    const amount = Number.parseInt(context.args.at(-1));

    if (Number.isNaN(amount)) return context.reply("Cantidad inválida.");

    try {
        await context.container.economyService.addFunds(targetName, amount);
        context.reply(`👑 **ADMIN:** Se han inyectado ${amount}€ en la cuenta de **${targetName}**.`);
    } catch (error) {
        context.reply(`❌ Error: ${error.message}`);
    }
}