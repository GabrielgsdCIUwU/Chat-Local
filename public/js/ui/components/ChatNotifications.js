export class ChatNotifications {
    constructor(chatContainer) {
        this.container = chatContainer;
        this.unreadCount = 0;
        this.isTabActive = true;

        this.initListeners();
    }

    initListeners() {
        document.addEventListener("click", () => {
            if ("Notification" in globalThis && Notification.permission === "default") {
                Notification.requestPermission();
            }
        }, { once: true });
        document.addEventListener("visibilitychange", () => {
            this.isTabActive = document.visibilityState === 'visible';
            if (this.isTabActive) {
                document.title = "ChatGSD";
                this.unreadCount = 0;
                this.removeUnreadMarker();
            }
        });
    }

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

    removeUnreadMarker() {
        const marker = this.container.querySelector(".unread-marker");
        if (marker) marker.remove();
    }

    notifyMention(senderName) {
        if (Notification.permission === 'granted') {
            new Notification('Te han mencionado', { body: `Mensaje de ${senderName}` });
        }
    }
}