const socket = io();
mensajes.innerHTML = "";
let replyMessage = null;
let isEditingMessage = false;
let editingMessageId;
let donators;
const emojiSearch = document.getElementById('emojiSearch');
const reactionsMap = new Map();
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
    socket.emit("whoami");
    socket.emit("whoDonate");
    await fetchAndCacheEmojis();
});

let actualUserName;

socket.on("iam", async (name) => {
    actualUserName = name;
    console.log(actualUserName);
});

socket.on("donators", async (listDonate) => {
    donators = listDonate
    console.log(donators);
});

socket.on("messageHistory", async (history) => {
    history.sort((a, b) => b.timestamp - a.timestamp);

    setTimeout(async () => {

        for (const msg of history) {
            msg.user = msg.user || msg.name;
            await loadmessages(msg, true);

            if (msg.emojis && Array.isArray(msg.emojis)) {
                msg.emojis.forEach((emoji) => {
                    if (emoji.users && Array.isArray(emoji.users)) {
                        emoji.users.forEach((user) => {
                            // Buscar el emoji en la cache
                            const matchedEmoji = emojiCache.find((cache) => cache.name === emoji.name);
                            if (matchedEmoji) {
                                renderReactions(msg.timestamp, matchedEmoji.name, matchedEmoji.url, user);
                            }
                        });
                    }
                });
            }
        }
    }, 50)

    await formatAllMessages();
});

socket.on("messageUpdated", async (data) => {
    const { timestamp, message, edited } = data;

    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
    if (messageElement) {
        const messageText = messageElement.querySelectorAll("p")[1];
        messageText.innerHTML = await formatMessage(data);

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

});

socket.on("messageDeleted", (data) => {
    const { timestamp } = data;
    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);

    if (messageElement) {
        messageElement.remove();
    } else {
        console.log(`No se encontró un mensaje con el timestamp ${timestamp}`);
    }
});

