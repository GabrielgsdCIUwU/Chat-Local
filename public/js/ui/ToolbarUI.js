import { appState } from '../core/state.js';

export class ToolbarUI {
    constructor() {
        this.toggleBotBtn = document.getElementById("toggleBot");
        this.clearBtn = document.getElementById("clear");
        this.container = document.getElementById("mensajes");

        this.initListeners();
        this.syncBotButtonState();
    }

    initListeners() {
        this.toggleBotBtn?.addEventListener("click", () => this.toggleBotVisibility());
        
        this.clearBtn?.addEventListener("click", () => {
            if (this.container) this.container.innerHTML = "";
        });
    }

    syncBotButtonState() {
        if (!this.toggleBotBtn) return;
        
        if (appState.showBot) {
            this.toggleBotBtn.textContent = "Ocultar Bot";
            this.toggleBotBtn.classList.replace("bg-gray-600", "bg-purple-600");
        } else {
            this.toggleBotBtn.textContent = "Mostrar Bot";
            this.toggleBotBtn.classList.replace("bg-purple-600", "bg-gray-600");
        }
    }

    toggleBotVisibility() {
        appState.showBot = !appState.showBot;
        localStorage.setItem("showBot", appState.showBot);

        this.syncBotButtonState();

        const botMessages = document.querySelectorAll('.bot-message');
        botMessages.forEach(msgEl => {
            if (appState.showBot) {
                msgEl.classList.remove("hidden");
            } else {
                msgEl.classList.add("hidden");
            }
        });

        if (this.container) this.container.scrollTop = 0;
    }
}