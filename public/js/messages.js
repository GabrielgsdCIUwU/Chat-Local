const socket = io();
mensajes.innerHTML = "";
let replyMessage = null;
let isEditingMessage = false;
let editingMessageId;
const replyMessageDisplay = document.getElementById("replyMessageDisplay");
//region cache emojis
let emojiCache = [];

async function fetchAndCacheEmojis() {
    if (sessionStorage.getItem("emojiCache")) {
        emojiCache = JSON.parse(sessionStorage.getItem("emojiCache"));
        console.log("Emojis loaded from cache");
    } else {
        try {
            const response = await fetch("/img/emoji");
            emojiCache = await response.json();
            sessionStorage.setItem("emojiCache", JSON.stringify(emojiCache));
            console.log("Emojis downloaded and cached");
            window.location.reload();
        } catch (error) {
            console.error("Error al cargar los emojis:", error);
        }
    }
}
const clearCacheButton = document.getElementById("clearcache");

clearCacheButton.addEventListener("click", async () => {
    sessionStorage.removeItem("emojiCache");
    alert("Se ha vaciado la cache de emojis");
    await fetchAndCacheEmojis();
});

//endregion cache emojis

//region sockets
socket.on("connect", async () => {
    socket.emit("requestHistory");
    socket.emit("whoami")
    await fetchAndCacheEmojis();
});

let actualUserName;

socket.on("iam", async (name) => {
    actualUserName = name;
    console.log(actualUserName);
});

socket.on("messageHistory", async (history) => {
    history.sort((a, b) => b.timestamp - a.timestamp);
    for (const msg of history) {
        msg.user = msg.user || msg.name;
        await loadmessages(msg, true);
    }
    await formatAllMessages();
});

socket.on("messageUpdated", async (data) => {
    const { timestamp, message, edited } = data;

    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
    if (messageElement) {
        const messageText = messageElement.querySelectorAll("p")[1];
        messageText.innerHTML = await formatMessage(message);

        if (edited) {
            const editedMark = messageElement.querySelector(".edited-mark");

            if (!editedMark) {
                const editedLabel = document.createElement("span");
                editedLabel.classList.add("edited-mark");
                editedLabel.style.color = "gray";
                editedLabel.style.fontSize = "0.8em";
                editedLabel.textContent = " (editado)";
                messageText.appendChild(editedLabel);
            }
        }
    }

})

socket.on("reload", () => {
    window.location.reload();
});

let userNames = [];
socket.on("userNames", (names) => {
    userNames = names;
});

socket.on("error", (err) => {
    console.error(err);
    alert("Hubo un error en el servidor: " + err.message);
});

let unreadCount = 0;
socket.on("sendmsg", (msg) => {
    loadmessages(msg, false);
    updateUnreadCount();
});

//endregion buttons

const sendbutton = document.getElementById("enviar");
const userList = document.getElementById("userList");
const inputMessage = document.getElementById("mensaje");
const clearbutton = document.getElementById("clear");

let filteredUsers = [];
let selectedUserIndex = -1;

sendbutton.addEventListener("click", (event) => {
    event.preventDefault();
    sendMessage();
});

inputMessage.addEventListener("input", adjustHeight);

inputMessage.addEventListener("input", function () {
    const value = inputMessage.value;
    const atIndex = value.lastIndexOf('@');

    if (atIndex !== -1) {
        const query = value.slice(atIndex + 1).toLowerCase();
        filteredUsers = userNames.filter(user => user.toLowerCase().startsWith(query));

        if (filteredUsers.length > 0) {
            showUserList(filteredUsers);
        } else {
            userList.classList.add("hidden");
        }
    } else {
        userList.classList.add("hidden");
    }
});


clearbutton.addEventListener("click", () => {
    clearmsg();
});

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("hidden-message")) {
        const actualMessage = e.target.nextElementSibling;
        if (actualMessage && actualMessage.style.display === "none") {
            actualMessage.style.display = "inline";
            e.target.style.display = "none";
        }
    }
});


