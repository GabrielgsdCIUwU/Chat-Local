export function execute({ args, socket, io, username, msg }) {
    let response;
    const timestamp = new Date().getTime();

    let max = 20;
    let min = 2
    let nº = Math.round(Math.random() * (max - min) + min);
    
    switch (nº) {
        case 1:
            response = "Preguntame otra cosa, sí?";
            break;
        case 2:
            response = "No";
            break;
        case 3:
            response = "Puede ser";
            break;
        case 4:
            response = "No lo sé, tú dime";
            break;
        case 5:
            response = "NI DE COÑA!";
            break;
        case 6:
            response = "Ci";
            break;
        case 7:
            response = "Me encantaría saberlo la verdad";
            break;
        case 8:
            response = `Que buena pregunta ${username}`;
            break;
        case 9:
            response = "Emm... ok? O-O";
            break;
        case 10:
            response = "Pues estaría nice";
            break;
        case 11:
            response = "Yo opino que XD";
            break;
        case 12:
            response = "Mejor piénsalo tú ¬¬";
            break;
        case 13:
            response = "A nadie le importa tu pregunta, mejor pregunta otra cosa, ¿oki?";
            break;
        case 14:
            response = "No cuentes con ello";
            break;
        case 15:
            response = "No es probable";
            break;
        case 16:
            response = "Puedes confiar en ello";
            break;
        case 17:
            response = "No te hagas ilusiones";
            break;
        case 18:
            response = "Todo es posible";
            break;
        case 19:
            response = "La suerte está de tu lado";
            break;
    }

    response = `**Pregunta:**\n${msg.replace("/bot 8ball", "").trim()}\n\n**Respuesta:**\n${response}`;

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}