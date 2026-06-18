# Chat-Local 💬 [![wakatime](https://wakatime.com/badge/user/0de54a75-ef87-45cb-8941-d36c72181f10/project/d8da0672-8156-41ef-8c87-551269088f41.svg)](https://wakatime.com/badge/user/0de54a75-ef87-45cb-8941-d36c72181f10/project/d8da0672-8156-41ef-8c87-551269088f41)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![AGPL 3.0](https://img.shields.io/badge/License-AGPL_3.0-blue.svg?style=for-the-badge)



## 📑 Índice
- [Características Principales](#-características-principales)
- [Configuración del Proyecto](#️-configuración-del-proyecto)
- [Requisitos del Sistema](#️-requisitos-del-sistema)
- [Instalación y Despliegue Local](#-instalación-y-despliegue-local)
- [Arquitectura y Estructura](#️-arquitectura-y-estructura-del-proyecto)
- [Notas de Despliegue (Producción)](#-notas-de-despliegue-producción)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)

---

## ✨ Características Principales

* **💬 Chat en Tiempo Real:** Comunicación instantánea con soporte de historial y prevención de *Race Conditions*.
* **🛡️ Sistema de Autenticación:** Registro y login con contraseñas cifradas (`bcrypt`) y gestión segura de sesiones locales.
* **🤖 Bot Multipropósito y Comandos Dinámicos:** Intérprete de comandos (ej. `/8ball`, `/ping`) cargados dinámicamente mediante abstracción.
* **🎲 Economía (Gambling):** Sistema de dinero virtual, robos, duelos y loterías con validación estricta de tipos numéricos y prevención de sobreescritura.
* **🔒 Seguridad Anti-Ataques:** Protección contra ataques DDoS y de fuerza bruta mediante Rate Limiting (`express-rate-limit`) y bases de datos aisladas del acceso público.

---

## ⚙️ Configuración del Proyecto

Chat-Local está diseñado para ser altamente personalizable. Estas son las áreas clave donde puedes configurar el comportamiento de la aplicación:

### 1. Variables de Entorno (`.env`)
El archivo principal de configuración rápida. Debes crearlo en la raíz del proyecto basándote en el siguiente formato:
```env
# Clave secreta para cifrar las cookies de sesión de Express
sessionSecret=tuSecretoDeSesionSuperSeguro

# Puertos donde correrá la aplicación
PORT=3000
HTTPS_PORT=3443

# Cambia a "true" si planeas desplegar el proyecto usando certificados locales o proxys que requieran https explícito a nivel de Node
USE_HTTPS=false
```

### 2. Archivos de Base de Datos y Assets
La persistencia de datos (usuarios, perfiles, etc.) se guarda localmente en archivos JSON ubicados en `backend/data/`. Estos archivos **no se suben al repositorio** por motivos de seguridad. Para inicializar esta configuración (y crear las carpetas necesarias como las subidas de imágenes), se utiliza:
```sh
npm run init
```

### 3. Configuraciones Avanzadas (Código Interno)
Para ajustes detallados sobre roles, precios del sistema de economía (RPG), y configuraciones constantes, puedes modificar el siguiente archivo clave:
- 📂 **[`backend/core/constants.js`](backend/core/constants.js)**: Aquí encontrarás variables congeladas (`Object.freeze`) como `ROLES`, `GAME_CONFIG`, costos de gremios, recompensas diarias, tiempos de expiración y configuraciones específicas del módulo RPG. Si deseas cambiar el comportamiento de comandos o límites del juego, este es tu archivo.

### 4. Estilos Frontend (Tailwind)
Puedes personalizar los colores, fuentes y directivas modificando:
- 📂 **`tailwind.config.js`**: Raíz del proyecto.
- 📂 **`public/css/messages.css`**: Archivo base de Tailwind.

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
   Crea un archivo `.env` en la raíz del proyecto tal como se explica en la sección de *Configuración del Proyecto*.

4. **Inicializa las bases de datos locales y carpetas de recursos:**
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
   > 🌐 *Abre tu navegador en `http://localhost:3000` para empezar a chatear.*

---

## 🏗️ Arquitectura y Estructura del Proyecto

El código está estructurado en una arquitectura de capas (N-Tier) para mantener un alto nivel de escalabilidad y mantenibilidad. No se utilizan frameworks robustos de frontend como React o Angular; todo se procesa mediante lógica backend segura y manipulación del DOM nativa.

```text
Chat-Local/
├── backend/
│   ├── api/          # Rutas HTTP
│   ├── controllers/  # Controladores de la API
│   ├── core/         # Inyección de dependencias (DIContainer) y Constantes de Configuración
│   ├── data/         # Bases de datos JSON aisladas (Generado en init)
│   ├── database/     # Motores de persistencia e I/O de archivos
│   ├── repositories/ # Abstracciones de consultas a las bases de datos
│   └── services/     # Lógica de negocio pura (Auth, RPG, Perfiles)
├── bot/              # Subsistema aislado para el bot inteligente y comandos dinámicos
├── public/           # Archivos estáticos, vistas, JS cliente e imágenes
└── socket/           # Controladores de WebSockets divididos por dominios (eventos)
```

---

## 🌐 Notas de Despliegue (Producción)

Si deseas desplegar esta aplicación en un VPS o plataforma en la nube, ten en cuenta:

* **Reverse Proxy Trust:** El servidor confía en la IP del proxy (`app.set('trust proxy', 1)`). Esto es fundamental si utilizas Nginx, Apache o Cloudflare Tunnels para que el Rate Limit no bloquee a todos los usuarios bajo una misma IP.
* **Protección de Datos:** Las bases de datos operan dentro de la carpeta `backend/data/`. Estas nunca deben ser servidas estáticamente en `public/`.
* **PM2:** Se recomienda encarecidamente utilizar `pm2` para mantener vivo el proceso en entornos Linux:
  ```sh
  npm install pm2 -g
  pm2 start index.js --name "chat-local"
  ```

---

## 🤝 Contribuciones

¡Las contribuciones son siempre bienvenidas! Si deseas sugerir mejoras de arquitectura, proponer nuevos comandos para el bot, optimizar procesos o reportar errores (bugs), por favor abre un *issue* o envía un *pull request*.

## 📄 Licencia

Este proyecto está licenciado bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Consulta el archivo `LICENSE` para más detalles.
