export class ChatFilterService {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} spamDbClient 
     */
    constructor(spamDbClient) {
        this.spamDbClient = spamDbClient;
        this.filters = [
            this.checkDonationSpam.bind(this)
        ];
    }

    /**
     * Processes a message through all registered filters.
     * @param {string} msg - The message content.
     * @param {string} username - The sender's username.
     * @param {import('socket.io').Server} io - The socket.io instance.
     * @param {number} timestamp - The message timestamp.
     */
    async processMessage(msg, username, io, timestamp) {
        for (const filter of this.filters) {
            await filter(msg, username, io, timestamp);
        }
    }

    /**
     * Processes a message through all registered filters.
     * @param {string} msg - The message content.
     * @param {string} username - The sender's username.
     * @param {import('socket.io').Server} io - The socket.io instance.
     * @param {number} timestamp - The message timestamp.
     */
    async checkDonationSpam(msg, username, io, timestamp) {
        if (msg.includes("https://ko-fi.com/gabrielgsd") || msg.includes("https://www.paypal.com/paypalme/gabrielgsd") || msg.includes("https://paypal.me/gabrielgsd")) {
            await this.spamDbClient.update((spamCount) => {
                if (!Array.isArray(spamCount) || spamCount.length === 0) spamCount = [0];
                spamCount[0] += 1;
                return spamCount;
            });
            const count = (await this.spamDbClient.read())[0];
            io.emit("sendmsg", {
                user: "🤖 Bot",
                message: `${username} ha contribuido a mi creador, el contador sube a ${count} veces.`,
                timestamp
            });
        }
    }
}