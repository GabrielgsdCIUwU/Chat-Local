export const params = [
    {name: "valorar", type: "string", required: true}
];
/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {
    const valoracion = context.args[0];

    if(!valoracion) {
        context.reply("Debes hacerme una pregunta.")
        return;
    }


    function random() {
        let max = 10;
        let v = Math.round(Math.random() * (max -1) + 1);
        return v;
    }

    const response = `Yo le doy a ${valoracion.trim()} un ${random()}`

    context.reply(response);
}