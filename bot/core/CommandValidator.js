/**
 * @typedef {import('./BotContext.js').BotContext} BotContext
 */

/**
 * @typedef {Object} CommandParam
 * @property {string} name - The name of the parameter.
 * @property {string} type - The expected type (string, number, user, inventory_item).
 * @property {boolean} required - Whether the parameter is mandatory.
 * @property {string} [description] - Description of the parameter.
 */

export class CommandValidator {
    /**
     * Parses and validates raw arguments based on the command parameter definitions.
     * 
     * @param {string[]} args - The raw arguments from the user input.
     * @param {CommandParam[]} paramsDef - The parameter definitions of the command.
     * @returns {Record<string, any>} A dictionary containing the parsed and typed arguments.
     * @throws {Error} If a required parameter is missing or has an invalid type.
     */
    static parse(args, paramsDef) {
        const parsed = {};
        const argsCopy = [...args];

        for (let i = 0; i < paramsDef.length; i++) {
            const def = paramsDef[i];
            
            if (def.type === "string" || def.type === "user" || def.type === "inventory_item") {
                if (i === paramsDef.length - 1 && argsCopy.length > 0) {
                    parsed[def.name] = argsCopy.join(" ");
                    argsCopy.length = 0; 
                } else {
                    parsed[def.name] = argsCopy.shift();
                }
            } else if (def.type === "number") {
                const val = argsCopy.shift();
                const parsedNum = Number.parseInt(val, 10);
                if (def.required && (Number.isNaN(parsedNum) || parsedNum <= 0)) {
                    throw new Error(`Invalid number provided for parameter: ${def.name}`);
                }
                parsed[def.name] = parsedNum;
            }

            if (def.required && !parsed[def.name]) {
                throw new Error(`Missing required parameter: ${def.name}`);
            }
        }

        return parsed;
    }
}