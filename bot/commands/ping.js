import { BaseCommand } from "../core/BaseCommand.js";

/**
 * Simple ping command to test bot responsiveness.
 * @extends BaseCommand
 */
class PingCommand extends BaseCommand {
    constructor() {
        super({
            name: "ping",
            description: "Comprueba que el bot está activo y responde."
        });
    }

    async run(context) {
        context.reply("Pong!");
    }
}

export default new PingCommand();