document.addEventListener("DOMContentLoaded", async function () {
    const buttonEmoji = document.getElementById('emojis');
    const modal = document.getElementById('emojiModal');
    const closeModalButton = document.getElementById('closeModal');
    const emojiContainer = document.getElementById('emojiContainer');
    const inputMessage = document.getElementById('mensaje');
    // Función para abrir el modal y cargar los emojis
    buttonEmoji.addEventListener('click', async () => {
        // Vaciar el contenedor de emojis
        emojiContainer.innerHTML = "";

        // Petición al backend para obtener la lista de emojis
        try {
           loadEmojis()

        } catch (error) {
            console.error("Error al cargar los emojis:", error);
        }
    });

    // Función para cerrar el modal
    closeModalButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

    function loadEmojis() {
    fetch("/img/emoji")
    .then((response) => response.json())
    .then((data) => {
        data.forEach((emoji) => {
            const img = document.createElement('img');
                img.src = emoji.url;
                img.alt = emoji.name;
                img.classList.add('w-10', 'h-10', 'cursor-pointer', 'hover:opacity-75'); // Clases Tailwind para estilo
                img.addEventListener('click', () => {
                    // Aquí puedes añadir lógica para insertar el emoji en el mensaje
                    const messageValue = inputMessage.value;
                    inputMessage.value = messageValue + ' ' + `:${emoji.name}:`
                });
                emojiContainer.appendChild(img);
        });
         modal.classList.remove('hidden');
    });
}
});




