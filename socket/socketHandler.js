import { connectedUsers } from "./state.js";

import registerUserEvents from "./events/userEvents.js";
import registerChatEvents from "./events/chatEvents.js";
import registerPrivateEvents from "./events/privateEvents.js";
import registerPollEvents from "./events/pollEvents.js";

import { container } from "../backend/core/DIContainer.js";
import registerActivityEvents from "./events/activityEvents.js";
import { DomainEventPublisher } from "../backend/core/domain/DomainEvents.js";
import { GAME_CONFIG } from "../backend/core/constants.js";

export default function setupSockets(io, sessionMiddleware) {
    DomainEventPublisher.subscribe("RaidDefeatedEvent", async (event) => {
        for (const [user, dmg] of Object.entries(event.damageLog)) {
            const reward = Math.floor(dmg * GAME_CONFIG.BOSS_CONFIG.REWARD_PER_DAMAGE);
            await container.economyService.addFunds(user, reward).catch(console.error);
        }

        io.emit("activity:raidEnded", {
            success: true,
            leaderboard: event.damageLog
        });
    });
    // Middleware de sesión para Sockets
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, (err) => {
            if (err) return next(err);
            if (socket.request.session?.user) {
                next();
            } else {
                next(new Error("Usuario no autenticado"));
            }
        });
    });

    io.on("connection", (socket) => {
        const user = socket.request.session.user;
        connectedUsers.add(user.name);

         io.emit("userNames", Array.from(connectedUsers));

        registerUserEvents(io, socket, user, container);
        registerChatEvents(io, socket, user, container);
        registerPrivateEvents(io, socket, user);
        registerPollEvents(io, socket, user);
        registerActivityEvents(io, socket, user, container)
    });       
}