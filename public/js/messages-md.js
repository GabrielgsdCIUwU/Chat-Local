// messages.js
const socket = io();
mensajes.innerHTML = "";

let emojiCache = [];
let selectedUser = null; // Nuevo: almacenar el usuario seleccionado

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

socket.on("connect", async () => {
    socket.emit("requestHistory");
    await fetchAndCacheEmojis();
});

socket.on("messageHistory", async (history) => {
    history.sort((a, b) => b.timestamp - a.timestamp);
    for (const msg of history) {
        msg.user = msg.user || msg.name;
        await loadmessages(msg, true);
    }
    await formatAllMessages();
});

socket.on("reload", () => {
    window.location.reload();
});

let userNames = [];
socket.on("userNames", (names) => {
    userNames = names;
    loadUserMessages(); // Nuevo: cargar usuarios al inicio
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

const sendbutton = document.getElementById("enviar");
const userList = document.getElementById("userList");
const inputMessage = document.getElementById("mensaje");
const clearbutton = document.getElementById("clear");

let filteredUsers = [];
let selectedUserIndex = -1;

sendbutton.addEventListener("click", (event) => {
    event.preventDefault();
    sendMessage(); // Enviar mensaje al usuario seleccionado
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

// Función para cargar usuarios
function loadUserMessages() {
    const userMessages = document.getElementById("userMessages"); // Elemento donde se mostrarán los usuarios
    userNames.forEach(user => {
        const item = document.createElement("div");
        item.textContent = user;
        item.classList.add("p-2", "cursor-pointer", "hover:bg-gray-600");
        item.onclick = () => selectUser(user);
        userMessages.appendChild(item);
    });
}

async function formatAllMessages() {
    const mensajes = document.getElementById("mensajes");
    const messageTexts = mensajes.querySelectorAll(".text-lg");

    for (const messageText of messageTexts) {
        const originalMessage = messageText.textContent;
        const formattedMessage = await formatMessage(originalMessage);
        messageText.innerHTML = formattedMessage;
    }
}

async function formatMessage(message) {
    message = message.trim();
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

// Seleccionar usuario para chatear
function selectUser(userName) {
    const atIndex = inputMessage.value.lastIndexOf('@');
    inputMessage.value = inputMessage.value.slice(0, atIndex + 1) + userName + ' ';
    userList.classList.add("hidden");
    inputMessage.focus();
    selectedUserIndex = -1;
    selectedUser = userName; // Guardar usuario seleccionado
}

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
                sendMessage(); // Enviar mensaje solo al usuario seleccionado
                inputMessage.value = "";
            }
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage(); // Enviar mensaje solo al usuario seleccionado
        inputMessage.value = "";
    }
});

function sendMessage() {
    const message = inputMessage.value.trim();
    if (message && selectedUser) { // Comprobar si hay mensaje y usuario seleccionado
        socket.emit("sendmsg", { message, to: selectedUser }); // Enviar mensaje a un usuario específico
        inputMessage.value = "";
        userList.classList.add("hidden");
        removeUnreadMarker();
    }
}

function highlightUser(index) {
    const items = userList.children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove("bg-gray-600");
    }
    if (items[index]) {
        items[index].classList.add("bg-gray-600");
    }
}

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

async function loadmessages(msg, isHistory) {
    const mensajes = document.getElementById("mensajes");
    const gridItem = document.createElement("div");
    const userName = document.createElement("p");
    const messageText = document.createElement("p");
    const timeText = document.createElement("p");

    gridItem.classList.add("bg-gray-700", "rounded-lg", "shadow-md", "p-4", "mb-3", "transition-all", "duration-300", "ease-in-out");
    gridItem.style.marginBottom = "1rem";
    gridItem.classList.add("opacity-100");

    userName.classList.add("text-white", "font-bold", "text-xl", "mb-1");
    userName.textContent = msg.user;

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
    const date = new Date(time).toLocaleString();
    timeText.classList.add("text-gray-400", "text-sm", "mt-2");
    timeText.textContent = date;

    gridItem.appendChild(userName);
    gridItem.appendChild(messageText);
    gridItem.appendChild(timeText);
    mensajes.appendChild(gridItem);

    const messageList = document.getElementById("mensajes");
    messageList.scrollTop = messageList.scrollHeight;
}

