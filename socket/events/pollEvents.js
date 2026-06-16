import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { voteduser } from "../state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLL_PATH = path.join(__dirname, "../../public/json/encuesta.json");

export default function registerPollEvents(io, socket, user) {
    socket.on('votar', async (data) => {
        try {
            if (voteduser.has(user.name)) return;
            voteduser.add(user.name);

            const fileData = await fs.readFile(POLL_PATH, 'utf8');
            const encuestaData = JSON.parse(fileData);
            
            encuestaData.opciones[data.opcion].votos++;
            
            await fs.writeFile(POLL_PATH, JSON.stringify(encuestaData, null, 2), 'utf8');
            io.emit('actualizarVotos', encuestaData.opciones);
            
        } catch (error) {
            socket.emit('error', 'Hubo un error al procesar tu voto.');
        }
    });
}