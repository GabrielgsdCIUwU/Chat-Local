import { ROLES } from "../../backend/core/constants.js";
import { EmbedMessage } from "../utility/EmbedMessage.js";

export const description = "Muestra la lista de comandos disponibles o detalles de un comando específico.";

export const params = [
    {
        name: "comando",
        type: "string",
        required: false,
        description: "Nombre del comando a consultar (ej: gambling robar)"
    }
];

/**
 * Executes the dynamic help system.
 * @param {import('../core/BotContext.js').BotContext} context
 */
export async function execute(context) {
    const tree = await context.container.commandService.getCommandTree();
    const embed = new EmbedMessage();

    const user = await context.container.userRepository.findByName(context.username);
    const isAdmin = user?.roles.includes(ROLES.ADMIN) || false;

    const query = context.args.join(" ").toLowerCase().trim();

    if (!query) {
        buildCommandList(embed, tree, isAdmin);
        return context.reply(embed.toString());
    }

    const result = findCommandNode(tree, query);

    if (!result) {
        return context.reply(
            `❌ No se encontró el comando: \`/${query}\``
        );
    }

    if (result.node.adminOnly && !isAdmin) {
        return context.reply(`❌ No tienes permisos para ver información sobre este comando.`);
    }

    buildCommandDetails(embed, result.node, result.path, isAdmin);

    return context.reply(embed.toString());
}

/**
 * @param {object} node
 */
function isCommandGroup(node) {
    return Object.keys(node).some(
        key => key !== "params" && key !== "description" && key !== "adminOnly"
    );
}

/**
 * @param {EmbedMessage} embed
 * @param {object} tree
 * @param {boolean} isAdmin 
 */
function buildCommandList(embed, tree, isAdmin) {
    embed.addField(
        "📜 Lista de Comandos",
        "Usa `/help [comando]` para más detalles."
    );

    for (const [cmdName, cmdData] of Object.entries(tree)) {
        if (cmdName === "types") continue;

        if (cmdData.adminOnly && !isAdmin) continue;

        const desc =
            cmdData.description ||
            (isCommandGroup(cmdData)
                ? "Módulo de comandos agrupados."
                : "Sin descripción.");

        embed.addField(`🔹 /${cmdName}`, desc);
    }
}

/**
 * Busca un nodo dentro del árbol de comandos.
 * @param {object} tree
 * @param {string} query
 */
function findCommandNode(tree, query) {
    const parts = query.split(" ");

    let currentNode = tree;
    const path = [];

    for (const part of parts) {
        if (!currentNode[part]) {
            return null;
        }

        currentNode = currentNode[part];
        path.push(part);
    }

    return {
        node: currentNode,
        path: path.join(" ")
    };
}

/**
 * @param {EmbedMessage} embed
 * @param {object} node
 * @param {boolean} isAdmin 
 */
function addSubcommandsSection(embed, node, isAdmin) {
    const subcommands = Object.keys(node).filter(
        key => key !== "params" && key !== "description" && key !== "adminOnly"
    );

    if (!subcommands.length) return;

    const allowedSubcommands = subcommands.filter(
        sub => !(node[sub].adminOnly && !isAdmin)
    );

    const content = allowedSubcommands
        .map(
            sub =>
                `• **${sub}**: ${node[sub].description || "Sin descripción."
                }`
        )
        .join("\n");

    embed.addField("📂 Subcomandos", content);
}

/**
 * @param {EmbedMessage} embed
 * @param {Array} params
 */
function addParametersSection(embed, params) {
    if (!params?.length) return;

    const content = params
        .map(param => {
            const requirement = param.required
                ? "🔴 [Requerido]"
                : "🔵 [Opcional]";

            return `• \`${param.name}\` (${param.type}) ${requirement}: ${param.description || "Sin descripción específica."
                }`;
        })
        .join("\n");

    embed.addField("⚙️ Parámetros", content);
}

/**
 * @param {EmbedMessage} embed
 * @param {object} node
 * @param {string} path
 * @param {boolean} isAdmin 
 */
function buildCommandDetails(embed, node, path, isAdmin) {
    embed.addField(
        `📖 Ayuda: /${path}`,
        node.description || "Sin descripción detallada."
    );

    addSubcommandsSection(embed, node, isAdmin);
    addParametersSection(embed, node.params);
}