//endregion messages buttons

//region messages functions

//region Show User List
function showUserList(users) {
    userList.innerHTML = "";
    users.forEach(user => {
        const item = document.createElement("div");
        item.textContent = user;
        item.classList.add("p-2", "cursor-pointer", "hover:bg-gray-600");
        item.onclick = () => selectUser(user);
        userList.appendChild(item);
    });
    userList.classList.remove("hidden");
}

//region Select User
function selectUser(userName) {
    const atIndex = inputMessage.value.lastIndexOf('@');
    inputMessage.value = inputMessage.value.slice(0, atIndex + 1) + userName + ' ';
    userList.classList.add("hidden");
    inputMessage.focus();
    selectedUserIndex = -1;
}

//region Text Input
inputMessage.addEventListener("keydown", (event) => {
    const atIndex = inputMessage.value.lastIndexOf('@');

    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        const start = inputMessage.selectionStart;
        const end = inputMessage.selectionEnd;
        inputMessage.value = inputMessage.value.substring(0, start) + "\n" + inputMessage.value.substring(end);
        inputMessage.selectionStart = inputMessage.selectionEnd = start + 1;
        return;
    }

    if (atIndex !== -1 && filteredUsers.length > 0) {
        if (event.key === 'ArrowDown') {
            selectedUserIndex = (selectedUserIndex + 1) % filteredUsers.length;
            highlightUser(selectedUserIndex);
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            selectedUserIndex = (selectedUserIndex - 1 + filteredUsers.length) % filteredUsers.length;
            highlightUser(selectedUserIndex);
            event.preventDefault();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (selectedUserIndex >= 0) {
                selectUser(filteredUsers[selectedUserIndex]);
            } else {
                sendMessage();
                inputMessage.value = "";
            }
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
        inputMessage.value = "";
    }
});
let replyPreview;
//region Send Message
function sendMessage() {
    const message = inputMessage.value.trim();
    if (message) {
        let finalMessage = message;

        if (replyMessage) {
            replyMessage.message = replyMessage.message.replace(/\[reply:.*?\]/g, '');
            const shortReplyMessage = replyMessage.message.slice(0, 40);
            const replyPreview = shortReplyMessage.length < 40 ? shortReplyMessage : `${shortReplyMessage}...`;
            finalMessage = `[reply: ${replyMessage.user}: ${replyPreview}] ${finalMessage}`;
            replyMessageDisplay.classList.add("hidden");
            replyMessage = null;
            sendbutton.style.top = "";
        }
        if (isEditingMessage) {
            socket.emit("editmsg", { message: finalMessage, id: editingMessageId });
            isEditingMessage = false;
            editingMessageId = null;
            replyMessageDisplay.textContent = "";
        } else {
            socket.emit("sendmsg", finalMessage);
        }


        inputMessage.value = "";
        userList.classList.add("hidden");
        removeUnreadMarker();
    }
}

//region Hightlight User
function highlightUser(index) {
    const items = userList.children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove("bg-gray-600");
    }
    if (items[index]) {
        items[index].classList.add("bg-gray-600");
    }
}


//region Adjust Height
function adjustHeight() {
    this.style.height = 'auto';
    this.style.height = `${Math.min(this.scrollHeight, 150)}px`;
    sendbutton.style.height = `${this.offsetHeight - 10}px`;

    if (this.value.includes('\n')) {
        this.classList.add('no-rounded');
        sendbutton.style.marginRight = '14px';
    } else {
        this.classList.remove('no-rounded');
        sendbutton.style.marginRight = '0';
    }
}

