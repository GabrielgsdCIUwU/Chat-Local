export const ROLES = Object.freeze({
    DONADOR: "Donador",
    ADMIN: "Admin",
});

export const GAME_CONFIG = Object.freeze({
    GUILD_CREATION_COST: 50000,
    DAILY_BASE_REWARD: 250,
    AUCTION_EXPIRATION_MS: 24 * 60 * 60 * 1000,
    BANKRUPT_BASE_MONEY: 100,
    PROPOSE_TRAIDING_EXPIRATION: 5 * 60 * 1000,
    INVITE_EXPIRATION: 5 * 60 * 1000,
    GUILD_LEVEL_COSTS: {
        2: 100000,
        3: 250000,
        4: 500000,
        5: 1000000,
        6: 2500000
    }
});