import { MessageFormatter } from '../utils/formatter.js';
import { appState } from '../core/state.js';

export class ChatUI {
    constructor(socket, emojiUI) {
        this.socket = socket;
        this.emojiUI = emojiUI;
        this.container = document.getElementById("mensajes");
        this.unreadCount = 0;
        this.isTabActive = true;
        this.formatter = new MessageFormatter(appState);

        this.initListeners();
    }

    //region initListeners
    initListeners() {
        document.addEventListener("visibilitychange", () => {
            this.isTabActive = document.visibilityState === 'visible';
            if (this.isTabActive) {
                document.title = "ChatGSD";
                this.unreadCount = 0;
                this.removeUnreadMarker();
            }
        });

        document.addEventListener("click", (e) => {
            const modal = document.getElementById("messageOptionsModal");
            if (modal && !modal.contains(e.target) && !e.target.closest('.options-button')) {
                modal.classList.add("hidden", "scale-95", "opacity-0");
                modal.classList.remove("options-menu-open", "scale-100", "opacity-100");
            }
            
            if (e.target.classList.contains("hidden-message")) {
                e.target.nextElementSibling.classList.remove("hidden");
                e.target.classList.add("hidden");
            }
        });
    }

    //region renderMessage
    renderMessage(msg, isHistory = false) {
        const item = document.createElement("div");
        item.className = "bg-gray-700 rounded-lg shadow-md p-4 mb-3 relative opacity-100 transition-all duration-300 ease-in-out";
        item.style.marginBottom = "1rem";
        item.dataset.timestamp = msg.timestamp;

        const donator = appState.donators.find(d => d.name === msg.user);
        let avatarHtml = "";
        let nameStyle = "";

        if (donator) {
            if (donator.color) nameStyle = `color: ${donator.color};`;
            if (typeof donator.img === 'string') {
                avatarHtml = `<img src="/resources/profiles/${msg.user}_profile${donator.img}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover;">`;
            }
        }

        const { formattedText, metadata } = this.formatter.format(msg, isHistory);
        this.handleNotifications(metadata, msg.user);

        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const editedMark = msg.edited ? `<span class="edited-mark" style="color: gray; font-size: 0.8em;"> (editado)</span>` : "";

        let replyHtml = "";
        if (msg.reply) {
            const preview = (msg.reply.replyMessage || "").slice(0, 40);
            replyHtml = `<div class="text-sm text-gray-400 mb-2 border-l-2 border-gray-500 pl-2">Respondiendo a ${msg.reply.replyUser}: ${preview}...</div>`;
        }

        item.innerHTML = `${replyHtml}<div style="display: flex; align-items: center; padding-bottom: 10px;">${avatarHtml}<p class="msg-name font-bold text-xl text-white" style="${nameStyle}">${msg.user}${editedMark}</p></div><p class="msg-content text-white text-lg" style="word-wrap: break-word; white-space: pre-wrap; overflow-wrap: break-word;">${formattedText}</p><p class="text-gray-400 mt-1 text-sm">${time}</p>`;

        const optionsButton = document.createElement("button");
        optionsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>`;
        optionsButton.className = "options-button text-gray-400 hover:text-white transition-colors duration-200 rounded-full p-1 hover:bg-gray-700";
        optionsButton.style.position = "absolute";
        optionsButton.style.top = "10px";
        optionsButton.style.right = "10px";
        optionsButton.onclick = (event) => this.showOptionsMenu(event, msg, item);
        item.appendChild(optionsButton);

        if (isHistory) {
            this.container.appendChild(item);
        } else {
            if (this.isTabActive) {
                this.container.prepend(item);
            } else {
                this.handleUnread(item);
            }
            this.container.scrollTop = 0;
        }
    }

    //region renderReaction
     renderReaction(messageId, emojiName, emojiUrl, userName) {
        const messageElement = this.container.querySelector(`[data-timestamp="${messageId}"]`);
        if (!messageElement) return;

        if (!appState.reactionsMap.has(messageId)) appState.reactionsMap.set(messageId, new Map());
        const emojiMap = appState.reactionsMap.get(messageId);
        if (!emojiMap.has(emojiName)) emojiMap.set(emojiName, new Set());
        const userSet = emojiMap.get(emojiName);
        userSet.add(userName);

        let emojiContainer = messageElement.querySelector(".reactions-container");
        if (!emojiContainer) {
            emojiContainer = document.createElement("div");
            emojiContainer.className = "reactions-container flex flex-wrap gap-2 mt-2";
            messageElement.appendChild(emojiContainer);
        }

        let reactionBadge = emojiContainer.querySelector(`[data-emoji="${emojiName}"]`);
        if (reactionBadge) {
            reactionBadge.querySelector('.count').textContent = userSet.size;
            reactionBadge.querySelector('.tooltip-text').textContent = Array.from(userSet).join(', ');
        } else {
            reactionBadge = document.createElement("div");
            reactionBadge.className = "reaction-badge bg-gray-800 rounded-full px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-gray-600 relative group";
            reactionBadge.dataset.emoji = emojiName;
            
            reactionBadge.innerHTML = `
                <img src="${emojiUrl}" alt="${emojiName}" class="w-5 h-5">
                <span class="text-xs text-gray-300 count">${userSet.size}</span>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 tooltip-text">
                    ${Array.from(userSet).join(', ')}
                </div>
            `;

            reactionBadge.onclick = () => this.socket.emit("addReaction", { messageId, emojiName, emojiUrl });
            emojiContainer.appendChild(reactionBadge);
        }
    }
    
    //region updateMessage
    updateMessage(data) {
        const item = this.container.querySelector(`[data-timestamp="${data.timestamp}"]`);
        if (item) {
            const mockMsg = { message: data.message };
            const { formattedText } = this.formatter.format(mockMsg, true);
            const contentP = item.querySelector('.msg-content');
            if (contentP) contentP.innerHTML = formattedText;
            
            const nameP = item.querySelector('.msg-name');
            if (nameP && !nameP.querySelector('.edited-mark')) {
                nameP.innerHTML += `<span class="edited-mark" style="color: gray; font-size: 0.8em;"> (editado)</span>`;
            }
        }
    }

    //region deleteMessage
    deleteMessage(timestamp) {
        const item = this.container.querySelector(`[data-timestamp="${timestamp}"]`);
        if (item) item.remove();
    }

    //region showOptionsMenu
    showOptionsMenu(event, msg, item) {
        event.stopPropagation();
        const modalContainer = document.getElementById("messageOptionsModal");
        
        document.querySelectorAll('.options-menu-open').forEach(menu => {
            if (menu !== modalContainer) {
                menu.classList.add("hidden", "scale-95", "opacity-0");
                menu.classList.remove("options-menu-open", "scale-100", "opacity-100");
            }
        });

        const rect = event.currentTarget.getBoundingClientRect();
        modalContainer.innerHTML = `<div class="py-1"></div>`;
        const menuContent = modalContainer.querySelector('div');

        modalContainer.style.top = `${rect.top + window.scrollY + 25}px`;
        modalContainer.style.left = `${rect.left + window.scrollX - 197}px`;
        modalContainer.classList.remove("hidden", "scale-95", "opacity-0");
        modalContainer.classList.add("options-menu-open", "scale-100", "opacity-100");

        const createOption = (icon, text, onClick, colorClass = "") => {
            const opt = document.createElement("div");
            opt.className = `menu-option cursor-pointer hover:bg-gray-700 px-4 py-2 flex items-center gap-3 transition-colors duration-150 ${colorClass}`;
            opt.innerHTML = `<span class="text-gray-400">${icon}</span><span>${text}</span>`;
            opt.onclick = (e) => {
                e.stopPropagation();
                onClick();
                modalContainer.classList.add("hidden", "scale-95", "opacity-0");
                modalContainer.classList.remove("options-menu-open", "scale-100", "opacity-100");
            };
            return opt;
        };

        menuContent.appendChild(createOption(
            `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>`,
            "Responder",
            () => {
                appState.replyMessage = msg;
                appState.isEditingMessage = false;
                const replyDisplay = document.getElementById("replyMessageDisplay");
                replyDisplay.textContent = `Respondiendo a ${msg.user}: ${msg.message.slice(0, 40)}...`;
                replyDisplay.classList.remove("hidden");
                const sendButton = document.getElementById("enviar");
                if (sendButton) sendButton.style.top = '28px';
                document.getElementById("mensaje").focus();
            }
        ));

        menuContent.appendChild(createOption(
            `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>`,
            "Marcar como no leído",
            () => this.markAsUnread(item)
        ));

        menuContent.appendChild(createOption(
            `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
            "Reaccionar",
            () => this.emojiUI.openModal(msg.timestamp)
        ));

        if (msg.user === appState.currentUser) {
            const separator = document.createElement("div");
            separator.className = "border-t border-gray-700 my-1";
            menuContent.appendChild(separator);

            menuContent.appendChild(createOption(
                `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
                "Editar mensaje",
                () => {
                    appState.isEditingMessage = true;
                    appState.editingMessageId = msg.timestamp;
                    appState.replyMessage = null;
                    const replyDisplay = document.getElementById("replyMessageDisplay");
                    replyDisplay.textContent = "Editando mensaje...";
                    replyDisplay.classList.remove("hidden");
                    const sendButton = document.getElementById("enviar");
                    if (sendButton) sendButton.style.top = '28px';
                    const input = document.getElementById("mensaje");
                    input.value = msg.message;
                    input.focus();
                }
            ));

            menuContent.appendChild(createOption(
                `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
                "Borrar mensaje",
                () => this.socket.emit("deletemsg", { id: msg.timestamp }),
                "hover:text-red-500"
            ));
        }
    }

    //region markAsUnread
    markAsUnread(item) {
        this.removeUnreadMarker();
        const marker = document.createElement("div");
        marker.className = "unread-marker bg-yellow-500 text-center py-2 text-black font-bold rounded-lg mb-3 cursor-pointer";
        marker.textContent = "---- Mensajes no leídos ----";
        marker.onclick = () => this.removeUnreadMarker();
        
        if (item.nextSibling) {
            this.container.insertBefore(marker, item.nextSibling);
        } else {
            this.container.appendChild(marker);
        }
    }
    //region handleUnread
    handleUnread(item) {
        if (!this.container.querySelector(".unread-marker")) {
            const marker = document.createElement("div");
            marker.className = "unread-marker bg-yellow-500 text-center py-1 text-black font-bold rounded-lg mb-3 cursor-pointer";
            marker.textContent = "---- Nuevos Mensajes ----";
            marker.onclick = () => this.removeUnreadMarker();
            this.container.prepend(marker);
        }
        this.container.prepend(item);
        this.unreadCount++;
        document.title = `(${this.unreadCount}) Nuevos msg`;
    }

    //region removeUnreadMarker
    removeUnreadMarker() {
        const marker = this.container.querySelector(".unread-marker");
        if (marker) marker.remove();
    }

    //region handleNotifications
    handleNotifications(metadata, senderName) {
        if (metadata.mentionsCurrentUser && Notification.permission === 'granted') {
            new Notification('Te han mencionado', { body: `Mensaje de ${senderName}` });
        }
    }
}