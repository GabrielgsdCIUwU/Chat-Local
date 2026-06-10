import { CommandUI } from './CommandUI.js';
import { appState } from '../core/state.js';

export class InputUI {
    constructor(socket) {
        this.socket = socket;
        this.input = document.getElementById("mensaje");
        this.btnSend = document.getElementById("enviar");
        this.typingTimeout = null;

        this.commandUI = new CommandUI(socket, this.input, this.btnSend);
    }

    init() {
        this.input.addEventListener("input", () => {
            this.autoResize();
            this.handleTyping();

            this.commandUI.handleInput();
        });

        this.input.addEventListener("keydown", (e) => {
            if (this.commandUI.handleKeydown(e)) return;

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });

        this.btnSend.addEventListener("click", (e) => {
            e.preventDefault();
            this.send();
        });
    }

    autoResize() {
        this.input.style.height = 'auto';
        this.input.style.height = `${Math.min(this.input.scrollHeight, 150)}px`;
    }

    handleTyping() {
        this.socket.emit("typing", true);
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.socket.emit("typing", false);
        }, 3000);
    }

    send() {
        const text = this.input.value.trim();
        if (!text && !this.commandUI.isActive()) return;

        if (this.commandUI.isActive()) {
            this.commandUI.sendCommand();
        } else {
            if (appState.isEditingMessage) {
                // Emitir edición
                this.socket.emit("editmsg", { message: text, id: appState.editingMessageId });
                appState.isEditingMessage = false;
                appState.editingMessageId = null;
            } else if (appState.replyMessage) {
                // Emitir respuesta
                this.socket.emit("sendmsg", text, appState.replyMessage);
                appState.replyMessage = null;
            } else {
                // Mensaje normal
                this.socket.emit("sendmsg", text);
            }
        }

        const replyDisplay = document.getElementById("replyMessageDisplay");
        if (replyDisplay) replyDisplay.classList.add("hidden");

        const sendButton = document.getElementById("enviar");
        if (sendButton) sendButton.style.top = "";
        this.input.value = "";
        this.autoResize();
        this.socket.emit("typing", false);
    }
}