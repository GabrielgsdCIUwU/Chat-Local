const socket = io();
mensajes.innerHTML = "";

socket.on("connect", () => {
    socket.emit("requestHistory");
});

socket.on("messageHistory", (history) => {
    history.sort((a, b) => b.timestamp - a.timestamp);
    history.forEach(msg => {
        msg.user = msg.user || msg.name;
        loadmessages(msg, true);
    });
});

socket.on("error", (err) => {
    console.error(err);
    alert("Hubo un error en el servidor: " + err.message);
});

socket.on("sendmsg", (msg) => {
    loadmessages(msg, false);
});

const sendbutton = document.getElementById("enviar");
sendbutton.addEventListener("click", () => {
    const msg = document.getElementById("mensaje").value;
    if (msg.trim() !== "") {
        socket.emit("sendmsg", msg);
        document.getElementById("mensaje").value = "";
    }
});

const clearbutton = document.getElementById("clear");
clearbutton.addEventListener("click", () => {
    clearmsg();
});

function loadmessages(msg, isHistory) {
    const mensajes = document.getElementById("mensajes");
    const gridItem = document.createElement("div");
    const userName = document.createElement("p");
    const messageText = document.createElement("p");

    // Estilos con TailwindCSS
    gridItem.classList.add("bg-white", "rounded-lg", "shadow-md", "p-4", "mb-3", "transition-all", "duration-300", "ease-in-out", "margin-bott");

    if (isHistory) {
        gridItem.classList.add("opacity-75");
    } else {
        gridItem.classList.add("opacity-100");
    }

    // Estilo del nombre del usuario
    userName.classList.add("text-gray-900", "font-bold", "text-lg", "mb-1");
    userName.textContent = msg.user;

    // Estilo del mensaje
    messageText.classList.add("text-gray-700", "text-sm");
    messageText.textContent = msg.message;

    gridItem.appendChild(userName);
    gridItem.appendChild(messageText);

    // Opcional: puedes mostrar la hora si es necesario
    // gridItem.setAttribute('data-timestamp', msg.timestamp);

    if (isHistory) {
        const allMessages = Array.from(mensajes.children);
        let inserted = false;

        for (let i = 0; i < allMessages.length; i++) {
            const currentMsg = allMessages[i];
            const currentTimestamp = parseInt(currentMsg.dataset.timestamp, 10);

            if (msg.timestamp > currentTimestamp) {
                mensajes.insertBefore(gridItem, currentMsg);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            mensajes.appendChild(gridItem);
        }
    } else {
        mensajes.prepend(gridItem);
    }
}

function clearmsg() {
    mensajes.innerHTML = "";
}
