export default function registerPrivateEvents(io, socket, user) {
    socket.on("startPrivateChat", (recipientName) => {
        const recipientSocket = Array.from(io.sockets.sockets).find(([id, s]) => s.request.session.user.name === recipientName);
        
        if (recipientSocket) {
            const privateRoom = `${user.name}-${recipientName}`;
            socket.join(privateRoom);
            recipientSocket[1].join(privateRoom);
            
            socket.emit("privateChatStarted", { room: privateRoom, recipient: recipientName });
            recipientSocket[1].emit("privateChatStarted", { room: privateRoom, recipient: user.name });
        } else {
            socket.emit("error", { message: "El usuario no está disponible." });
        }
    });

    socket.on("privateMessage", ({ room, message }) => {
        io.to(room).emit("privateMessage", { 
            name: user.name, 
            message, 
            timestamp: Date.now() 
        });
    });
}