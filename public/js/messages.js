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
    const texto = document.createElement("p");

    texto.textContent = `${msg.user}: ${msg.message}`;
    gridItem.appendChild(texto);

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
    // en caso de necesitar el tiempo en el mensaje:
    // gridItem.setAttribute('data-timestamp', msg.timestamp);
}

function clearmsg() {
    mensajes.innerHTML = "";
}
