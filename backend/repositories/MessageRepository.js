export class MessageRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
     constructor(dbClient) {
        this.db = dbClient;
     }

     async getAll() {
        return await this.db.read();
     }

     async saveMessage(messageObj) {
        await this.db.update((messages) => {
            messages.push(messageObj);
            return messages;
        });
     }

     async editMessage(id, username, newText) {
        return await this.db.update((messages) => {
            const msg = messages.find(m => m.timestamp === id);
            if (msg?.user === username) {
                msg.message = newText;
                msg.edited = true;
            }
            return messages;
        });
     }

     async deleteMessage(id, username) {
        return await this.db.update((messages) => {
            const msgIndex = messages.findIndex(m => m.timestamp === id);
            if (msgIndex !== -1 && messages[msgIndex].user === username) {
                messages.splice(msgIndex, 1);
            }
            return messages;
        });
     }

     async addReaction(messageId, emojiName, username) {
        return await this.db.update((messages) => {
            const msg = messages.find(m => m.timestamp === messageId);
            if (msg) {
                if (!msg.emojis) msg.emojis = [];
                let emojiEntry = msg.emojis.find(e => e.name === emojiName);
                if (!emojiEntry) {
                    emojiEntry = { name: emojiEntry, users: [] };
                    msg.emojis.push(emojiEntry);
                }
                if (!emojiEntry.users.includes(username)) {
                    emojiEntry.users.push(username);
                }
            }
            return messages;
        });
     }
}