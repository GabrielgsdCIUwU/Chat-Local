import { BOT_CONFIG } from '../../backend/core/constants.js';

export const description = "El bot valorará del 1 al 10 lo que le pidas.";
export const params = [
    { name: "valorar", type: "string", required: true, description: "Lo que quieres que el bot valore." }
];
/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {
    const valoracion = context.args.join(" ");

    if(!valoracion) {
        context.reply("Debes decirme qué quieres que valore.");
        return;
    }

    function random() {
        let max = BOT_CONFIG.MAX_RATE_VALUE;
        let v = Math.round(Math.random() * (max -1) + 1);
        return v;
    }

    const response = `Yo le doy a ${valoracion.trim()} un ${random()}/10`;

    context.reply(response);
}