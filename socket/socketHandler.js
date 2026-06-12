import { connectedUsers } from "./state.js";

import registerUserEvents from "./events/userEvents.js";
import registerChatEvents from "./events/chatEvents.js";
import registerPrivateEvents from "./events/privateEvents.js";
import registerPollEvents from "./events/pollEvents.js";

import { JsonDatabaseClient } from "../backend/database/JsonDatabaseClient.js";
import { MessageRepository } from "../backend/repositories/MessageRepository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbClient = new JsonDatabaseClient(path.join(__dirname, "../public/json/messages.json"));
const messageRepo = new MessageRepository(dbClient);


export default function setupSockets(io, sessionMiddleware) {
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

        registerUserEvents(io, socket, user);
        registerChatEvents(io, socket, user, messageRepo);
        registerPrivateEvents(io, socket, user);
        registerPollEvents(io, socket, user);
    });       
}