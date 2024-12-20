import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import passport from "passport";
import FileStoreFactory from "session-file-store";
import fs from "fs";
import botHandler from "./bot/index.js";

import webrouter from "./router/paginas.js";
import admin from "./router/admin.js";
import chat from "./router/chat.js";
import img from "./router/img.js"



const FileStore = FileStoreFactory(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });


const app = express();

app.use(express.json());
app.disable("x-powered-by");

const sessionMiddleware = session({
    store: new FileStore({
        path: "./sessions",
        ttl: 86400,
    }),
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: false,
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/resources", express.static(path.join(__dirname, "resources")));

app.use(webrouter);
app.use(admin);
app.use(chat);
app.use("/img", img)

function isAuthenticated(socket, next) {
    if (socket.request.session && socket.request.session.user) {
        next();
    } else {
        next(new Error("Usuario no autenticado"));
    }
}

// Aplica el middleware de sesión a los sockets
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, (err) => {
        if (err) return next(err);
        next();
    });
});


const leerEncuesta = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'public/json/encuesta.json'), 'utf8', (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data));
        });
    });
};

const guardarEncuesta = (encuestaData) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, 'public/json/encuesta.json'), JSON.stringify(encuestaData, null, 2), 'utf8', (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};


const connectedUsers = new Set();
function getUserNames() {
    return new Promise((resolve) => {
        const userNames = Array.from(connectedUsers);
        resolve(userNames);
    });
}

