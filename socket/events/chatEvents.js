import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import botHandler from "../../bot/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MSG_PATH = path.join(__dirname, "../../public/json/messages.json");

export default function registerChatEvents(io, socket, user) {
    
    // Historial
    socket.on("requestHistory", async () => {
        try {
            const data = await fs.readFile(MSG_PATH, "utf-8");
            socket.emit("messageHistory", JSON.parse(data));
        } catch (error) {
            socket.emit("error", { message: "Error al leer los mensajes" });
        }
    });

    // Enviar mensaje
    socket.on("sendmsg", async (msg, reply) => {
        const timestamp = new Date().getTime();
        try {
            const data = await fs.readFile(MSG_PATH, "utf-8");
            let messagesData = JSON.parse(data);

            const newMessage = { 
                user: user.name, 
                message: msg, 
                timestamp, 
                ...(reply && { reply: { replyUser: reply.user, replyMessage: reply.message } })
            };
            
            messagesData.push(newMessage);
            await fs.writeFile(MSG_PATH, JSON.stringify(messagesData, null, 2), "utf-8");
            
            io.emit("sendmsg", newMessage);

            // Logica de Spam de Donaciones
            if (msg.includes("ko-fi.com/") || msg.includes("paypal.com/") || msg.includes("paypal.me/")) {
                const spamerFilePath = path.join(__dirname, "../../public/json/spamer.json");
                const spamData = await fs.readFile(spamerFilePath, "utf-8");
                let spamCount = JSON.parse(spamData);
                if (!Array.isArray(spamCount) || spamCount.length === 0) spamCount = [0];
                spamCount[0] += 1;
                
                await fs.writeFile(spamerFilePath, JSON.stringify(spamCount));
                io.emit("sendmsg", { user: "🤖 Bot", message: `${user.name} ha contribuido a mi creador, el contador sube a ${spamCount[0]} veces.`, timestamp });
            }
        } catch (error) {
            console.error("Error manejando mensaje:", error);
            socket.emit("error", { message: "Error al procesar el mensaje" });
        }
    });

    // Editar y Borrar
    socket.on("editmsg", async (data) => {
        try {
            const fileData = await fs.readFile(MSG_PATH, "utf-8");
            let messages = JSON.parse(fileData);
            const msgIndex = messages.findIndex((m) => m.timestamp === data.id);

            if (msgIndex !== -1 && messages[msgIndex].user === user.name) {
                messages[msgIndex].message = data.message;
                messages[msgIndex].edited = true;
                await fs.writeFile(MSG_PATH, JSON.stringify(messages, null, 2));
                io.emit("messageUpdated", { timestamp: data.id, message: data.message, edited: true });
            }
        } catch (err) { console.error("Error al editar:", err); }
    });

    socket.on("deletemsg", async (data) => {
        try {
            const fileData = await fs.readFile(MSG_PATH, "utf-8");
            let messages = JSON.parse(fileData);
            const msgIndex = messages.findIndex((m) => m.timestamp === data.id);

            if (msgIndex !== -1 && messages[msgIndex].user === user.name) {
                messages.splice(msgIndex, 1);
                await fs.writeFile(MSG_PATH, JSON.stringify(messages, null, 2));
                io.emit("messageDeleted", { timestamp: data.id });
            }
        } catch (err) { console.error("Error al borrar:", err); }
    });

    // Reacciones
    socket.on("addReaction", async (data) => {
        try {
            const fileData = await fs.readFile(MSG_PATH, "utf-8");
            let messages = JSON.parse(fileData);
            const msgIndex = messages.findIndex((m) => m.timestamp === data.messageId);

            if (msgIndex !== -1) {
                const message = messages[msgIndex];
                if (!message.emojis) message.emojis = [];
                
                let emojiEntry = message.emojis.find(e => e.name === data.emojiName);
                if (!emojiEntry) {
                    emojiEntry = { name: data.emojiName, users: [] };
                    message.emojis.push(emojiEntry);
                }

                if (!emojiEntry.users.includes(user.name)) {
                    emojiEntry.users.push(user.name);
                }

                await fs.writeFile(MSG_PATH, JSON.stringify(messages, null, 2));
                io.emit("newReaction", { messageId: data.messageId, emojiName: data.emojiName, emojiUrl: data.emojiUrl, userName: user.name });
            }
        } catch (err) { console.error("Error al reaccionar:", err); }
    });

    // Comandos de Bot y Emojis
    socket.on("sendcmd", (cmdData) => {
        botHandler.handleCommand({ cmd: cmdData, socket, io, username: user.name });
    });

    socket.on("emojisNames", () => {
        const imgDir = path.join(__dirname, "../../resources/emojis");
        const files = fsSync.readdirSync(imgDir);
        socket.emit("emojisNames", Array.from(files).map(f => path.parse(f).name));
    });
}