socket.on("newReaction", (data) => {
    const { messageId, emojiName, emojiUrl, userName } = data;
    renderReactions(messageId, emojiName, emojiUrl, userName);
});

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
            replyMessageDisplay.classList.add("hidden");
            sendbutton.style.top = "";
            socket.emit("sendmsg", finalMessage, replyMessage);
            replyMessage = null;

        } else if (isEditingMessage) {
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

    const donator = donators.find(d => d.name === msg.user);

    const userContainer = document.createElement("div");
    userContainer.style.display = "flex";
    userContainer.style.alignItems = "center";
    userContainer.style.paddingBottom = "10px";

    if (donator) {
        if (donator.color) {
            userName.style.color = donator.color;
        }

        if (donators.find(d => typeof d.img === 'string' && d.name === msg.user)) {
            const profileImage = new Image();
            const imageUrl = `/resources/profiles/${msg.user}_profile${donators.find(d => d.name === msg.user).img}`;

            profileImage.src = imageUrl;
            profileImage.style.width = "40px";
            profileImage.style.height = "40px";
            profileImage.style.borderRadius = "50%";
            profileImage.style.marginRight = "10px";
            userContainer.appendChild(profileImage);
        }

    }

    userContainer.appendChild(userName);
    gridItem.appendChild(userContainer);

    if (msg.edited) {
        const editedLabel = document.createElement("span");
        editedLabel.classList.add("edited-mark");
        editedLabel.style.color = "gray";
        editedLabel.style.fontSize = "0.8em";
        editedLabel.textContent = " (editado)";
        userName.appendChild(editedLabel);
    }

    messageText.classList.add("text-white", "text-lg");
    messageText.innerHTML = await formatMessage(msg);

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

    let [optionsButton, optionsMenu] = messageMenu(gridItem, msg);

    messageText.style.wordWrap = "break-word";
    messageText.style.whiteSpace = "pre-wrap";
    messageText.style.overflowWrap = "break-word";

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
    // Create options button with improved styling
    const optionsButton = document.createElement("button");
    optionsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>`;
    optionsButton.classList.add("options-button", "text-gray-400", "hover:text-white", "transition-colors", "duration-200", "rounded-full", "p-1", "hover:bg-gray-700");
    optionsButton.style.position = "absolute";
    optionsButton.style.top = "10px";
    optionsButton.style.right = "10px";

    const modalContainer = document.getElementById("messageOptionsModal");

    optionsButton.onclick = (event) => {
        event.stopPropagation();

        // Close any open menus first
        document.querySelectorAll('.options-menu-open').forEach(menu => {
            if (menu !== modalContainer) {
                menu.classList.add("hidden", "scale-95", "opacity-0");
                menu.classList.remove("options-menu-open", "scale-100", "opacity-100");
            }
        });

        const rect = optionsButton.getBoundingClientRect();
        modalContainer.innerHTML = `<div class="py-1"></div>`;
        const menuContent = modalContainer.querySelector('div');
        
        // Position the modal
        modalContainer.style.top = `${rect.top + window.scrollY + 25}px`;
        modalContainer.style.left = `${rect.left + window.scrollX - 197}px`;
        
        // Show the modal with animation
        modalContainer.classList.remove("hidden", "scale-95", "opacity-0");
        modalContainer.classList.add("options-menu-open", "scale-100", "opacity-100");

        const createOption = (icon, text, onClick, colorClass = "") => {
            const opt = document.createElement("div");
            opt.classList.add(
                "menu-option", "cursor-pointer", "hover:bg-gray-700", 
                "px-4", "py-2", "flex", "items-center", "gap-3",
                "transition-colors", "duration-150"
            );
            if (colorClass) opt.classList.add(colorClass);
            
            opt.innerHTML = `
                <span class="text-gray-400">${icon}</span>
                <span>${text}</span>
            `;
            
            opt.onclick = (e) => {
                e.stopPropagation();
                onClick();
                modalContainer.classList.add("hidden", "scale-95", "opacity-0");
                modalContainer.classList.remove("options-menu-open", "scale-100", "opacity-100");
            };
            return opt;
        };

        // Reply option
        const replyOption = createOption(
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>`,
            "Responder",
            () => {
                const shortMessage = msg.message.slice(0, 40);
                const displayMessage = shortMessage.length < 40 ? shortMessage : `${shortMessage}...`;
                replyMessageDisplay.textContent = `Respondiendo a ${msg.user}: ${displayMessage}`;
                replyMessageDisplay.classList.remove("hidden");
                replyMessage = msg;
                sendbutton.style.top = '28px';
            }
        );

        // Mark as unread option
        const markUnreadOption = createOption(
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>`,
            "Marcar como no leído",
            () => {
                addUnreadMarker(gridItem);
            }
        );

        // React option
        const reactOption = createOption(
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`,
            "Reaccionar",
            () => {
                showEmojiModal(msg);
            }
        );

        menuContent.appendChild(replyOption);
        menuContent.appendChild(markUnreadOption);
        menuContent.appendChild(reactOption);

        // Add separator before user-specific options
        if ((msg.name || msg.user) === actualUserName) {
            const separator = document.createElement("div");
            separator.classList.add("border-t", "border-gray-700", "my-1");
            menuContent.appendChild(separator);

            // Edit option
            const editOption = createOption(
                `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>`,
                "Editar mensaje",
                () => {
                    replyMessageDisplay.textContent = "Editando mensaje...";
                    replyMessageDisplay.classList.remove("hidden");
                    inputMessage.value = msg.message;
                    isEditingMessage = true;
                    editingMessageId = msg.timestamp;
                    sendbutton.style.top = '28px';
                }
            );

            // Delete option
            const deleteOption = createOption(
                `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>`,
                "Borrar mensaje",
                () => {
                    socket.emit("deletemsg", { id: msg.timestamp });
                },
                "hover:text-red-500"
            );

            menuContent.appendChild(editOption);
            menuContent.appendChild(deleteOption);
        }
    };

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!modalContainer.contains(e.target) && !e.target.closest('.options-button')) {
            modalContainer.classList.add("hidden", "scale-95", "opacity-0");
            modalContainer.classList.remove("options-menu-open", "scale-100", "opacity-100");
        }
    });

    return [optionsButton, modalContainer];
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
async function formatMessage(msg) {
    let message = msg.message.trim();

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

    if (msg.reply) {
        const replyUser = msg.reply.replyUser;
        const replyText = msg.reply.replyMessage;
        let replyPreview = replyText.length < 40 ? replyText : `${replyText.slice(0, 40)}...`;
        if (replyPreview.includes(':') || replyPreview.includes(';')) {
            emojiCache.forEach((emoji) => {
                const emojiUrl = emoji.url;
                const emojiName = emoji.name;
                const patterns = [`;${emojiName};`, `:${emojiName}:`];
                patterns.forEach(pattern => {
                    const regex = new RegExp(pattern, 'g');
                    if (regex.test(replyPreview)) {
                        replyPreview = replyPreview.replace(regex, `<img src="${emojiUrl}" width="50px" style="display: inline;">`);
                    }
                });
            });
        }
        message = `<div class="reply-info">Respondiendo a ${replyUser}: ${replyPreview}</div>` + message;
    }

    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
    message = message.replace(/\|\| (.*?) \|\|/g, `<span class="hidden-message" style="cursor: pointer; color: blue;">[Mostrar]</span><span class="actual-message" style="display:none;">$1</span>`);

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
        const originalMessage = {message: messageText.textContent};
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

//region Reaction Messages

function showEmojiModal(msg) {
    const emojiModal = document.getElementById("emojiModal");
    const emojiContainer = document.getElementById("emojiContainer");
    const closeModal = document.getElementById("closeModal");

    emojiModal.classList.remove("hidden");
    emojiContainer.innerHTML = "";

    emojiSearch.addEventListener('input', () => {
        const searchTerm = emojiSearch.value.toLowerCase();
        const filteredEmojis = emojiCache.filter((emoji) =>
            emoji.name.toLowerCase().includes(searchTerm)
        );
        renderEmojis(filteredEmojis, msg);
    });

    emojiCache.forEach((emoji) => {
        const emojiElement = document.createElement("img");
        emojiElement.src = emoji.url;
        emojiElement.alt = emoji.name;
        emojiElement.classList.add('w-10', 'h-10', 'cursor-pointer', 'hover:opacity-75', 'mr-4', 'mb-4');

        emojiElement.onclick = () => {
            socket.emit("addReaction", { messageId: msg.timestamp, emojiName: emoji.name, emojiUrl: emoji.url });
            emojiModal.classList.add("hidden");
        };
        emojiContainer.appendChild(emojiElement);
    });

    closeModal.onclick = () => {
        emojiModal.classList.add("hidden");
    };
}

function renderEmojis(emojis, msg) {
    emojiContainer.innerHTML = "";
    emojis.forEach((emoji) => {
        const img = document.createElement('img');
        img.src = emoji.url;
        img.alt = emoji.name;
        img.classList.add('w-10', 'h-10', 'cursor-pointer', 'hover:opacity-75', 'mr-4', 'mb-4');
        img.addEventListener('click', () => {
            socket.emit("addReaction", { messageId: msg.timestamp, emojiName: emoji.name, emojiUrl: emoji.url });
            emojiModal.classList.add("hidden");
        });
        emojiContainer.appendChild(img);
    });
}

function renderReactions(messageId, emojiName, emojiUrl, userName) {
    const messageElement = document.querySelector(`[data-timestamp="${messageId}"]`);

    if (messageElement) {
        if (!reactionsMap.has(messageId)) {
            reactionsMap.set(messageId, new Map());
        }

        const emojiMap = reactionsMap.get(messageId);
        if (!emojiMap.has(emojiName)) {
            emojiMap.set(emojiName, new Set());
        }

        const userSet = emojiMap.get(emojiName);
        userSet.add(userName);

        const timeElement = messageElement.querySelector("p.text-gray-400");
        if (timeElement) {
            let emojiContainer = messageElement.querySelectorAll("p")[3];
            if (!emojiContainer) {
                emojiContainer = document.createElement("p");
                emojiContainer.className = "emoji-container text-white text-sm mt-2";
                emojiContainer.style.fontSize = "30px";
                timeElement.insertAdjacentElement("afterend", emojiContainer);
            }

            let divContainerEmojis = emojiContainer.querySelector("div");
            if (!divContainerEmojis) {
                divContainerEmojis = document.createElement("div");
                divContainerEmojis.style.display = "inline-flex";
                emojiContainer.appendChild(divContainerEmojis);
            }

            let emojiElement = divContainerEmojis.querySelector(`img[alt="${emojiName}"]`);
            if (!emojiElement) {
                emojiElement = document.createElement("img");
                emojiElement.src = emojiUrl;
                emojiElement.alt = emojiName;
                emojiElement.title = emojiName;
                emojiElement.style.width = "30px";
                emojiElement.style.height = "30px";
                emojiElement.style.marginRight = "5px";
                emojiElement.onclick = () => {
                    socket.emit("addReaction", { messageId, emojiName, emojiUrl });
                };
                divContainerEmojis.appendChild(emojiElement);

                const emojiCount = document.createElement("span");
                emojiCount.className = "reaction-count text-gray-300 text-xs mt-1";
                emojiCount.textContent = "1";
                emojiCount.style.marginRight = "15px";
                emojiElement.insertAdjacentElement("afterend", emojiCount);
            } else {
                const emojiCount = emojiElement.nextElementSibling;
                if (emojiCount && emojiCount.classList.contains("reaction-count")) {
                    emojiCount.textContent = `${userSet.size}`;
                }
            }
        }
    } else {
        console.log(`No se encontró un mensaje para añadir reacción con el timestamp ${messageId}`);
    }
}