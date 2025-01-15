# Chat-Local

Este es un proyecto de chat local que utiliza `Node.js`, `Express` y `Socket.IO` para proporcionar una experiencia de chat en tiempo real. El proyecto incluye características como autenticación de usuarios, emojis personalizados y más.

## Requisitos

- [Node.js v20.17.0](https://nodejs.org/en/download)
- npm (Node Package Manager)

## Instalación

1. Clona el repositorio en tu máquina local:

    ```sh
    git clone https://github.com/GabrielgsdCIUwU/Chat-Local.git
    cd Chat-Local
    ```

2. Instala las dependencias del proyecto:

    ```sh
    npm install
    ```

3. Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables de entorno:

    ```env
    sessionSecret=tuSecretoDeSesion
    PORT=3000
    ```

4. Crea el archivo `css` de [`tailwindcss`](https://tailwindcss.com/) con el siguiente comando:

    ```sh
    npm run css
    ```

5. Crea todos los archivos `json` y carpetas necesarias con el siguiente comando:

    ```sh
    npm run init
    ```

5. Inicia el servidor:

    ```sh
    npm run server
    ```

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

### Archivos Principales

#### index.js

Este archivo configura y arranca el servidor Express, además de manejar las conexiones de Socket.IO.

#### paginas.js

Define las rutas para servir las páginas HTML del proyecto.

#### img.js

Maneja la carga y el servicio de emojis personalizados.

#### chat.js

Define las rutas y la lógica para el chat público.

#### admin.js

Maneja la autenticación de usuarios y el registro.

### Carpetas principales

#### backend/json

Aquí se guarda todos los nombres de usuario, contraseñas y usuarios que estan baneados del chat.

#### bot

Contiene todos los comandos y como lo va a manejar el bot para responder en el chat.

#### resources/emojis

Esta carpeta es donde se guarda todos los emojis que se va a mostrar en el chat.

#### resources/waitlist

Esta carpeta es donde se guarda todos los archivos que suben los usuarios.

## Uso

1. Abre tu navegador y navega a http://localhost:3000 para ver la página principal.
2. Regístrate y luego inicia sesión para acceder al chat.
3. Sube emojis personalizados y úsalos en tus mensajes.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para discutir cualquier cambio que te gustaría hacer.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.