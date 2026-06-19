import { appState } from './core/state.js';
import { ChatUI } from './ui/ChatUI.js';
import { InputUI } from './ui/InputUI.js';
import { EmojiUI } from './ui/EmojiUI.js';
import { ToolbarUI } from './ui/ToolbarUI.js';

document.addEventListener("DOMContentLoaded", async () => {
    const socket = io({ autoConnect: false });

    const inputUI = new InputUI(socket);
    inputUI.init();

    const emojiUI = new EmojiUI(socket, inputUI);
    const chatUI = new ChatUI(socket, emojiUI);
    const toolbarUI = new ToolbarUI();

    let donatorsLoaded = false;
    let historyQueue = [];

    const renderMessageReactions = (msg) => {
        if (!msg.emojis || !Array.isArray(msg.emojis)) return;

        msg.emojis.forEach(emojiData => {
            const matchedEmoji = appState.emojiCache.find(c => c.name === emojiData.name);
            if (matchedEmoji) {
                emojiData.users.forEach(userName => {
                    chatUI.renderReaction(msg.id, matchedEmoji.name, matchedEmoji.url, userName);
                });
            }
        });
    };

    const attemptRenderHistory = () => {
        if (!donatorsLoaded || historyQueue.length === 0) return;

        historyQueue.sort((a, b) => b.timestamp - a.timestamp);
        const container = document.getElementById("mensajes");
        if (container) container.innerHTML = "";
        
        historyQueue.forEach(msg => {
            chatUI.renderMessage(msg, true);
            renderMessageReactions(msg);
        });

        if (container) container.scrollTop = 0;
        historyQueue = [];
    };

    socket.on("connect", () => {
        socket.emit("whoami");
        socket.emit("whoDonate");
        socket.emit("requestHistory");
    });

    socket.on("iam", (name) => appState.currentUser = name);
    socket.on("userNames", (names) => appState.userNames = names);
    
    socket.on("donators", (donators) => {
        appState.donators = donators;
        donatorsLoaded = true;
        attemptRenderHistory();
    });

    socket.on("messageHistory", (history) => {
        historyQueue = history;
        attemptRenderHistory();
    });

    socket.on("sendmsg", (msg) => chatUI.renderMessage(msg, false));
    socket.on("messageUpdated", (data) => chatUI.updateMessage(data));
    socket.on("messageDeleted", (data) => chatUI.deleteMessage(data.id));
    
    socket.on("newReaction", (data) => {
        const matchedEmoji = appState.emojiCache.find(c => c.name === data.emojiName);
        if (matchedEmoji) {
            chatUI.renderReaction(data.messageId, matchedEmoji.name, matchedEmoji.url, data.userName);
        }
    });

    socket.on("usersTyping", (users) => {
        const display = document.getElementById("typingDisplay");
        if (users.length === 0) display.textContent = "";
        else if (users.length === 1) display.textContent = `${users[0]} está escribiendo...`;
        else display.textContent = `${users.join(", ")} están escribiendo...`;
    });

    socket.on("error", (err) => {
        console.error("Server Error:", err);
        
        chatUI.renderMessage({
            id: "error-" + Date.now(),
            user: "⚠️ Sistema",
            message: err.message || (typeof err === 'string' ? err : "Ocurrió un error inesperado."),
            timestamp: Date.now()
        }, false);
    });

    await Promise.all([
        appState.loadEmojis(),
        appState.loadCommands()
    ]);

    socket.connect();
});