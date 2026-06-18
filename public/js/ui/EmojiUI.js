import { appState } from "../core/state.js";

export class EmojiUI {
    constructor(socket, inputUI) {
        this.socket = socket;
        this.inputUI = inputUI;

        this.buttonEmoji = document.getElementById('emojis');
        this.modal = document.getElementById('emojiModal');
        this.closeModalButton = document.getElementById('closeModal');
        this.emojiContainer = document.getElementById('emojiContainer');
        this.emojiSearch = document.getElementById('emojiSearch');
        this.stickerModeBtn = document.getElementById('stickermode');
        this.clearCacheBtn = document.getElementById('clearcache');
        this.emojiUploadInput = document.getElementById('emojiUpload');
        
        this.stickerModeActive = false;
        this.currentReactionMessageId = null;

        this.initListeners();
    }

    initListeners() {
        this.buttonEmoji?.addEventListener('click', () => this.openModal());
        this.closeModalButton?.addEventListener('click', () => this.closeModal());
        
        globalThis.addEventListener('click', (event) => {
            if (event.target === this.modal) this.closeModal();
        });

        this.stickerModeBtn?.addEventListener("click", () => {
            this.stickerModeActive = true;
            this.stickerModeBtn.classList.add("bg-green-600");
        });

        this.emojiSearch?.addEventListener('input', () => {
            const searchTerm = this.emojiSearch.value.toLowerCase();
            const filtered = appState.emojiCache.filter(e => e.name.toLowerCase().includes(searchTerm));
            this.renderEmojis(filtered);
        });

        this.clearCacheBtn?.addEventListener("click", () => {
            localStorage.removeItem("emojiBlobCache");
            alert("Se ha vaciado la caché de emojis. La página se recargará.");
            globalThis.location.reload();
        });

        this.emojiUploadInput?.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('emoji', file);

            try {
                const response = await fetch('/img/emoji', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    alert("Imagen subida con éxito, ahora está en la lista de espera (waitlist).");
                    this.emojiUploadInput.value = "";
                } else {
                    alert("Hubo un error al subir la imagen (Servidor rechazó la petición).");
                }
            } catch (error) {
                console.error('Error de red al subir emoji:', error);
                alert("Hubo un error al subir la imagen (Fallo de red).");
            }
        });
    }

    openModal(messageIdForReaction = null) {
        this.currentReactionMessageId = messageIdForReaction;
        this.renderEmojis(appState.emojiCache);
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.currentReactionMessageId = null;
        this.stickerModeActive = false;
        if(this.stickerModeBtn) this.stickerModeBtn.classList.remove("bg-green-600");
    }

    renderEmojis(emojis) {
        this.emojiContainer.innerHTML = "";
        emojis.forEach((emoji) => {
            const img = document.createElement('img');
            img.src = emoji.url;
            img.alt = emoji.name;
            img.className = 'w-10 h-10 cursor-pointer hover:opacity-75 mr-4 mb-4';
            
            img.addEventListener('click', () => this.handleEmojiClick(emoji));
            this.emojiContainer.appendChild(img);
        });
    }

    handleEmojiClick(emoji) {
        if (this.currentReactionMessageId) {
            this.socket.emit("addReaction", { 
                messageId: this.currentReactionMessageId, 
                emojiName: emoji.name, 
                emojiUrl: emoji.url 
            });
        } else {
            const format = this.stickerModeActive ? `;${emoji.name};` : `:${emoji.name}:`;
            const currentVal = this.inputUI.input.value;
            this.inputUI.input.value = currentVal + (currentVal ? ' ' : '') + format;
            this.inputUI.autoResize();
            this.stickerModeActive = false;
        }
        this.closeModal();
    }
}
