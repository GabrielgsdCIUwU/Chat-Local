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

    // Pedir datos del Mercado
    socket.on("requestMarket", async () => {
        try {
            const auctions = await container.marketService.getActiveAuctions();
            socket.emit("marketData", auctions);
        } catch (error) {
            socket.emit("error", { message: "Error al cargar el mercado." });
        }
    });

    // Comprar una subasta
    socket.on("buyAuction", async (auctionId) => {
        try {
            const boughtAuction = await container.marketService.buyAuction(user.name, auctionId);
            
            socket.emit("toast", { 
                type: 'success', 
                message: `Has comprado ${boughtAuction.amount}x ${boughtAuction.itemName} por ${boughtAuction.price}€` 
            });

            io.emit("toast", {
                target: boughtAuction.seller,
                type: 'success',
                message: `💰 ¡VENDIDO! ${user.name} ha comprado tus ${boughtAuction.amount}x ${boughtAuction.itemName} por ${boughtAuction.price}€`
            });

            io.emit("refreshMarket");

        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on("requestMyItems", async () => {
        try {
            const inventory = await container.inventoryRepository.getInventory(user.name);
            socket.emit("myItemsData", inventory.items || {});
        } catch (error) {
            socket.emit("error", { message: "Error al cargar tu mochila." });
        }
    });

    socket.on("publishAuction", async (data) => {
        try {
            const amount = Number.parseInt(data.amount);
            const price = Number.parseInt(data.price);
            
            await container.marketService.publishAuction(user.name, data.itemName, amount, price);
            
            socket.emit("toast", { type: 'success', message: `Subasta publicada correctamente.` });
            io.emit("refreshMarket");
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on("requestActivityData", async () => {
        try {
            const now = Date.now();
            const wallet = await container.economyService.getBalance(user.name);
            const inv = await container.inventoryRepository.getInventory(user.name);
            const profile = await container.jobRepository.getProfile(user.name);
            
            const allGamblers = await container.gamblingRepository.getAll();
            const gambler = allGamblers.find(u => u.name === user.name);

            const cooldowns = {};

            if (profile?.job) {
                const petBonus = await container.petService.getBonus(user.name, "WORK_COOLDOWN");
                let currentCooldownMs = RPG_CONFIG.WORK_COOLDOWN_MS;
                if (profile.activeBuffs?.["haste"] && now < profile.activeBuffs["haste"]) {
                    currentCooldownMs = Math.floor(currentCooldownMs / 2);
                }
                if (petBonus > 0) {
                    currentCooldownMs -= Math.floor(currentCooldownMs * (petBonus / 100));
                }
                const timePassed = now - (profile.lastWork || 0);
                if (timePassed < currentCooldownMs) {
                    cooldowns["rpg work"] = currentCooldownMs - timePassed;
                }
            }

            if (gambler?.lastDaily) {
                const timePassed = now - gambler.lastDaily;
                const twelveH = 12 * 60 * 60 * 1000;
                if (timePassed < twelveH) {
                    cooldowns["gambling daily"] = twelveH - timePassed;
                }
            }

            if (gambler?.lastRobbery) {
                const timePassed = now - gambler.lastRobbery;
                if (timePassed < GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS) {
                    cooldowns["gambling robar"] = GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS - timePassed;
                }
            }

            socket.emit("activityData", {
                wallet: wallet.money,
                inventory: inv.items || {},
                cooldowns
            });
        } catch (error) {
            console.error("Error cargando Activity Data:", error);
        }
    });

    // Enviar mensaje
    socket.on("sendmsg", async (msg, reply) => {
         if (!msg || typeof msg !== 'string') {
             return socket.emit("error", { message: "Mensaje inválido." });
         }

         const sanitizedMsg = msg.trim();
         if (sanitizedMsg.length === 0) {
             return socket.emit("error", { message: "No puedes enviar un mensaje vacío." });
         }

         if (sanitizedMsg.length > VALIDATION_CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
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
                message: sanitizedMsg, 
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