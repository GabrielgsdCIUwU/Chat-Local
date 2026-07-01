import { BaseCommand } from "../core/BaseCommand.js";

/**
 * Magic 8ball command.
 * @extends BaseCommand
 */
class EightBallCommand extends BaseCommand {
    constructor() {
        super({
            name: "8ball",
            description: "Pregúntale a la bola mágica 8 sobre tu futuro.",
            params: [
                { name: "pregunta", type: "string", required: true, description: "La pregunta de sí o no que deseas hacer." }
            ]
        });
    }

    async run(context, args) {
        const respuestas = [
            "Pregúntame otra cosa, ¿sí?", "No", "Puede ser", "No lo sé, tú dime", 
            "¡NI DE COÑA!", "Sí", "Yo opino que XD", "No cuentes con ello", 
            "Puedes confiar en ello", "La suerte está de tu lado"
        ];

        const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
        context.reply(`**Pregunta:**\n${args.pregunta}\n\n**Respuesta:**\n${respuesta}`);
    }
}

export default new EightBallCommand();