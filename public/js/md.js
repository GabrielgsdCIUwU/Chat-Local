const socket = io();
let currentRecipient = null; // Usuario actual con el que estamos chateando
let currentUser;

 socket.on("currentUser", (userName) => {
    console.log(userName)
    currentUser = userName;
    console.log("Usuario actual:", currentUser);
  });

// Escuchar evento "userNames" para obtener lista de usuarios activos
socket.on("userNames", (users) => {
  const mdList = document.getElementById("mdlist");
  mdList.innerHTML = '<li class="text-xl font-bold text-white mb-4">Usuarios Activos</li>';

  users.forEach((user) => {

    if (user === currentUser) return;
    const li = document.createElement("li");
    li.classList.add("menu-item", "text-center");
    li.innerHTML = `
        <a href="#" class="block p-4 text-white hover:bg-blue-600 hover:text-white transition-colors duration-300">${user}</a>
      `;
    li.addEventListener("click", () => startPrivateChat(user));
    mdList.appendChild(li);
  });
});

// Función para iniciar un chat privado
  function startPrivateChat(user) {
    // Lógica para iniciar un chat privado con el usuario seleccionado
    console.log("Iniciando chat privado con", user);
  }

// Cambiar al chat privado seleccionado
function switchChat(user) {
  currentRecipient = user;
  document.getElementById("mensajes").innerHTML = `<h2>Chat con ${user}</h2>`;
}

// Enviar mensaje privado al usuario seleccionado
document.getElementById("enviar").addEventListener("click", () => {
  const mensaje = document.getElementById("mensaje").value;
  if (currentRecipient) {
    socket.emit("sendPrivateMsg", { recipient: currentRecipient, message: mensaje });
    document.getElementById("mensaje").value = "";
  } else {
    alert("Seleccione un usuario para enviar el mensaje privado.");
  }
});

// Recibir y mostrar mensajes privados
socket.on("privateMessage", ({ sender, message }) => {
  if (sender === currentRecipient) {
    const mensajesDiv = document.getElementById("mensajes");
    const msgElement = document.createElement("div");
    msgElement.classList.add("message");
    msgElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    mensajesDiv.appendChild(msgElement);
  }
});