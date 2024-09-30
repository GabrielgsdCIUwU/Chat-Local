const socket = io();
mensajes.innerHTML = "";
socket.on("connect", () => {
    console.log("Conectado al servidor");
});

socket.on("sendmsg", (msg) => {
    console.log(msg);
    loadmessages(msg)
});

const sendbutton = document.getElementById("enviar");
const clearbutton = document.getElementById("clear");
//botones
sendbutton.addEventListener("click", () => {
    const msg = document.getElementById("mensaje").value;
    socket.emit("sendmsg", msg);
    document.getElementById("mensaje").value = "";
});

clearbutton.addEventListener("click", () => {clearmsg()})




//funciones
function loadmessages(msg) {
    const mensajes = document.getElementById("mensajes")
    const gridItem = document.createElement("div");
    const texto = document.createElement("p")
    texto.textContent = `${msg}`
    gridItem.appendChild(texto)
    mensajes.appendChild(gridItem);
    
}

function clearmsg() {
    mensajes.innerHTML = "";
}


