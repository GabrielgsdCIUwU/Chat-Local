import { appState } from './core/state.js';
import { ChatUI } from './ui/ChatUI.js';
import { InputUI } from './ui/InputUI.js';

document.addEventListener("DOMContentLoaded", async () => {
    const socket = io({ autoConnect: false });

    const chatUI = new ChatUI(socket);
    const inputUI = new InputUI(socket);
    inputUI.init();

    let donatorsLoaded = false;
    let historyQueue = [];

    const attemptRenderHistory = () => {
        if (donatorsLoaded && historyQueue.length > 0) {
            historyQueue.sort((a, b) => b.timestamp - a.timestamp);
            document.getElementById("mensajes").innerHTML = "";
            historyQueue.forEach(msg => chatUI.renderMessage(msg, true));
            chatUI.container.scrollTop = 0;
            historyQueue = [];
        }
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

    socket.on("sendmsg", (msg) => {
        chatUI.renderMessage(msg, false);
    });
    socket.on("messageUpdated", (data) => chatUI.updateMessage(data));
    socket.on("messageDeleted", (data) => chatUI.deleteMessage(data.timestamp));

    socket.on("usersTyping", (users) => {
        const display = document.getElementById("typingDisplay");
        if (users.length === 0) display.textContent = "";
        else if (users.length === 1) display.textContent = `${users[0]} está escribiendo...`;
        else display.textContent = `${users.join(", ")} están escribiendo...`;
    });

    document.getElementById("clear").addEventListener("click", () => {
        document.getElementById("mensajes").innerHTML = "";
    });

    await Promise.all([
        appState.loadEmojis(),
        appState.loadCommands()
    ]);

    socket.connect();
});