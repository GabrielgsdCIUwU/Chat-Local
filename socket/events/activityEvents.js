/**
 * Registers WebSocket events for real-time multiplayer activities.
 * @param {import('socket.io').Server} io - Socket.io server instance.
 * @param {import('socket.io').Socket} socket - Socket.io client instance.
 * @param {Object} user - The current authenticated user session object.
 * @param {import('../../backend/core/DIContainer.js').container} container - DI Container.
 */
export default function registerActivityEvents(io, socket, user, container) {
    
    socket.on("activity:hitBoss", async () => {
        await container.raidService.hitBoss(user.name, io);
    });

    socket.on("activity:requestRaidSync", () => {
        const raidData = container.raidService.getSyncData();
        socket.emit("activity:syncResponse", raidData); 
    });
}