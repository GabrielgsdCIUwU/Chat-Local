import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import botHandler from "../../bot/index.js";
import { VALIDATION_CONFIG } from "../../backend/core/constants.js";
import { RPG_CONFIG } from "../../backend/core/rpgConfig.js";

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

    // Inventario
    socket.on("requestInventory", async () => {
        try {
            const { profile, inventory } = await container.rpgService.getFullProfile(user.name);
            const petProfile = await container.petRepository.getProfile(user.name);
            const wallet = await container.economyService.getBalance(user.name);
            
            let jobInfo = null;
            if (profile?.job) {
                const jobConfig = RPG_CONFIG.JOBS[profile.job];
                const toolName = jobConfig.tools[profile.toolLevel]?.name || "Desconocido";
                jobInfo = {
                    name: jobConfig.name,
                    emoji: jobConfig.emoji,
                    toolLevel: profile.toolLevel,
                    toolName: toolName,
                    prestige: profile.prestigeLevel || 0
                };
            }

            const mappedPets = petProfile.pets.map(p => {
                const config = RPG_CONFIG.PETS[p.type];
                return {
                    id: p.id,
                    name: config.name,
                    emoji: config.emoji,
                    rarity: config.rarity,
                    equipped: petProfile.equipped === p.id
                };
            });

            socket.emit("inventoryData", {
                wallet,
                job: jobInfo,
                items: inventory.items || {},
                pets: mappedPets,
                eggs: petProfile.eggs
            });

        } catch (error) {
            socket.emit("error", { message: "Error al cargar el inventario: " + error.message });
        }
    });

    // Enviar mensaje
    socket.on("sendmsg", async (msg, reply) => {
         if (!msg || typeof msg !== 'string' || msg.length > VALIDATION_CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
            return socket.emit("error", { message: `El mensaje excede el límite de ${VALIDATION_CONFIG.CHAT.MAX_MESSAGE_LENGTH} caracteres.` });
        }

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
        if (!data.message || typeof data.message !== 'string' || data.message.length > VALIDATION_CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
            return socket.emit("error", { message: "El mensaje editado es demasiado largo." });
        }
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
            io.emit("newReaction", { messageId: data.messageId, emojiName: data.emojiName, userName: user.name });
        } catch (err) { console.error("Error al reaccionar:", err); }
    });

    // Comandos de Bot y Emojis
    socket.on("sendcmd", (cmdData) => {
        if (cmdData.raw && cmdData.raw.length > VALIDATION_CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
            return socket.emit("error", { message: "El comando es demasiado largo." });
        }
        botHandler.handleCommand({ cmd: cmdData, socket, io, username: user.name, container });
    });

    socket.on("emojisNames", () => {
        const imgDir = path.join(__dirname, "../../resources/emojis");
        const files = fsSync.readdirSync(imgDir);
        socket.emit("emojisNames", Array.from(files).map(f => path.parse(f).name));
    });
}