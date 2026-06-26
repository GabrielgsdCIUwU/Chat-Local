import { BOT_CONFIG } from '../../backend/core/constants.js';

import { BaseCommand } from "../core/BaseCommand.js";

/**
 * Rate command.
 * @extends BaseCommand
 */
class RateCommand extends BaseCommand {
    constructor() {
        super({
            name: "rate",
            description: "El bot valorará del 1 al 10 lo que le pidas.",
            params: [
                { name: "valorar", type: "string", required: true, description: "Lo que quieres que el bot valore." }
            ]
        });
    }

    async run(context, args) {
        const response = `Yo le doy a ${args.valorar} un ${random()}/10`;
        context.reply(response);
    }
}

export default new RateCommand();

function random() {
    let max = BOT_CONFIG.MAX_RATE_VALUE;
    let v = Math.round(Math.random() * (max - 1) + 1);
    return v;
}