const typingUsers = new Set();
const voteduser = new Set();
io.on("connection", (socket) => {
    isAuthenticated(socket, (err) => {
        if (err) {
            socket.disconnect();
            return;
        }

        const user = socket.request.session.user;
        connectedUsers.add(user.name);

        // Emite la lista de usuarios conectados a todos los usuarios
        getUserNames().then(userNames => {
            socket.emit("userNames", userNames);
        });

        // Escuchar la solicitud de inicio de chat privado
        socket.on("startPrivateChat", (recipientName) => {
            const recipientSocket = Array.from(io.sockets.sockets).find(([id, s]) => s.request.session.user.name === recipientName);

            if (recipientSocket) {
                const privateRoom = `${user.name}-${recipientName}`; // Nombre de la sala privada
                socket.join(privateRoom);  // El usuario que inició se une a la sala
                recipientSocket[1].join(privateRoom);  // El destinatario se une a la sala

                // Notificar a ambos usuarios que el chat privado ha comenzado
                socket.emit("privateChatStarted", { room: privateRoom, recipient: recipientName });
                recipientSocket[1].emit("privateChatStarted", { room: privateRoom, recipient: user.name });
            } else {
                socket.emit("error", { message: "El usuario no está disponible." });
            }
        });

        // Enviar mensajes dentro de una sala privada
        socket.on("privateMessage", ({ room, message }) => {
            const timestamp = new Date().getTime();
            const newMessage = { name: user.name, message, timestamp };

            // Emitir solo a los usuarios en la sala privada
            io.to(room).emit("privateMessage", newMessage);
        });

        // Emite el nombre del usuario
        socket.on("whoami", () => {
            socket.emit("iam", user.name);
        });

        // Chat público (ya existente)
        socket.on("sendmsg", (msg) => {
            const timestamp = new Date().getTime();
            const messagesFilePath = path.join(__dirname, "./public/json/messages.json");

            if (msg.startsWith("/bot")) {
                botHandler.handleCommand({ msg, socket, io, username: user.name });
                return;
            }

            fs.readFile(messagesFilePath, "utf-8", (err, data) => {
                if (err) {
                    console.error("Error al leer el archivo de mensajes:", err);
                    return socket.emit("error", { message: "Error al leer los mensajes" });
                }

                let messagesData = [];
                try {
                    messagesData = JSON.parse(data);
                } catch (error) {
                    console.error("Error al parsear los mensajes:", error);
                    return socket.emit("error", { message: "Error al parsear los mensajes" });
                }

                const newMessage = { name: user.name, message: msg, timestamp };
                messagesData.push(newMessage);

                fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2), "utf-8", (err) => {
                    if (err) {
                        console.error("Error al escribir el mensaje en el archivo:", err);
                        return socket.emit("error", { message: "Error al escribir el mensaje" });
                    }

                    io.emit("sendmsg", { user: user.name, message: msg, timestamp: timestamp });
                });
            });
        });

        // Solicitar historial de mensajes
        socket.on("requestHistory", () => {
            const messagesFilePath = path.join(__dirname, "./public/json/messages.json");
            fs.readFile(messagesFilePath, "utf-8", (err, data) => {
                if (err) {
                    console.error("Error al leer el archivo de mensajes:", err);
                    return socket.emit("error", { message: "Error al leer los mensajes" });
                }

                let messagesData = [];
                try {
                    messagesData = JSON.parse(data);
                } catch (error) {
                    console.error("Error al parsear los mensajes:", error);
                    return socket.emit("error", { message: "Error al parsear los mensajes" });
                }

                socket.emit("messageHistory", messagesData);
            });
        });

        socket.on("emojisNames", () => {
            const emojisNames = new Set();
            const imgDir = path.join(__dirname, "./resources/emojis");

            const files = fs.readdirSync(imgDir);
            files.forEach((file) => {
                emojisNames.add(path.parse(file).name)
            });
            socket.emit("emojisNames", emojisNames);
        });


        socket.on("typing", (isTyping) => {
            if (isTyping) {
                typingUsers.add(user.name);
            } else {
                typingUsers.delete(user.name);
            }
            io.emit("usersTyping", Array.from(typingUsers));
        });

        //Editar mensaje

        socket.on("editmsg", (data) => {
            const { message, id: timestamp } = data;
            const messagesFilePath = path.join(__dirname, "public/json/messages.json");
            let messages = JSON.parse(fs.readFileSync(messagesFilePath, "utf-8"));

            const messageIndex = messages.findIndex((msg) => msg.timestamp === timestamp);

            if (messageIndex !== -1) {
                console.log("usuario:", user.name, "usuarioMessage:", messages[messageIndex].name)
                if (messages[messageIndex].name === user.name) {
                    messages[messageIndex].message = message;
                    messages[messageIndex].edited = true;

                    fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2), (err) => {
                        if (err) {
                            console.error("Error al guardar el archivo JSON:", err);
                            return;
                        }
                        console.log("Mensaje editado y guardado en el archivo JSON");
                        io.emit("messageUpdated", { timestamp, message, edited: true });
                    })
                }
            }

        });

        // borrar mensaje
        socket.on("deletemsg", (data) => {
            const { id: timestamp } = data;
            const messagesFilePath = path.join(__dirname, "public/json/messages.json");
            let messages = JSON.parse(fs.readFileSync(messagesFilePath, "utf-8"));

            const messageIndex = messages.findIndex((msg) => msg.timestamp === timestamp);
            if (messageIndex !== -1) {
                if (messages[messageIndex].name === user.name) {
                    messages.splice(messageIndex, 1);
                    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), "utf-8", (err) => {
                        if (err) {
                            return console.error("Error al guardar el archivo JSON, al borrar el mensaje:", err);
                        }
                    });
                    io.emit("messageDeleted", { timestamp });
                }
            }
        });

        //Reaction handler
        socket.on("addReaction", (data) => {
            const { messageId, emojiName, emojiUrl } = data;
            const messagesFilePath = path.join(__dirname, "public/json/messages.json");
            const userName = user.name
            let messages = JSON.parse(fs.readFileSync(messagesFilePath, "utf-8"));

            const messageIndex = messages.findIndex((msg) => msg.timestamp === messageId);

            if (messageIndex !== -1) {
                const message = messages[messageIndex];

                if (!message.emojis) {
                    message.emojis = [];
                }

                let emojiEntry = message.emojis.find((emoji) => emoji.name === emojiName);

                if (!emojiEntry) {
                    emojiEntry = { name: emojiName, users: [] };
                    message.emojis.push(emojiEntry);
                }

                if (!emojiEntry.users.includes(userName)) {
                    emojiEntry.users.push(userName);
                }

                fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), "utf-8");

                io.emit("newReaction", { messageId, emojiName, emojiUrl, userName });
            }
        });


        socket.on('votar', async (data) => {
            try {
                // Si el usuario ya ha votado, no le permitimos votar nuevamente
                console.log(voteduser, voteduser.has(user.name))
                if (voteduser.has(user.name)) {
                    console.log("dentro")
                    return;
                }

                voteduser.add(user.name);
                console.log(voteduser)

                // Cargar los datos de la encuesta
                const encuestaData = await leerEncuesta();

                // Sumar 1 voto a la opción seleccionada
                encuestaData.opciones[data.opcion].votos++;

                // Guardar los datos actualizados en el archivo JSON
                await guardarEncuesta(encuestaData);

                // Emitir los nuevos resultados a todos los usuarios conectados
                io.emit('actualizarVotos', encuestaData.opciones);

            } catch (error) {
                console.error('Error al procesar el voto:', error);
                socket.emit('error', 'Hubo un error al procesar tu voto.');
            }
        });


        socket.on("disconnect", () => {
            connectedUsers.delete(user.name);
            typingUsers.delete(user.name);
            io.emit("usersTyping", Array.from(typingUsers));
            getUserNames().then(userNames => {
                io.emit("userNames", userNames);
            });
        });

        //region private
        app.get("/private/reload", (req, res) => {
            if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
                io.emit("reload");
                res.sendFile(path.join(__dirname, "./public/views/reload.html"))
            }
        });
        app.get("/private/testing", (req, res) => {
            if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
                res.sendFile(path.join(__dirname, "./public/views/testing.html"))
            }
        });
        app.get("/private/md", (req, res) => {
            if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
                res.sendFile(path.join(__dirname, "./public/views/testing-md.html"))
            }
        });
        app.get("/login", (req, res) => {
            res.redirect("/msg")
        });
    });
});


server.listen(port, () => {
    console.log("Escuchando: " + port);
});