//region Load Messages
let unreadMarkerExists = false;
async function loadmessages(msg, isHistory) {
    const mensajes = document.getElementById("mensajes");
    const gridItem = document.createElement("div");
    const userName = document.createElement("p");
    const messageText = document.createElement("p");
    const timeText = document.createElement("p");


    gridItem.classList.add("bg-gray-700", "rounded-lg", "shadow-md", "p-4", "mb-3", "transition-all", "duration-300", "ease-in-out");
    gridItem.style.marginBottom = "1rem";
    gridItem.style.position = "relative";
    gridItem.classList.add("opacity-100");

    userName.classList.add("text-white", "font-bold", "text-xl", "mb-1");
    userName.textContent = msg.user;
    if (msg.edited) {
        const editedLabel = document.createElement("span");
        editedLabel.classList.add("edited-mark");
        editedLabel.style.color = "gray";
        editedLabel.style.fontSize = "0.8em";
        editedLabel.textContent = " (editado)";
        userName.appendChild(editedLabel);
    }

    messageText.classList.add("text-white", "text-lg");
    if (isHistory) {
        messageText.innerHTML = msg.message;
    } else {
        messageText.innerHTML = await formatMessage(msg.message);
    }

    const mentionRegex = /@([^\s]+)/g;
    messageText.innerHTML = messageText.innerHTML.replace(mentionRegex, (match, username) => {
        if (userNames.includes(username)) {
            return `<span style="color: yellow;">${match}</span>`;
        }
        return match;
    });

    const time = msg.timestamp || Date.now();
    const date = new Date(time);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    timeText.classList.add("text-gray-400", "mt-1", "text-small");
    timeText.textContent = `${hours}:${minutes}`;

    //procesamiento menu mensajes
    let [optionsButton, optionsMenu] = messageMenu(gridItem, msg)


    gridItem.appendChild(userName);
    gridItem.appendChild(messageText);
    gridItem.appendChild(timeText);
    gridItem.appendChild(optionsButton);

    if (isHistory) {
        mensajes.appendChild(gridItem);
    } else {
        let isTabActive = document.visibilityState === 'visible';

        if (!isTabActive) {
            if (!unreadMarkerExists) {
                const marker = document.createElement("div");
                marker.classList.add("bg-yellow-500", "text-center", "py-2", "text-black", "font-bold", "rounded-lg", "mb-3");
                marker.textContent = "---- Mensajes no leídos ----";
                marker.addEventListener("dblclick", () => {
                    removeUnreadMarker();
                });
                mensajes.prepend(marker);
                unreadMarkerExists = true; // Marcar que el marcador ha sido añadido
                console.log("Marcador de mensajes no leídos añadido.");
            }
            mensajes.prepend(gridItem); // Agregar el mensaje a la parte superior
            setTimeout(() => {
                const marker = mensajes.querySelector(".bg-yellow-500");
                if (marker) {
                    marker.scrollIntoView({ behavior: "smooth" });
                }
            }, 100);
        } else {
            mensajes.prepend(gridItem); // Si la pestaña está activa, solo agregar el mensaje
        }
    }
    gridItem.dataset.timestamp = msg.timestamp;

    document.addEventListener("click", (event) => {
        if (!optionsButton.contains(event.target) && !optionsMenu.contains(event.target)) {
            optionsMenu.classList.add("hidden");
        }
    });
}

