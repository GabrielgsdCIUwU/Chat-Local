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
            const response = await fetch("/img/emoji");
            if (!response.ok) throw new Error("Fallo al obtener emojis");
            const serverEmojis = await response.json();

            let localCache = [];
            try {
                const cached = localStorage.getItem("emojiBlobCache");
                if (cached) localCache = JSON.parse(cached);
            } catch(e) { 
                console.warn("No se pudo leer la caché local:", e); 
            }

            const cacheMap = new Map(localCache.map(e => [e.name, e]));
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
                        console.error(`Fallo al descargar el Blob de ${emoji.name}:`, e);
                        updatedCache.push(emoji);
                    }
                }
            }

            if (cacheChanged || updatedCache.length !== localCache.length) {
                try {
                    localStorage.setItem("emojiBlobCache", JSON.stringify(updatedCache));
                } catch(e) {
                    console.warn("Caché de localStorage llena (QuotaExceeded), se usará en memoria.");
                }
            }

            this.emojiCache = updatedCache;

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