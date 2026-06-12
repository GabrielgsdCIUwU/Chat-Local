import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import botHandler from "../../bot/index.js";
import { JsonDatabaseClient } from "../../backend/database/JsonDatabaseClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const spamDb = new JsonDatabaseClient(path.join(__dirname, "../../public/json/spamer.json"));
/**
 * @param {*} io 
 * @param {*} socket 
 * @param {*} user 
 * @param {import('../../backend/repositories/MessageRepository.js').MessageRepository} messageRepo 
 */
export default function registerChatEvents(io, socket, user, messageRepo) {
    
    // Historial
    socket.on("requestHistory", async () => {
        try {
            const data = await messageRepo.getAll();
            socket.emit("messageHistory", data);
        } catch (error) {
            socket.emit("error", { message: "Error al leer los mensajes" });
        }
    });

    // Enviar mensaje
    socket.on("sendmsg", async (msg, reply) => {
        const timestamp = Date.now();
        try {
            const newMessage = { 
                user: user.name, 
                message: msg, 
                timestamp, 
                ...(reply && { reply: { replyUser: reply.user, replyMessage: reply.message } })
            };
            
            await messageRepo.saveMessage(newMessage);
            io.emit("sendmsg", newMessage);

            // Logica de Spam de Donaciones
            if (msg.includes("ko-fi.com/") || msg.includes("paypal.com/") || msg.includes("paypal.me/")) {
                await spamDb.update((spamCount) => {
                    if (!Array.isArray(spamCount) || spamCount.length === 0) spamCount = [0];
                    spamCount[0] += 1;
                    return spamCount;
                });
                const count = (await spamDb.read())[0];
                io.emit("sendmsg", { user: "🤖 Bot", message: `${user.name} ha contribuido a mi creador, el contador sube a ${count} veces.`, timestamp });
            }
        } catch (error) {
            console.error("Error manejando mensaje:", error);
            socket.emit("error", { message: "Error al procesar el mensaje" });
        }
    });

    // Editar y Borrar
    socket.on("editmsg", async (data) => {
        try {
            await messageRepo.editMessage(data.id, user.name, data.message);
            io.emit("messageUpdated", {timestamp: data.id, message: data.message, edited: true});
        } catch (err) { console.error("Error al editar:", err); }
    });

    socket.on("deletemsg", async (data) => {
        try {
            await messageRepo.deleteMessage(data.id, user.name);
            io.emit("messageDeleted", {timestamp: data.id});
        } catch (err) { console.error("Error al borrar:", err); }
    });

    // Reacciones
    socket.on("addReaction", async (data) => {
        try {
            await messageRepo.addReaction(data.messageId, data.emojiName, user.name);
            io.emit("newReaction", { messageId: data.messageId, emojiName: data.emojiName, emojiUrl: data.emojiUrl, userName: user.name });
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