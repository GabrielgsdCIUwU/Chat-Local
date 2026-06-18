import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import botHandler from "../../bot/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {*} io 
 * @param {*} socket 
 * @param {*} user 
 * @param {import('../../backend/core/DIContainer.js').container} container 
 */
export default function registerChatEvents(io, socket, user, container) {
    
    // Historial
    socket.on("requestHistory", async () => {
        try {
            const data = await container.messageRepository.getAll();
            socket.emit("messageHistory", data);
        } catch (error) {
            socket.emit("error", { message: "Error al leer los mensajes" });
        }
    });

    // Enviar mensaje
    socket.on("sendmsg", async (msg, reply) => {
        const timestamp = Date.now();
        const id = crypto.randomUUID();
        try {
            const profile = await container.jobRepository.getProfile(user.name);
            const prestigeLevel = profile?.prestigeLevel ? profile.prestigeLevel : 0;
            const newMessage = { 
                id,
                user: user.name, 
                message: msg, 
                timestamp, 
                prestige: prestigeLevel,
                ...(reply && { reply: { replyUser: reply.user, replyMessage: reply.message } })
            };
            
            await container.messageRepository.saveMessage(newMessage);
            io.emit("sendmsg", newMessage);
            
            await container.chatFilterService.processMessage(msg, user.name, io, timestamp);
        } catch (error) {
            console.error("Error manejando mensaje:", error);
            socket.emit("error", { message: "Error al procesar el mensaje" });
        }
    });

    // Editar y Borrar
    socket.on("editmsg", async (data) => {
        try {
            await container.messageRepository.editMessage(data.id, user.name, data.message);
            io.emit("messageUpdated", {id: data.id, message: data.message, edited: true});
        } catch (err) { console.error("Error al editar:", err); }
    });

    socket.on("deletemsg", async (data) => {
        try {
            await container.messageRepository.deleteMessage(data.id, user.name);
            io.emit("messageDeleted", {id: data.id});
        } catch (err) { console.error("Error al borrar:", err); }
    });

    // Reacciones
    socket.on("addReaction", async (data) => {
        try {
            await container.messageRepository.addReaction(data.messageId, data.emojiName, user.name);
            io.emit("newReaction", { messageId: data.messageId, emojiName: data.emojiName, emojiUrl: data.emojiUrl, userName: user.name });
        } catch (err) { console.error("Error al reaccionar:", err); }
    });

    // Comandos de Bot y Emojis
    socket.on("sendcmd", (cmdData) => {
        botHandler.handleCommand({ cmd: cmdData, socket, io, username: user.name, container });
    });

    socket.on("emojisNames", () => {
        const imgDir = path.join(__dirname, "../../resources/emojis");
        const files = fsSync.readdirSync(imgDir);
        socket.emit("emojisNames", Array.from(files).map(f => path.parse(f).name));
    });
}