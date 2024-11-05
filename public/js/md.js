const io = require('socket.io')(server);
const messageHistory = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('sendmsg', (data) => {
        const { message, to } = data;
        const msg = {
            from: socket.id,
            message: message,
            timestamp: Date.now(),
            to: to
        };
        messageHistory.push(msg);
        socket.to(to).emit("sendmsg", msg);
    });

    socket.on('requestHistory', (to) => {
        const privateMessages = messageHistory.filter(msg => 
            (msg.from === socket.id && msg.to === to) || (msg.to === socket.id && msg.from === to)
        );
        socket.emit('messageHistory', privateMessages);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

function getUserNames() {
    return ['User1', 'User2', 'User3'];
}

