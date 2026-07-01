/**
 * Interface representing a core Domain Event.
 * 
 * @interface
 * @abstract
 */
export class IDomainEvent {
    constructor() {
        if (new.target === IDomainEvent) {
            throw new TypeError("Cannot construct Abstract IDomainEvent instances directly.");
        }
        /**
         * Timestamp representing when the event took place.
         * @type {number}
         * @readonly
         */
        this.occurredOn = Date.now();
    }
}

/**
 * Centralized in-memory dispatcher to propagate domain events.
 * Decouples domain logic from infrastructural delivery channels (like Socket.io).
 */
export class DomainEventPublisher {
    /**
     * Set of registered event handlers mapped by event class name.
     * @type {Map<string, Set<function(IDomainEvent): (void|Promise<void>)>>}
     * @private
     */
    static _handlers = new Map();

    /**
     * Subscribes a handler to a specific domain event class.
     * @param {string} eventClassName - The class name of the event.
     * @param {function(any): (void|Promise<void>)} callback - Action to execute.
     * @returns {void}
     */
    static subscribe(eventClassName, callback) {
        if (!this._handlers.has(eventClassName)) {
            this._handlers.set(eventClassName, new Set());
        }
        this._handlers.get(eventClassName)?.add(callback);
    }

    /**
     * Dispatches a domain event to all subscribed listeners.
     * @param {IDomainEvent} event - The triggered Domain Event.
     * @returns {void}
     */
    static publish(event) {
        const key = event.constructor.name;
        const targetHandlers = this._handlers.get(key);
        
        if (!targetHandlers) return;

        for (const handler of targetHandlers) {
            try {
                handler(event);
            } catch (error) {
                console.error(`[DomainEventPublisher] Handler failed for event '${key}':`, error);
            }
        }
    }
}