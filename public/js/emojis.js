document.addEventListener("DOMContentLoaded", async function () {
    const buttonEmoji = document.getElementById('emojis');
    const modal = document.getElementById('emojiModal');
    const closeModalButton = document.getElementById('closeModal');
    const emojiContainer = document.getElementById('emojiContainer');
    const inputMessage = document.getElementById('mensaje');
    const stickerMode = document.getElementById('stickermode');
    const emojiSearch = document.getElementById('emojiSearch');
    let emojiCache = [];

    buttonEmoji.addEventListener('click', async () => {
        emojiContainer.innerHTML = "";
        try {
           fetchAndCacheEmojis();
        } catch (error) {
            console.error("Error al cargar los emojis:", error);
        }
    });

    closeModalButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

    var stickerModeValue = false;
    stickerMode.addEventListener("click", () => {
        stickerModeValue = true;
    });

    emojiSearch.addEventListener('input', () => {
        const searchTerm = emojiSearch.value.toLowerCase();
        const filteredEmojis = emojiCache.filter((emoji) =>
            emoji.name.toLowerCase().includes(searchTerm)
        );
        renderEmojis(filteredEmojis);
    });

    async function fetchAndCacheEmojis() {
        if (sessionStorage.getItem("emojiCache")) {
            emojiCache = JSON.parse(sessionStorage.getItem("emojiCache"));
            renderEmojis(emojiCache);
            modal.classList.remove('hidden');
        } else {
            loadEmojis();
        }
    }

    function loadEmojis() {
        fetch("/img/emoji")
            .then((response) => response.json())
            .then((data) => {
                emojiCache = data;
                sessionStorage.setItem("emojiCache", JSON.stringify(emojiCache));
                renderEmojis(emojiCache);
                modal.classList.remove('hidden');
            });
    }

    function renderEmojis(emojis) {
        emojiContainer.innerHTML = "";
        emojis.forEach((emoji) => {
            const img = document.createElement('img');
            img.src = emoji.url;
            img.alt = emoji.name;
            img.classList.add('w-10', 'h-10', 'cursor-pointer', 'hover:opacity-75', 'mr-4', 'mb-4');
            img.addEventListener('click', () => {
                const messageValue = inputMessage.value;
                if (stickerModeValue) {
                    inputMessage.value = messageValue + ' ' + `;${emoji.name};`;
                    stickerModeValue = false;
                } else {
                    inputMessage.value = messageValue + ' ' + `:${emoji.name}:`;
                }
            });
            emojiContainer.appendChild(img);
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
                    alert("Hubo un error al subir la imagen");
                    console.error('Error al subir la imagen');
                }
            })
            .catch(error => {
                alert("Hubo un error al subir la imagen");
                console.error('Error de red:', error);
            });
        }
    });
});
