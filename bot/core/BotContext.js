export class BotContext {
    constructor({ command, subcommands, args, raw, io, socket, username, container, timestamp }) {
        this.command = command;
        this.subcommands = subcommands;
        this.args = args;
        this.raw = raw;
        this.io = io;
        this.socket = socket;
        this.username = username;
        this.container = container;
        this.timestamp = timestamp;
    }

    /**
     * Helper to easily reply as the Bot.
     * @param {string} message - The message content.
     */
    reply(message) {
        this.io.emit("sendmsg", { user: "🤖 Bot", message, timestamp: this.timestamp });
    }
}