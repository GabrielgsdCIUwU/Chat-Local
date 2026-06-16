# Chat-Local 💬 [![wakatime](https://wakatime.com/badge/user/0de54a75-ef87-45cb-8941-d36c72181f10/project/d8da0672-8156-41ef-8c87-551269088f41.svg)](https://wakatime.com/badge/user/0de54a75-ef87-45cb-8941-d36c72181f10/project/d8da0672-8156-41ef-8c87-551269088f41)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Una aplicación de chat en tiempo real desarrollada con **JavaScript Vanilla** (Node.js, Express y Socket.IO). Este proyecto destaca por su arquitectura robusta, aplicación de **principios SOLID** y patrones de diseño (Inyección de Dependencias, Repositorios, Servicios) sin depender de frameworks pesados..

## ✨ Características Principales

* **💬 Chat en Tiempo Real:** Comunicación instantánea con soporte de historial y prevención de *Race Conditions*.
* **🛡️ Sistema de Autenticación:** Registro y login con contraseñas cifradas (`bcrypt`) y gestión segura de sesiones.
* **🤖 Bot Multipropósito y Comandos Dinámicos:** Intérprete de comandos (ej. `/8ball`, `/ping`) cargados dinámicamente mediante abstracción.
* **🎲 Economía (Gambling):** Sistema de dinero virtual, robos, duelos y loterías con validación estricta de tipos numéricos.
* **🔒 Seguridad Anti-Ataques:** Protección contra ataques DDoS y de fuerza bruta mediante Rate Limiting (`express-rate-limit`) y bases de datos aisladas del acceso público.

---

## 🛠️ Requisitos del Sistema

- [Node.js v20.17.0+](https://nodejs.org/en/download)
- npm (Node Package Manager)

---

## 🚀 Instalación y Despliegue Local

1. **Clona el repositorio:**
   ```sh
   git clone https://github.com/GabrielgsdCIUwU/Chat-Local.git
   cd Chat-Local
   ```

2. **Instala las dependencias:**
   ```sh
   npm install
   ```

3. **Configura el entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade:
   ```env
   sessionSecret=tuSecretoDeSesionSuperSeguro
   PORT=3000
   USE_HTTPS=false
   ```

4. **Inicializa las bases de datos locales y carpetas de recursos:**
   Este script creará los archivos JSON seguros y las carpetas para subir imágenes.
   ```sh
   npm run init
   ```

5. **Compila los estilos (TailwindCSS):**
   ```sh
   npm run css
   ```

6. **Inicia el servidor:**
   ```sh
   npm run server
   ```
   *Abre tu navegador en `http://localhost:3000` para empezar.*

---

## 🏗️ Arquitectura y Estructura del Proyecto

El código está estructurado en una arquitectura de capas (N-Tier) para mantener un alto nivel de escalabilidad y mantenibilidad:

* **`backend/core/`**: Contenedor de Inyección de Dependencias (`DIContainer`), respuestas estructuradas y constantes.
* **`backend/database/` y `backend/repositories/`**: Abstracción del acceso a datos. Maneja un sistema de colas (`Promise.resolve()`) para evitar la sobreescritura corrupta de los JSON.
* **`backend/services/`**: Lógica de negocio pura (Autenticación, validación de Gambling, gestión de perfiles).
* **`bot/`**: Subsistema aislado que actúa como un framework propio de comandos (similar a Discord.js).
* **`socket/`**: Gestión de eventos en tiempo real aislados por dominio (chat, usuarios, encuestas, privados).
* **`public/`**: Assets puramente front-end (JS del cliente, CSS compilado y Vistas HTML).

---

## 🌐 Notas de Despliegue (Producción)

Si deseas desplegar esta aplicación, ten en cuenta las siguientes configuraciones ya incluidas:

* **Reverse Proxy Trust:** El servidor confía en la IP del proxy (`app.set('trust proxy', 1)`), ideal para Nginx o Cloudflare Tunnels.
* **Rate Limiting:** Prevención de fuerza bruta en rutas de autenticación.
* **Protección de Datos:** Las bases de datos (`.json`) operan en la carpeta `backend/` para evitar exposición estática en la web.
* **PM2:** Se recomienda utilizar `pm2` para mantener vivo el proceso en entornos Linux.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas sugerir mejoras de arquitectura, optimización o reportar bugs, por favor abre un *issue* o un *pull request*.

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Consulta el archivo `LICENSE` para más detalles.
