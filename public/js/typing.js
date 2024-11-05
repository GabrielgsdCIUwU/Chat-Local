document.addEventListener("DOMContentLoaded", () => {
const inputMessage = document.getElementById("mensaje");
// Variable para evitar enviar demasiados eventos "typing"
let typing = false;
let typingTimeout;

// Detectar cuando el usuario comienza a escribir
inputMessage.addEventListener("input", () => {
    if (!typing) {
      typing = true;
      socket.emit("typing", true); // Inicia el evento typing
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typing = false;
      socket.emit("typing", false); // Termina el evento typing si no hay actividad
    }, 4000);
});

// Escuchar los usuarios que están escribiendo desde el servidor
socket.on("usersTyping", (users) => {
    const typingDisplay = document.getElementById("typingDisplay");
    if (users.length === 0) return typingDisplay.innerHTML = "";
    if (users.length === 1) return typingDisplay.innerHTML = `${users[0]} está escribiendo...`;
    if (users.length > 1 && users.length < 6) {
        return typingDisplay.innerHTML = `${users.join(", ")} están escribiendo...`;
    } else {
        return typingDisplay.innerHTML = `Muchos están escribiendo...`;
    }
});
});

