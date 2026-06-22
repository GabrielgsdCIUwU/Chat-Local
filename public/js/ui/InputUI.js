import { CommandUI } from './CommandUI.js';
import { appState } from '../core/state.js';

export class InputUI {
    constructor(socket) {
        this.socket = socket;
        this.input = document.getElementById("mensaje");
        this.btnSend = document.getElementById("enviar");
        this.typingTimeout = null;

        this.commandUI = new CommandUI(socket, this.input, this.btnSend);

        this.messageHistory = [];
        this.historyIndex = 0;
        this.draftMessage = "";
    }

    init() {
        this.input.addEventListener("input", () => {
            this.autoResize();
            this.handleTyping();

            this.commandUI.handleInput();
        });

        this.input.addEventListener("keydown", (e) => {
            if (this.commandUI.handleKeydown(e)) return;

            if (e.key === "ArrowUp") {
                if (this.input.selectionStart === 0 || this.historyIndex < this.messageHistory.length) {
                    e.preventDefault();
                    if (this.historyIndex === this.messageHistory.length) {
                        this.draftMessage = this.input.value;
                    }
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        this.input.value = this.messageHistory[this.historyIndex];
                        this.input.dispatchEvent(new Event('input'));
                    }
                    return;
                }
            } else if (e.key === "ArrowDown") {
                if (this.historyIndex < this.messageHistory.length) {
                    e.preventDefault();
                    this.historyIndex++;
                    if (this.historyIndex === this.messageHistory.length) {
                        this.input.value = this.draftMessage;
                    } else {
                        this.input.value = this.messageHistory[this.historyIndex];
                    }
                    this.input.dispatchEvent(new Event('input'));
                    return;
                }
            }

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
        let textToSave = "";

        if (this.commandUI.isActive()) {
            textToSave = this.commandUI.getRawCommand();
            this.commandUI.sendCommand();
        } else {
            textToSave = this.input.value.trim();
            if (!textToSave) return;

            if (appState.isEditingMessage) {
                this.socket.emit("editmsg", { message: textToSave, id: appState.editingMessageId });
                appState.isEditingMessage = false;
                appState.editingMessageId = null;
            } else if (appState.replyMessage) {
                this.socket.emit("sendmsg", textToSave, appState.replyMessage);
                appState.replyMessage = null;
            } else {
                this.socket.emit("sendmsg", textToSave);
            }
        }

        if (textToSave && (this.messageHistory.length === 0 || this.messageHistory.at(-1) !== textToSave)) {
            this.messageHistory.push(textToSave);
        }
        
        this.historyIndex = this.messageHistory.length;
        this.draftMessage = ""; 

        const replyDisplay = document.getElementById("replyMessageDisplay");
        if (replyDisplay) replyDisplay.classList.add("hidden");

        const sendButton = document.getElementById("enviar");
        if (sendButton) sendButton.style.top = "";
        this.input.value = "";
        this.autoResize();
        this.socket.emit("typing", false);
        this.input.focus();
    }
}