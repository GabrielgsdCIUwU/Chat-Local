export const params = [
    {name: "pregunta", type: "string", required: true}
];

/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {

    const pregunta = context.args[0];

    if(!pregunta) {
        context.reply("Debes hacerme una pregunta.")
        return;
    }
    
    const respuestas = [
        "Pregúntame otra cosa, ¿sí?",
        "No",
        "Puede ser",
        "No lo sé, tú dime",
        "¡NI DE COÑA!",
        "Sí",
        "Me encantaría saberlo la verdad",
        `Qué buena pregunta ${context.username}`,
        "Emm... ok? O-O",
        "Pues estaría nice",
        "Yo opino que XD",
        "Mejor piénsalo tú ¬¬",
        "A nadie le importa tu pregunta, mejor pregunta otra cosa, ¿oki?",
        "No cuentes con ello",
        "No es probable",
        "Puedes confiar en ello",
        "No te hagas ilusiones",
        "Todo es posible",
        "La suerte está de tu lado"
    ];

    const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

    context.reply(`**Pregunta:**\n${pregunta}\n\n**Respuesta:**\n${respuesta}`)
}