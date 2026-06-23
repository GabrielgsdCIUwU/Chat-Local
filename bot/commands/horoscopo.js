export const description = "Calcula tu horóscopo aleatorio para el día de hoy.";
export const params = [
    { name: "usuario", type: "user", required: false, description: "Usuario al que le quieres leer el horóscopo." }
];

/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {

    let finalUser;

    const targetName = context.args[0];
    if (targetName) {
        finalUser = targetName;
    } else {
        finalUser = context.username;
    }


    function random() {
        let max = 100;
        let v = Math.round(Math.random() * (max - 1) + 1);
        return v;
    }

    context.reply(`El horóscopo de ${finalUser}:\n**Amor**:${random()}%\n**Salud**:${random()}%\n**Suerte**:${random()}%\n**Dinero**:${random()}%`)
}