import { ROLES } from "../../backend/core/constants.js";
import { CommandValidator } from "./CommandValidator.js";

/**
 * @typedef {import('./BotContext.js').BotContext} BotContext
 * @typedef {import('./CommandValidator.js').CommandParam} CommandParam
 */

/**
 * Abstract Base Class for all bot commands.
 * @abstract
 */
export class BaseCommand {
    /**
     * @param {Object} options - Command configuration options.
     * @param {string} options.name - The unique name of the command.
     * @param {string} options.description - Command description.
     * @param {CommandParam[]} [options.params] - Expected parameters.
     * @param {boolean} [options.adminOnly] - Requires administrator privileges.
     */
    constructor(options) {
        this.name = options.name;
        this.description = options.description;
        this.params = options.params || [];
        this.adminOnly = options.adminOnly || false;
    }

    /**
     * Main execution entry point. Handles validation, permissions, and error handling.
     * Do NOT override this method in child classes.
     * 
     * @param {BotContext} context - The command execution context.
     * @returns {Promise<void>}
     */
    async execute(context) {
        let parsedArgs;

        try {
            if (this.adminOnly) await this.#validateAdmin(context);
            parsedArgs = CommandValidator.parse(context.args, this.params);
        } catch (validationError) {
            return context.reply(`❌ **Error de validación:** ${validationError.message}`);
        }

        try {
            await this.run(context, parsedArgs);
        } catch (executionError) {
            await this.#safeRollback(context, parsedArgs, executionError);
            return context.reply(`❌ **Error:** ${executionError.message}`);
        }
    }

    /**
     * Core business logic of the command. 
     * Must be implemented by child classes.
     * 
     * @abstract
     * @param {BotContext} context - The command execution context.
     * @param {Record<string, any>} args - The strongly typed and parsed arguments.
     * @returns {Promise<void>}
     */
    async run(context, args) {
        throw new Error("Method 'run()' must be implemented in the child class.");
    }

    /**
     * Revert all the database changes. Child classes could implement it.
     * @param {BotContext} context - The command execution context.
     * @param {Record<string, any>} args - The strongly typed and parsed arguments.
     * @param {Error} error
     * @abstract 
     */
    async rollback(context, args, error) {
      // Implemented by Child classes if need it.
    }

    /**
     * 
     * @param {BotContext} context - The command execution context.
     * @param {Record<string, any>} args - The strongly typed and parsed arguments.
     * @param {Error} error
     */
    async #safeRollback(context, args, error) {
        try {
            await this.rollback(context, args, error);
        } catch (rollbackError) {
            console.error(`[Rollback Error] Comando '${this.name}' falló al revertir el estado:`, rollbackError);
        }
    }

    /**
     * Validates if the current user has administrator privileges.
     * 
     * @private
     * @param {BotContext} context - The command execution context.
     * @throws {Error} If the user lacks permissions.
     */
    async #validateAdmin(context) {
        const user = await context.container.userRepository.findByName(context.username);
        if (!user?.roles.includes(ROLES.ADMIN)) {
            throw new Error("You do not have administrator permissions to execute this command.");
        }
    }
}