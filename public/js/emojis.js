document.addEventListener("DOMContentLoaded", async function () {
    const buttonEmoji = document.getElementById('emojis');
    const modal = document.getElementById('emojiModal');
    const closeModalButton = document.getElementById('closeModal');
    const emojiContainer = document.getElementById('emojiContainer');

    // Función para abrir el modal y cargar los emojis
    buttonEmoji.addEventListener('click', async () => {
        // Vaciar el contenedor de emojis
        emojiContainer.innerHTML = "";

        // Petición al backend para obtener la lista de emojis
        try {
            const response = await fetch('/emoji');
            const emojis = await response.json();

            // Añadir cada emoji al contenedor
            emojis.forEach((emoji) => {
                const img = document.createElement('img');
                img.src = emoji.url;
                img.alt = emoji.name;
                img.classList.add('w-10', 'h-10', 'cursor-pointer', 'hover:opacity-75'); // Clases Tailwind para estilo
                img.addEventListener('click', () => {
                    // Aquí puedes añadir lógica para insertar el emoji en el mensaje
                    console.log(`Seleccionado emoji: ${emoji.name}`);
                });
                emojiContainer.appendChild(img);
            });

            // Mostrar el modal
            modal.classList.remove('hidden');
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
});
