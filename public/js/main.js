import { appState } from './core/state.js';
import { ChatUI } from './ui/ChatUI.js';
import { InputUI } from './ui/InputUI.js';
import { EmojiUI } from './ui/EmojiUI.js';
import { ToolbarUI } from './ui/ToolbarUI.js';
import { ModalUI } from './ui/components/ModalUI.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { GachaUI } from './ui/GachaUI.js';
import { AudioSFX } from './ui/AudioSFX.js';
import { ToastUI } from './ui/components/ToastUI.js';
import { MarketUI } from './ui/MarketUI.js';
import { ActivityUI } from './ui/ActivityUI.js';


document.addEventListener("DOMContentLoaded", async () => {
    const socket = io({ autoConnect: false });

    const audioSFX = new AudioSFX();
    const toastUI = new ToastUI(audioSFX);

    const inputUI = new InputUI(socket);
    inputUI.init();

    const emojiUI = new EmojiUI(socket, inputUI);
    const chatUI = new ChatUI(socket, emojiUI, audioSFX, toastUI); 
    const toolbarUI = new ToolbarUI(audioSFX); 
    const globalModal = new ModalUI();
    const inventoryUI = new InventoryUI(socket, globalModal);
    const gachaUI = new GachaUI(socket);
    const marketUI = new MarketUI(socket, globalModal);
    const activityUI = new ActivityUI(socket, globalModal);

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
    
    socket.on("donators", async (donators) => {
        await appState.processDonators(donators);
        donatorsLoaded = true;
        attemptRenderHistory();
    });

    socket.on("messageHistory", (history) => {
        historyQueue = history;
        attemptRenderHistory();
    });

    socket.on("sendmsg", (msg) => {
        chatUI.renderMessage(msg, false);
        if (msg.user !== appState.currentUser) {
            audioSFX.playPop();
        }
    });
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
        const errorMsg = err.message || (typeof err === 'string' ? err : "Ocurrió un error inesperado.");
        toastUI.show(errorMsg, 'error');
    });

    socket.on("toast", (data) => {
        if (data.target && data.target !== appState.currentUser) return;
        
        toastUI.show(data.message, data.type);
    });

    await Promise.all([
        appState.loadEmojis(),
        appState.loadCommands()
    ]);

    socket.connect();
});