//region options msg menu
function messageMenu(gridItem, msg) {
    const optionsButton = document.createElement("button");
    const optionsMenu = document.createElement("div");

    optionsButton.textContent = "⋮";
    optionsButton.classList.add("options-button");
    optionsButton.style.position = "absolute";
    optionsButton.style.top = "10px";
    optionsButton.style.right = "10px";
    optionsButton.onclick = (event) => {
        event.stopPropagation();
        optionsMenu.classList.toggle("hidden");
        optionsMenu.style.position = 'absolute';
        optionsMenu.style.backgroundColor = '#2c2f33';
        optionsMenu.style.padding = '10px';
        optionsMenu.style.borderRadius = '5px';
        optionsMenu.style.top = '30px';
        optionsMenu.style.right = '0';

        const replyOption = document.createElement("div");
        replyOption.textContent = "Responder";
        replyOption.classList.add("menu-option");
        replyOption.onclick = () => {
            const replyPattern = /^\[reply: (.*?): (.*?)\] (.*)$/;
            const match = msg.message.match(replyPattern);
            let displayMessage;

            if (match) {
                displayMessage = match[3];
            } else {
                const shortMessage = msg.message.slice(0, 40);
                displayMessage = shortMessage.length < 40 ? shortMessage : `${shortMessage}...`;
            }

            replyMessageDisplay.textContent = `Respondiendo a ${msg.user}: ${displayMessage}`;
            replyMessageDisplay.classList.remove("hidden");
            replyMessage = msg;
            optionsMenu.classList.add("hidden");
            sendbutton.style.top = '28px';
        };

        const markUnreadOption = document.createElement("div");
        markUnreadOption.textContent = "Marcar como no leído";
        markUnreadOption.classList.add("menu-option");
        markUnreadOption.onclick = () => {
            addUnreadMarker(gridItem);
            optionsMenu.classList.add("hidden");
        };
        optionsMenu.innerHTML = "";
        const editMessageOption = document.createElement("div");
        if (msg.name || msg.user === actualUserName) {
            editMessageOption.textContent = "Editar mensaje";
            editMessageOption.classList.add("menu-option");
            editMessageOption.onclick = () => {
                replyMessageDisplay.textContent = "Editando mensaje...";
                replyMessageDisplay.classList.remove("hidden");
                inputMessage.value = msg.message;
                isEditingMessage = true;
                editingMessageId = msg.timestamp;
                optionsMenu.classList.add("hidden");
                sendbutton.style.top = '28px';
            };

            optionsMenu.appendChild(editMessageOption);
        }


        optionsMenu.appendChild(replyOption);
        optionsMenu.appendChild(markUnreadOption);
        gridItem.appendChild(optionsMenu);
    };
    return [optionsButton, optionsMenu];
}



function toggleUnreadMarker(gridItem) {
    let marker = gridItem.querySelector(".unread-marker");

    if (gridItem.classList.contains("unread")) {
        if (!marker) {
            marker = document.createElement("div");
            marker.classList.add("unread-marker");
            marker.style.position = "absolute";
            marker.style.top = "10px";
            marker.style.left = "10px";
            marker.style.width = "10px";
            marker.style.height = "10px";
            marker.style.backgroundColor = "red";
            marker.style.borderRadius = "50%";
            gridItem.appendChild(marker);
        }
    } else if (marker) {
        gridItem.removeChild(marker);
    }
}

