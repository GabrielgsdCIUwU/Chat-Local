import { MessageFormatter } from '../utils/formatter.js';
import { appState } from '../core/state.js';
import { ChatNotifications } from './components/ChatNotifications.js';
import { MessageMenu } from './components/MessageMenu.js';

export class ChatUI {
    constructor(socket, emojiUI) {
        this.socket = socket;
        this.container = document.getElementById("mensajes");
        
        this.formatter = new MessageFormatter(appState);
        this.notifications = new ChatNotifications(this.container);
        this.menu = new MessageMenu(socket, emojiUI, this.notifications);

        this.initListeners();
    }

    //region initListeners
    initListeners() {
        // Toggle Spoilers
        document.addEventListener("click", (e) => {
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
        item.dataset.id = msg.id;

        item.dataset.user = msg.user;
        if (msg.user === "🤖 Bot") {
            item.classList.add("bot-message");
            if (!appState.showBot) {
                item.classList.add("hidden");
            }
        }

        const donator = appState.donators.find(d => d.name === msg.user);
        let avatarHtml = "";
        let nameStyle = "";

        if (donator) {
            if (donator.color) nameStyle = `color: ${donator.color};`;
            if (donator.cachedImgUrl || typeof donator.img === 'string') {
                const imgSrc = donator.cachedImgUrl || `/resources/profiles/${msg.user}_profile${donator.img}`;
                avatarHtml = `<img src="${imgSrc}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover;">`;
            }
        }

        const { formattedText, metadata } = this.formatter.format(msg, isHistory);
        
        if (metadata.mentionsCurrentUser) {
            this.notifications.notifyMention(msg.user);
        }

        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const editedMark = msg.edited ? `<span class="edited-mark" style="color: gray; font-size: 0.8em;"> (editado)</span>` : "";

        let replyHtml = "";
        if (msg.reply) {
            const safePreview = msg.reply.replyMessage.slice(0, 40).replaceAll('<', "&lt;").replaceAll('>', "&gt;");
            const safeUser = msg.reply.replyUser.replaceAll('<', "&lt;").replaceAll('>', "&gt;");
            replyHtml = `<div class="text-sm text-gray-400 mb-2 border-l-2 border-gray-500 pl-2">Respondiendo a ${safeUser}: ${safePreview}...</div>`;
        }

        let prestigeBadge = "";
        if (msg.prestige && msg.prestige > 0) {
            prestigeBadge = `<span style="color: #fbbf24; font-weight: bold; margin-right: 6px; font-size: 0.9em; text-shadow: 0px 0px 5px rgba(251, 191, 36, 0.5);" title="Prestige Level ${msg.prestige}">[★${msg.prestige}]</span>`;
        }

        item.innerHTML = `${replyHtml}<div style="display: flex; align-items: center; padding-bottom: 10px;">${avatarHtml}${prestigeBadge}<p class="msg-name font-bold text-xl text-white" style="${nameStyle}">${msg.user}${editedMark}</p></div><p class="msg-content text-white text-lg" style="word-wrap: break-word; white-space: pre-wrap; overflow-wrap: break-word;">${formattedText}</p><p class="text-gray-400 mt-1 text-sm">${time}</p>`;

        const optionsButton = document.createElement("button");
        optionsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>`;
        optionsButton.className = "options-button text-gray-400 hover:text-white transition-colors duration-200 rounded-full p-1 hover:bg-gray-700";
        optionsButton.style.position = "absolute";
        optionsButton.style.top = "10px";
        optionsButton.style.right = "10px";
        optionsButton.onclick = (event) => this.menu.show(event, msg, item);
        
        item.appendChild(optionsButton);

        if (isHistory) {
            this.container.appendChild(item);
        } else {
            if (this.notifications.isTabActive) {
                this.container.prepend(item);
            } else {
                this.notifications.handleUnread(item);
            }
            this.container.scrollTop = 0;
        }
    }

    //region renderReaction
     renderReaction(messageId, emojiName, emojiUrl, userName) {
        const messageElement = this.container.querySelector(`[data-id="${messageId}"]`);
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
        const item = this.container.querySelector(`[data-id="${data.id}"]`);
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
    deleteMessage(id) {
        const item = this.container.querySelector(`[data-id="${id}"]`);
        if (item) item.remove();
    }
}