function clearmsg() {
    mensajes.innerHTML = "";
}




//region md section

let selectedMDUser = null; // Variable global para almacenar el usuario seleccionado

function selectMDUser(user) {
    selectedMDUser = user; // Guardar el usuario seleccionado
    document.getElementById("mensajes").innerHTML = ""; // Limpiar el área de mensajes

    // Solicitar la historia de mensajes del usuario seleccionado al servidor
    socket.emit("requestMDHistory", { user });
}

// Recibir la historia de mensajes del MD seleccionado
socket.on("mdMessageHistory", (history) => {
    history.forEach(msg => {
        loadmessages(msg, true);  // Mostrar los mensajes históricos
    });
});


function loadMDUsers(userListMD) {
    const mdList = document.getElementById("mdlist");
    mdList.innerHTML = ""; // Limpiar la lista antes de cargar los usuarios

    userListMD.forEach(user => {
        const userItem = document.createElement("li");
        userItem.classList.add("menu-item", "text-center");
        
        const userLink = document.createElement("a");
        userLink.href = "#";  // La acción para cargar la conversación estará en un evento
        userLink.classList.add("block", "p-4", "text-white", "hover:bg-blue-600", "hover:text-white", "transition-colors", "duration-300");
        userLink.textContent = user;

        // Al hacer clic en un usuario, se cargará su conversación
        userLink.addEventListener("click", () => {
            selectMDUser(user);  // Llamar a la nueva función selectMDUser
        });

        userItem.appendChild(userLink);
        mdList.appendChild(userItem);
    });
}


// Socket event para recibir lista de usuarios de MD
socket.on("mdUsers", (userListMD) => {
    loadMDUsers(userListMD); // Cargar los usuarios de MD al inicio
});


function sendMessage() {
    const message = inputMessage.value.trim();
    if (message && selectedMDUser) { // Comprobar si hay mensaje y usuario de MD seleccionado
        socket.emit("sendmdmsg", { message, to: selectedMDUser }); // Enviar mensaje al usuario seleccionado
        inputMessage.value = "";
        removeUnreadMarker();
    } else if (!selectedMDUser) {
        alert("Por favor, selecciona un usuario para enviar el mensaje.");
    }
}


socket.on("sendmdmsg", (msg) => {
    if (msg.from === selectedMDUser) {
        loadmessages(msg, false);  // Mostrar el mensaje si es para el usuario seleccionado
    } else {
        // Aquí puedes manejar el caso de mensajes no leídos para otros usuarios
        updateUnreadCount();
    }
});


// Recibir la historia de mensajes del MD seleccionado
socket.on("mdMessageHistory", (history) => {
    history.forEach(msg => {
        loadmessages(msg, true);  // Mostrar los mensajes históricos
    });
});

socket.on("sendmdmsg", ({ message, to }) => {
    // Enviar el mensaje al destinatario específico
    sendMessageToUser(message, to);
});




// Selección de usuario para mensajes directos (MD)
function selectMDUser(userName) {
    selectedMDUser = userName; // Guardar el usuario seleccionado para MD
    clearmsg(); // Limpiar el área de mensajes

    // Mostrar un aviso de que estás chateando con el usuario seleccionado
    const mensajes = document.getElementById("mensajes");
    const aviso = document.createElement("p");
    aviso.textContent = `Estás chateando con ${userName}`;
    aviso.classList.add("text-yellow-400", "text-center", "my-2");
    mensajes.appendChild(aviso);

    // Solicitar la historia de mensajes del usuario seleccionado al servidor
    socket.emit("requestMDHistory", { user: userName });
}