//region Format Message
async function formatMessage(message) {
    message = message.trim();

    if (message.startsWith("[reply:")) {
        const replyInfo = message.match(/\[reply: (.*?): (.*?)\] (.*)/);
        if (replyInfo) {
            const replyUser = replyInfo[1];
            const replyText = replyInfo[2];
            const replyPreview = replyText.length < 40 ? replyText : `${replyText.slice(0, 40)}...`;
            message = `<div class="reply-info">Respondiendo a ${replyUser}: ${replyPreview}</div>` + replyInfo[3];
        }
    }


    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
    message = message.replace(/\|\| (.*?) \|\|/g, `<span class="hidden-message" style="cursor: pointer; color: blue;">[Mostrar]</span><span class="actual-message" style="display:none;">$1</span>`);
    if (message.includes(':')) {

        emojiCache.forEach((emoji) => {
            const emojiUrl = emoji.url;
            const emojiName = emoji.name;
            const emojiPattern = new RegExp(`:${emojiName}:`, 'g');
            if (emojiPattern.test(message)) {
                message = message.replace(emojiPattern, `<img src="${emojiUrl}" width="50px" style="display: inline;">`);
            }
        });
    }
    if (message.includes(';')) {

        emojiCache.forEach((emoji) => {
            const emojiUrl = emoji.url;
            const emojiName = emoji.name;
            const emojiPattern = new RegExp(`;${emojiName};`, 'g');
            if (emojiPattern.test(message)) {
                message = message.replace(emojiPattern, `<img src="${emojiUrl}" width="200px" style="display: inline;">`);
            }
        });
    }

    const unorderedListItems = message.match(/^- (.*?)(?=\n|$)/gm);
    const orderedListItems = message.match(/^\d+\.\s(.*?)(?=\n|$)/gm);

    if (unorderedListItems) {
        const listItems = unorderedListItems.map(item => `<li>${item.slice(2)}</li>`).join('');
        message = message.replace(/^- (.*?)(?=\n|$)/gm, '');
        message += `<ul class="list-disc pl-5">${listItems}</ul>`;
    }

    if (orderedListItems) {
        const listItems = orderedListItems.map(item => `<li>${item.slice(3)}</li>`).join('');
        message = message.replace(/^\d+\.\s(.*?)(?=\n|$)/gm, '');
        message += `<ol class="list-decimal pl-5">${listItems}</ol>`;
    }

    if (!unorderedListItems && !orderedListItems) {
        message = message.replace(/\n/g, '<br>');
    }
    return message;
}



//region Format All Messages
async function formatAllMessages() {
    const mensajes = document.getElementById("mensajes");
    const messageTexts = mensajes.querySelectorAll(".text-lg");

    for (const messageText of messageTexts) {
        const originalMessage = messageText.textContent;
        const formattedMessage = await formatMessage(originalMessage);
        messageText.innerHTML = formattedMessage;
    }
}

function clearmsg() {
    mensajes.innerHTML = "";
}
//endregion messages functions

//region unread msg fuctions
function removeUnreadMarker() {
    const mensajes = document.getElementById("mensajes");
    const marker = mensajes.querySelector(".bg-yellow-500");
    if (marker) {
        mensajes.removeChild(marker);
        unreadMarkerExists = false; // Restablecer la variable
        console.log("Marcador de mensajes no leídos eliminado.");
    }
}
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
        document.title = "Chat";
        unreadCount = 0;
    }
});
function updateUnreadCount() {
    if (document.visibilityState === 'hidden') {
        unreadCount++;
        document.title = `(${unreadCount}) Nuevos msg`;
    } else {
        document.title = "Chat";
        unreadCount = 0;
    }
}

function addUnreadMarker(gridItem) {
    const mensajes = document.getElementById("mensajes");

    // Eliminar marcador existente si lo hubiera
    removeUnreadMarker();

    // Crear un nuevo marcador de "Mensajes no leídos"
    const marker = document.createElement("div");
    marker.classList.add("bg-yellow-500", "text-center", "py-2", "text-black", "font-bold", "rounded-lg", "mb-3");
    marker.textContent = "---- Mensajes no leídos ----";
    marker.addEventListener("dblclick", () => {
        removeUnreadMarker();
    });

    // Insertar el marcador justo antes del mensaje seleccionado
    mensajes.insertBefore(marker, gridItem);

    // Marcar que el marcador ha sido añadido
    unreadMarkerExists = true;
}



function createReplyOption(msg) {
    const replyOption = document.createElement("div");
    replyOption.textContent = "Responder";
    replyOption.classList.add("menu-option");
    replyOption.onclick = () => {
        replyMessageDisplay.textContent = `Respondiendo a ${msg.user}: ${msg.message.slice(0, 40)}...`;
        replyMessageDisplay.classList.remove("hidden");
        inputMessage.value = ""; // Limpiar el textarea
        inputMessage.focus();
        optionsMenu.classList.add("hidden");
        replyMessage = msg; // Guardamos el mensaje original para referencia
    };

    optionsMenu.appendChild(replyOption);
}
//endregion logic messages