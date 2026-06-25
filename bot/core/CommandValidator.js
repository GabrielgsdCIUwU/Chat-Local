/**
 * @typedef {import('./BotContext.js').BotContext} BotContext
 */

/**
 * @typedef {Object} CommandParam
 * @property {string} name - The name of the parameter.
 * @property {string} type - The expected type (string, number, user, inventory_item).
 * @property {boolean} required - Whether the parameter is mandatory.
 * @property {string} [description] - Description of the parameter.
 * @property {string[]} [values] - Allowed specific values.
 */

export class CommandValidator {
    /**
     * Registry of parsing strategies based on parameter type.
     * @type {Record<string, function(string[], boolean, string): any>}
     */
    static #parsers = {
        string: this.#parseString,
        user: this.#parseString,
        inventory_item: this.#parseString,
        number: this.#parseNumber
    };

    /**
     * Parses and validates raw arguments based on the command parameter definitions.
     * 
     * @param {string[]} args - The raw arguments from the user input.
     * @param {CommandParam[]} paramsDef - The parameter definitions of the command.
     * @returns {Record<string, any>} A dictionary containing the parsed and typed arguments.
     * @throws {Error} If a required parameter is missing, invalid, or out of range.
     */
    static parse(args, paramsDef) {
        const parsedArgs = {};
        const availableArgs = [...args];

        for (let i = 0; i < paramsDef.length; i++) {
            const paramDefinition = paramsDef[i];
            const isLastParameter = i === paramsDef.length - 1;

            const extractedValue = this.#extractValue(availableArgs, paramDefinition, isLastParameter);
            
            this.#validateConstraints(extractedValue, paramDefinition);

            parsedArgs[paramDefinition.name] = extractedValue;
        }

        return parsedArgs;
    }

    /**
     * Routes the value extraction to the appropriate parser strategy.
     * 
     * @private
     * @param {string[]} args - The remaining raw arguments.
     * @param {CommandParam} paramDef - The parameter definition.
     * @param {boolean} isLast - Whether this is the last parameter in the definition.
     * @returns {any} The parsed value or undefined.
     */
    static #extractValue(args, paramDef, isLast) {
        if (args.length === 0) return undefined;

        const parseStrategy = this.#parsers[paramDef.type];
        if (!parseStrategy) {
            throw new Error(`Tipo de parámetro desconocido: ${paramDef.type}`);
        }

        return parseStrategy(args, isLast, paramDef.name);
    }

    /**
     * Strategy for parsing string-based types. 
     * Consumes the rest of the array if it's the last param.
     * 
     * @private
     * @param {string[]} args - The remaining raw arguments.
     * @param {boolean} isLast - Whether this is the last parameter.
     * @returns {string}
     */
    static #parseString(args, isLast) {
        if (isLast) {
            return args.splice(0, args.length).join(" ");
        }
        return args.shift();
    }

    /**
     * Strategy for parsing numbers.
     * 
     * @private
     * @param {string[]} args - The remaining raw arguments.
     * @param {boolean} _isLast - Ignored for numbers.
     * @param {string} paramName - Name of the parameter for error reporting.
     * @returns {number}
     */
    static #parseNumber(args, _isLast, paramName) {
        const rawValue = args.shift();
        const parsedNumber = Number.parseInt(rawValue, 10);

        if (Number.isNaN(parsedNumber) || parsedNumber <= 0) {
            throw new Error(`Número inválido para el parámetro: ${paramName}`);
        }

        return parsedNumber;
    }

    /**
     * Validates business rules like mandatory presence and specific allowed values.
     * 
     * @private
     * @param {any} value - The parsed value.
     * @param {CommandParam} paramDef - The parameter definition.
     */
    static #validateConstraints(value, paramDef) {
        if (paramDef.required && value === undefined) {
            throw new Error(`Falta un parámetro obligatorio: ${paramDef.name}`);
        }

        if (value !== undefined && paramDef.values && !paramDef.values.includes(value)) {
            throw new Error(`El valor para ${paramDef.name} debe ser uno de: ${paramDef.values.join(", ")}`);
        }
    }
}