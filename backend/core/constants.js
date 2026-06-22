export const ROLES = Object.freeze({
    DONADOR: "Donador",
    ADMIN: "Admin",
});

export const BOT_CONFIG = Object.freeze({
    TOP_LIMIT_DEFAULT: 10,
    MARKET_TOP_LIMIT: 15,
    MAX_RATE_VALUE: 10,
});

export const GAME_CONFIG = Object.freeze({
    GUILD_CREATION_COST: 50000,
    DAILY_BASE_REWARD: 250,
    AUCTION_EXPIRATION_MS: 24 * 60 * 60 * 1000,
    PROPOSE_TRAIDING_EXPIRATION: 5 * 60 * 1000,
    INVITE_EXPIRATION: 5 * 60 * 1000,
    ECONOMY: {
        DEBT_REPAY_PERCENTAGE: 0.2,
        BANKRUPT_BASE_MONEY: 100,
        BANKRUPT_PENALTY_MULT: 10,
    },
    GUILD_LEVEL_COSTS: {
        2: 100000,
        3: 250000,
        4: 500000,
        5: 1000000,
        6: 2500000
    },
    GAMBLING: {
        LOTTERY_MULTIPLIER: 5,
        LOTTERY_CHANCE: 6,
        DUEL_WIN_CHANCE: 0.5,
        DAILY: {
            BASE_REWARD: 250,
            COOLDOWN_MS: 12 * 60 * 60 * 1000,
            EXPIRATION_MS: 24 * 60 * 60 * 1000,
            BONUS_MIN: 25,
            BONUS_MAX: 100
        }
    },
    ROB_CONFIG: {
        MAX_CHANCE: 0.95,
        CHANCE_SCALING: 0.9,
        PENALTY_DIVISOR: 4,
        THRESHOLDS: {
            STEALTH: 0.05,
            CLUMSY: 0.1,
            GREEDY: 0.7,
            HEIST: 0.8
        }
    }
});