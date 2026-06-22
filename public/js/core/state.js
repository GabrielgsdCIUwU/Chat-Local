export class State {
    constructor() {
        this.currentUser = null;
        this.userNames = [];
        this.donators = [];
        this.emojiCache = [];
        this.commandsTree = {};
        this.reactionsMap = new Map();

        this.replyMessage = null;
        this.isEditingMessage = false;
        this.editingMessageId = null;
        this.showBot = localStorage.getItem("showBot") !== "false";
    }

    #blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async loadEmojis() {
        try {
            const cached = localStorage.getItem("emojiBlobCache");
            if (cached) {
                this.emojiCache = JSON.parse(cached);
            }
        } catch(e) {
            console.warn("No se pudo leer la caché local:", e);
        }

        fetch("/img/emoji")
            .then(res => res.json())
            .then(async serverEmojis => {
                const cacheMap = new Map(this.emojiCache.map(e => [e.name, e]));
                const updatedCache = [];
                let cacheChanged = false;

                for (const emoji of serverEmojis) {
                    if (cacheMap.has(emoji.name)) {
                        updatedCache.push(cacheMap.get(emoji.name));
                    } else {
                        try {
                            const imgRes = await fetch(emoji.url);
                            const blob = await imgRes.blob();
                            const base64 = await this.#blobToBase64(blob);
                            updatedCache.push({ ...emoji, url: base64 });
                            cacheChanged = true;
                        } catch (e) {
                            console.error(`Fallo al descargar ${emoji.name}`, e);
                        }
                    }
                }

                if (cacheChanged || updatedCache.length !== this.emojiCache.length) {
                    this.emojiCache = updatedCache;
                    try {
                        localStorage.setItem("emojiBlobCache", JSON.stringify(updatedCache));
                    } catch(e) {
                        console.warn("Caché excedida. Se usará solo memoria.", e);
                    }
                }
            })
            .catch(err => console.error("Error validando emojis en segundo plano:", err));
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