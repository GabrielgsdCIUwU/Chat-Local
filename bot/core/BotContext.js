import crypto from "node:crypto";
/**
 * @typedef {Object} BotContextParams
 * @property {string} command - The main command name.
 * @property {string[]} subcommands - Array of subcommands.
 * @property {string[]} args - Arguments passed to the command.
 * @property {string} raw - The raw command string.
 * @property {import('socket.io').Server} io - Socket.io server instance.
 * @property {import('socket.io').Socket} socket - Socket.io client instance.
 * @property {string} username - Name of the user executing the command.
 * @property {typeof import('../../backend/core/DIContainer.js').container} container - Dependency Injection Container.
 * @property {number} timestamp - The exact time the command was issued.
 */


export class BotContext {
    /**
     * 
     * @param {BotContextParams} params 
     */
    constructor({ command, subcommands, args, raw, io, socket, username, container, timestamp }) {
        /**
         * @type {string}
         */
        this.command = command;
        /**
         * @type {string[]}
         */
        this.subcommands = subcommands;
        /**
         * @type {string[]}
         */
        this.args = args;
        /**
         * @type {string}
         */
        this.raw = raw;
        /**
         * @type {import('socket.io').Server}
         */
        this.io = io;
        /**
         * @type {mimport('socket.io').Socket}
         */
        this.socket = socket;
        /**
         * @type {string}
         */
        this.username = username;
        /**
         * @type {typeof import('../../backend/core/DIContainer.js').container}
         */
        this.container = container;
        /**
         * @type {number}
         */
        this.timestamp = timestamp;
    }

    /**
     * Helper to easily reply as the Bot.
     * @param {string} message - The message content.
     */
    async reply(message) {
        const botMessage = {
            id: crypto.randomUUID(),
            user: "🤖 Bot",
            message: message,
            timestamp: Date.now()
        };

        await this.container.messageRepository.saveMessage(botMessage);

        this.io.emit("sendmsg", { user: "🤖 Bot", message, timestamp: this.timestamp });
    }
}