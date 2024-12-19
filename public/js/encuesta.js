document.addEventListener('DOMContentLoaded', async () => {
  const socket = io();
  const encuestaTitle = document.getElementById('EncuestaTitle');
  const resultadosDiv = document.getElementById('EncuestaOpciones');
  const totalVotosSpan = document.getElementById('total-votos');
  let clicado = false
  try {
    const response = await fetch('/public/json/encuesta.json');

    if (!response.ok) {
      throw new Error(`Error al cargar el JSON: ${response.statusText}`);
    }

    const encuestaData = await response.json();

    if (encuestaData.hiden === "True") {
      const encuesta = document.getElementById("Encuesta")
      encuesta.classList.add("hidden")
    }

    // Mostrar la pregunta en el encabezado
    encuestaTitle.textContent = encuestaData.pregunta;

    // Renderizar opciones sin mostrar porcentajes inicialmente
    encuestaData.opciones.forEach((opcion, index) => {
      const opcionHTML = `
        <div class="space-y-2">
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium text-gray-300">${opcion.texto}</span>
            <span id="votos-${index}" class="text-sm font-medium text-gray-300 hidden">${opcion.votos} (0.0%)</span>
          </div>
          <div class="flex items-center bg-gray-700 rounded-full h-4 w-full">
            <div id="barra-${index}" class="bg-blue-600 h-4 rounded-l-full" style="width: 0%"></div>
            <button id="opcion-${index}" class="bg-blue-600 text-white text-sm font-medium py-1 px-4 rounded-l-none rounded-r-full flex-shrink-0">
              Votar
            </button>
          </div>
        </div>
      `;
      resultadosDiv.insertAdjacentHTML('beforeend', opcionHTML);

      // Manejar el evento de clic en cada opción
      document.getElementById(`opcion-${index}`).addEventListener('click', () => {
        if(clicado) return

        socket.emit('votar', { opcion: index });
        mostrarPorcentajes();
        actualizarResultados(encuestaData.opciones)
        clicado = true
      });
    });

    // Escuchar actualizaciones de votos desde el servidor
    socket.on('actualizarVotos', (data) => {
      console.log(data)
      actualizarResultados(data);
    });

    function actualizarResultados(data) {
      const totalVotos = data.reduce((total, opcion) => total + opcion.votos, 0);
      totalVotosSpan.textContent = `Total de votos: ${totalVotos}`;

      data.forEach((opcion, index) => {
        const porcentaje = totalVotos > 0 ? (opcion.votos / totalVotos) * 100 : 0;

        // Actualizar votos y porcentaje
        const votosSpan = document.getElementById(`votos-${index}`);
        votosSpan.textContent = `${opcion.votos} (${porcentaje.toFixed(1)}%)`;

        // Actualizar barra de progreso
        document.getElementById(`barra-${index}`).style.width = `${porcentaje}%`;
      });
    }

    function mostrarPorcentajes() {
      encuestaData.opciones.forEach((_, index) => {
        document.getElementById(`votos-${index}`).classList.remove('hidden');
      });
    }
  } catch (error) {
    console.error('Error al cargar la encuesta:', error);
  }
});
