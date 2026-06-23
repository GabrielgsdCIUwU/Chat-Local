export const connectedUsers = new Set();
export const typingUsers = new Set();
export const voteduser = new Set();

export function getUserNames() {
    return Promise.resolve(Array.from(connectedUsers));
}