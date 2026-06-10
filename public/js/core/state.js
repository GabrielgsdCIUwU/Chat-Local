export class State {
    constructor() {
        this.currentUser = null;
        this.userNames = [];
        this.donators = [];
        this.emojiCache = [];
        this.commandsTree = {};

        this.replyMessage = null;
        this.isEditingMessage = false;
        this.editingMessageId = null;
    }

    async loadEmojis() {
        try {
            if (sessionStorage.getItem("emojiCache")) {
                this.emojiCache = JSON.parse(sessionStorage.getItem("emojiCache"));
            } else {
                const response = await fetch("/img/emoji");
                if (!response.ok) throw new Error("Fallo al obtener emojis");
                this.emojiCache = await response.json();
                sessionStorage.setItem("emojiCache", JSON.stringify(this.emojiCache));
            }
        } catch (err) {
            console.error("No se pudieron cargar los emojis:", err);
            this.emojiCache = [];
        }
    }

    async loadCommands() {
        try {
            const response = await fetch("/commands");
            if (!response.ok) throw new Error("Fallo al obtener comandos");
            this.commandsTree = await response.json();
        } catch (e) {
            console.error("No se pudieron cargar los comandos:", e);
            this.commandsTree = {};
        }
    }
}

export const appState = new State();