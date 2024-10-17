document.addEventListener("DOMContentLoaded", async function () {
    const buttonEmoji = document.getElementById('emojis');
    const modal = document.getElementById('emojiModal');
    const closeModalButton = document.getElementById('closeModal');
    const emojiContainer = document.getElementById('emojiContainer');
    const inputMessage = document.getElementById('mensaje');
    const stickerMode = document.getElementById('stickermode');
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

    var stickerModeValue = false;
    stickerMode.addEventListener("click", () => {
        stickerModeValue = true;
    });

    function loadEmojis() {
    fetch("/img/emoji")
    .then((response) => response.json())
    .then((data) => {
        data.forEach((emoji) => {
            const img = document.createElement('img');
                img.src = emoji.url;
                img.alt = emoji.name;
                img.classList.add('w-10', 'h-10', 'cursor-pointer', 'hover:opacity-75','mr-4', 'mb-4'); // Clases Tailwind para estilo
                img.addEventListener('click', () => {
                    // Aquí puedes añadir lógica para insertar el emoji en el mensaje
                    const messageValue = inputMessage.value;
                    if (stickerModeValue == true) {
                        inputMessage.value = messageValue + ' ' + `;${emoji.name};`
                        stickerModeValue = false;
                    }else {
                        inputMessage.value = messageValue + ' ' + `:${emoji.name}:`
                    }
                    
                });
                emojiContainer.appendChild(img);
        });
         modal.classList.remove('hidden');
    });
}

    document.getElementById('emojiUpload').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('emoji', file);
            
            fetch('/img/emoji', {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                if (response.ok) {
                    alert("Imagen subido con éxito, ahora está en la waitlist")
                    window.location.reload();
                } else {
                    alert("Hubo un error al subir la imagen")
                    console.error('Error al subir la imagen');
                }
            })
            .catch(error => {
                alert("Hubo un error al subir la imagen")
                console.error('Error de red:', error);
            });
        }
    });
});




