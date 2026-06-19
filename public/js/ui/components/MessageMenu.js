import { appState } from '../../core/state.js';

export class MessageMenu {
    constructor(socket, emojiUI, notifications) {
        this.socket = socket;
        this.emojiUI = emojiUI;
        this.notifications = notifications;
        this.modalContainer = document.getElementById("messageOptionsModal");

        this.initListeners();
    }

    initListeners() {
        document.addEventListener("click", (e) => {
            if (this.modalContainer && !this.modalContainer.contains(e.target) && !e.target.closest('.options-button')) {
                this.closeMenu();
            }
        });
    }

    closeMenu() {
        this.modalContainer.classList.add("hidden", "scale-95", "opacity-0");
        this.modalContainer.classList.remove("options-menu-open", "scale-100", "opacity-100");
    }

    show(event, msg, messageElement) {
        event.stopPropagation();
        
        document.querySelectorAll('.options-menu-open').forEach(menu => {
            if (menu !== this.modalContainer) {
                menu.classList.add("hidden", "scale-95", "opacity-0");
                menu.classList.remove("options-menu-open", "scale-100", "opacity-100");
            }
        });

        const rect = event.currentTarget.getBoundingClientRect();
        this.modalContainer.innerHTML = `<div class="py-1"></div>`;
        const menuContent = this.modalContainer.querySelector('div');

        this.modalContainer.style.top = `${rect.top + window.scrollY + 25}px`;
        this.modalContainer.style.left = `${rect.left + window.scrollX - 197}px`;
        this.modalContainer.classList.remove("hidden", "scale-95", "opacity-0");
        this.modalContainer.classList.add("options-menu-open", "scale-100", "opacity-100");

        this.buildOptions(menuContent, msg, messageElement);
    }

    buildOptions(container, msg, messageElement) {
        const createOption = (icon, text, onClick, colorClass = "") => {
            const opt = document.createElement("div");
            opt.className = `menu-option cursor-pointer hover:bg-gray-700 px-4 py-2 flex items-center gap-3 transition-colors duration-150 ${colorClass}`;
            opt.innerHTML = `<span class="text-gray-400">${icon}</span><span>${text}</span>`;
            opt.onclick = (e) => {
                e.stopPropagation();
                onClick();
                this.closeMenu();
            };
            return opt;
        };

        container.appendChild(createOption(
            `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>`,
            "Responder",
            () => {
                appState.replyMessage = msg;
                appState.isEditingMessage = false;
                const replyDisplay = document.getElementById("replyMessageDisplay");
                replyDisplay.textContent = `Respondiendo a ${msg.user}: ${msg.message.slice(0, 40)}...`;
                replyDisplay.classList.remove("hidden");
                document.getElementById("mensaje").focus();
            }
        ));

        container.appendChild(createOption(
            `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>`,
            "Marcar como no leído",
            () => this.notifications.markAsUnread(messageElement)
        ));

        container.appendChild(createOption(
            `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
            "Reaccionar",
            () => this.emojiUI.openModal(msg.id)
        ));

        if (msg.user === appState.currentUser) {
            const separator = document.createElement("div");
            separator.className = "border-t border-gray-700 my-1";
            container.appendChild(separator);

            container.appendChild(createOption(
                `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
                "Editar mensaje",
                () => {
                    appState.isEditingMessage = true;
                    appState.editingMessageId = msg.id;
                    appState.replyMessage = null;
                    const replyDisplay = document.getElementById("replyMessageDisplay");
                    replyDisplay.textContent = "Editando mensaje...";
                    replyDisplay.classList.remove("hidden");
                    const input = document.getElementById("mensaje");
                    input.value = msg.message;
                    input.focus();
                }
            ));

            container.appendChild(createOption(
                `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
                "Borrar mensaje",
                () => this.socket.emit("deletemsg", { id: msg.id }),
                "hover:text-red-500"
            ));
        }
    }
}