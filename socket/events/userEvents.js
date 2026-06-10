import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { connectedUsers, typingUsers } from "../state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function registerUserEvents(io, socket, user) {
    
    // Identificación
    socket.on("whoami", () => socket.emit("iam", user.name));
    
    // Obtener Donadores
    socket.on("whoDonate", async () => {
        try {
            const data = await fs.readFile(path.join(__dirname, "../../backend/json/users.json"), "utf8");
            const users = JSON.parse(data);
            const donators = users
                .filter(u => u.role === "Donador" || u.role === "Admin")
                .map(u => ({ name: u.name, color: u.color, img: u.img ?? false }));
            socket.emit("donators", donators);
        } catch (error) {
            console.error("Error cargando donadores:", error);
        }
    });

    // Estado "escribiendo..."
    socket.on("typing", (isTyping) => {
        isTyping ? typingUsers.add(user.name) : typingUsers.delete(user.name);
        io.emit("usersTyping", Array.from(typingUsers));
    });

    // Desconexión
    socket.on("disconnect", () => {
        connectedUsers.delete(user.name);
        typingUsers.delete(user.name);
        
        io.emit("usersTyping", Array.from(typingUsers));
        io.emit("userNames", Array.from(connectedUsers));
    });
}