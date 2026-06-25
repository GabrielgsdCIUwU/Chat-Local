import { BaseCommand } from "../core/BaseCommand.js";

/**
 * Horoscopo command.
 * @extends BaseCommand
 */
class HoroscopoCommand extends BaseCommand {
    constructor() {
        super({
            name: "horoscopo",
            description: "Calcula tu horóscopo aleatorio para el día de hoy.",
            params: [
                { name: "usuario", type: "user", required: false, description: "Usuario al que le quieres leer el horóscopo." }
            ]
        });
    }

    async run(context, args) {
        let finalUser;

        const targetName = context.args[0];
        if (targetName) {
            finalUser = targetName;
        } else {
            finalUser = context.username;
        }

        context.reply(`El horóscopo de ${finalUser}:\n**Amor**:${random()}%\n**Salud**:${random()}%\n**Suerte**:${random()}%\n**Dinero**:${random()}%`);
    }
}

export default new HoroscopoCommand();

function random() {
    let max = 100;
    let v = Math.round(Math.random() * (max - 1) + 1);
    return v;
}