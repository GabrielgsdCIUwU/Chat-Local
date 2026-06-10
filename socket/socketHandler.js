import { connectedUsers } from "./state.js";

import registerUserEvents from "./events/userEvents.js";
import registerChatEvents from "./events/chatEvents.js";
import registerPrivateEvents from "./events/privateEvents.js";
import registerPollEvents from "./events/pollEvents.js";


export default function setupSockets(io, sessionMiddleware) {
    // Middleware de sesión para Sockets
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, (err) => {
            if (err) return next(err);
            if (socket.request.session && socket.request.session.user) {
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
        registerChatEvents(io, socket, user);
        registerPrivateEvents(io, socket, user);
        registerPollEvents(io, socket, user);
    });       
}