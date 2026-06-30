/** 
 * @typedef {import("../core/types.js").IMessageRepository} IMessageRepository
 * @typedef {import("../core/types.js").MessageProps} MessageProps
 */
/**
 * Repository handling chat log persistence and reaction additions.
 * 
 * @implements {IMessageRepository}
 */
export class MessageRepository {
    /**
     * @param {import('../core/types.js').IKeyValueStore} dbClient
     */
     constructor(dbClient) {
        this.db = dbClient;
     }

    /**
      * Retrieves sorted historical message properties.
      * @returns {Promise<MessageProps[]>} Dynamic list of messages.
      */
     async getAll() {
        return await this.db.read();
     }

    /**
      * Saves a message entry.
      * @param {MessageProps} messageObj - The raw message aggregate properties.
      * @returns {Promise<void>}
      */
     async saveMessage(messageObj) {
        await this.db.update((messages) => {
            messages.push(messageObj);
            return messages;
        });
     }

    /**
      * Alters message text and triggers edited flags.
      * @param {string} id - Message unique UUID.
      * @param {string} username - Author of the original message.
      * @param {string} newText - New string content to replace.
      * @returns {Promise<void>}
      */
     async editMessage(id, username, newText) {
        return await this.db.update((/**@type {MessageProps[]}*/ messages) => {
            const msg = messages.find(m => m.id === id);
            if (msg?.user === username) {
                msg.message = newText;
                msg.edited = true;
            }
            return messages;
        });
     }

    /**
      * Deletes an entry from database.
      * @param {string} id - Message unique UUID.
      * @param {string} username - Original author username.
      * @returns {Promise<void>}
      */
     async deleteMessage(id, username) {
        return await this.db.update((/**@type {MessageProps[]}*/ messages) => {
            const msgIndex = messages.findIndex(m => m.id === id);
            if (msgIndex !== -1 && messages[msgIndex].user === username) {
                messages.splice(msgIndex, 1);
            }
            return messages;
        });
     }

    /**
      * Applies a user reaction to a message.
      * @param {string} messageId - Message unique UUID.
      * @param {string} emojiName - Asset name identifier.
      * @param {string} username - Reactor's username.
      * @returns {Promise<void>}
      */
     async addReaction(messageId, emojiName, username) {
        return await this.db.update((/**@type {MessageProps[]}*/ messages) => {
            const msg = messages.find(m => m.id === messageId);
            if (msg) {
                if (!msg.emojis) msg.emojis = [];
                let emojiEntry = msg.emojis.find(e => e.name === emojiName);
                if (!emojiEntry) {
                    emojiEntry = { name: emojiName, users: [] };
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