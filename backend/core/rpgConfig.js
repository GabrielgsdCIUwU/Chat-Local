export const RPG_CONFIG = {
    WORK_COOLDOWN_MS: 5 * 60 * 1000,

    MARKET_PRICES: {
        "Piedra": 2, "Hierro": 10, "Oro": 50, "Diamante": 200,
        "Madera": 2, "Roble": 10, "Caoba": 50, "Árbol Místico": 200,
        "Pez": 2, "Salmón": 10, "Pez Espada": 50, "Megalodón": 200
    },
    JOBS: {
        minero: {
            name: "Minero",
            emoji: "⛏️",
            actionText: "ha picado en la mina",
            tools: {
                1: {
                    name: "Pico de Piedra",
                    upgradeCost: { money: 0, items: {} },
                    lootTable: [
                        { item: "Piedra", chance: 0.8, min: 2, max: 5 },
                        { item: "Hierro", chance: 0.2, min: 1, max: 2 }
                    ]
                },
                2: {
                    name: "Pico de Hierro",
                    upgradeCost: { money: 500, items: { "Piedra": 50 } },
                    lootTable: [
                        { item: "Piedra", chance: 0.6, min: 3, max: 8 },
                        { item: "Hierro", chance: 0.3, min: 2, max: 4 },
                        { item: "Oro", chance: 0.1, min: 1, max: 1 }
                    ]
                },
                3: {
                    name: "Pico de Oro",
                    upgradeCost: { money: 2000, items: { "Hierro": 100 } },
                    lootTable: [
                        { item: "Piedra", chance: 0.4, min: 5, max: 10 },
                        { item: "Hierro", chance: 0.4, min: 3, max: 6 },
                        { item: "Oro", chance: 0.18, min: 1, max: 3 },
                        { item: "Diamante", chance: 0.02, min: 1, max: 1 }
                    ]
                }
            }
        },
        leñador: {
            name: "Leñador",
            emoji: "🪓",
            actionText: "ha talado árboles",
            tools: {
                1: {
                    name: "Hacha de Piedra",
                    upgradeCost: { money: 0, items: {} },
                    lootTable: [
                        { item: "Madera", chance: 0.8, min: 2, max: 5 },
                        { item: "Roble", chance: 0.2, min: 1, max: 2 }
                    ]
                },
                2: {
                    name: "Hacha de Hierro",
                    upgradeCost: { money: 500, items: { "Madera": 50 } },
                    lootTable: [
                        { item: "Madera", chance: 0.6, min: 3, max: 8 },
                        { item: "Roble", chance: 0.3, min: 2, max: 4 },
                        { item: "Caoba", chance: 0.1, min: 1, max: 1 }
                    ]
                },
                3: {
                    name: "Hacha de Oro",
                    upgradeCost: { money: 2000, items: { "Roble": 100 } },
                    lootTable: [
                        { item: "Madera", chance: 0.4, min: 5, max: 10 },
                        { item: "Roble", chance: 0.4, min: 3, max: 6 },
                        { item: "Caoba", chance: 0.18, min: 1, max: 3 },
                        { item: "Árbol Místico", chance: 0.02, min: 1, max: 1 }
                    ]
                }
            }
        },
        pescador: {
            name: "Pescador",
            emoji: "🎣",
            actionText: "ha tirado la caña al mar",
            tools: {
                1: {
                    name: "Caña de Madera",
                    upgradeCost: { money: 0, items: {} },
                    lootTable: [
                        { item: "Pez", chance: 0.8, min: 2, max: 5 },
                        { item: "Salmón", chance: 0.2, min: 1, max: 2 }
                    ]
                },
                2: {
                    name: "Caña de Fibra",
                    upgradeCost: { money: 500, items: { "Pez": 50 } },
                    lootTable: [
                        { item: "Pez", chance: 0.6, min: 3, max: 8 },
                        { item: "Salmón", chance: 0.3, min: 2, max: 4 },
                        { item: "Pez Espada", chance: 0.1, min: 1, max: 1 }
                    ]
                },
                3: {
                    name: "Caña Profesional",
                    upgradeCost: { money: 2000, items: { "Salmón": 100 } },
                    lootTable: [
                        { item: "Pez", chance: 0.4, min: 5, max: 10 },
                        { item: "Salmón", chance: 0.4, min: 3, max: 6 },
                        { item: "Pez Espada", chance: 0.18, min: 1, max: 3 },
                        { item: "Megalodón", chance: 0.02, min: 1, max: 1 }
                    ]
                }
            }
        }
    },
    CRAFTING_RECIPES: {
        "haste_potion": {
            name: "Haste Potion",
            description: "Reduce /rpg work cooldown en un 50% por 1 hora.",
            cost: { "Piedra": 15, "Madera": 15 },
            buffId: "haste",
            durationMs: 60 * 60 * 1000
        },
        "thief_ward": {
            name: "Thief Ward",
            description: "Bloquea el siguiente intento de robar contra tí (dura 24 horas).",
            cost: { "Hierro": 10, "Pez": 15 },
            buffId: "anti_rob",
            durationMs: 24 * 60 * 60 * 1000
        }
    },
    EXPEDITIONS: {
        "bosque_oscuro": {
            name: "Bosque Oscuro",
            cost: 500,
            durationMs: 2 * 60 * 60 * 1000,
            lootTable: [
                { item: "Madera", min: 50, max: 100 },
                { item: "Roble", min: 20, max: 50 },
                { item: "Caoba", min: 5, max: 15 }
            ]
        },
        "mina_abandonada": {
            name: "Mina Abandonada",
            cost: 1000,
            durationMs: 4 * 60 * 60 * 1000,
            lootTable: [
                { item: "Hierro", min: 30, max: 80 },
                { item: "Oro", min: 10, max: 30 },
                { item: "Diamante", min: 1, max: 5 }
            ]
        }
    },
    EGG_PRICE: 2500,
    /** @type {Record<string, PetConfig>} */
    PETS: {
        "lobo_huargo": {
            name: "Lobo Huargo",
            emoji: "🐺",
            rarity: "COMMON",
            effectType: "WORK_COOLDOWN", 
            value: 10,
            description: "Un lobo leal. Reduce el tiempo de espera para trabajar un 10%."
        },
        "gato_ladron": {
            name: "Gato Ladrón",
            emoji: "🐈",
            rarity: "COMMON",
            effectType: "GAMBLING_BONUS",
            value: 5,
            description: "A este michi le gusta el dinero. +5% de ganancias en casino/robos."
        },
        "buho_sabio": {
            name: "Búho Sabio",
            emoji: "🦉",
            rarity: "EPIC",
            effectType: "WORK_COOLDOWN",
            value: 25, 
            description: "Conoce los secretos del tiempo. Reduce el tiempo de espera un 25%."
        },
        "zorro_dorado": {
            name: "Zorro Dorado",
            emoji: "🦊",
            rarity: "EPIC",
            effectType: "GAMBLING_BONUS",
            value: 15,
            description: "Atrae la fortuna. +15% de ganancias en casino/robos."
        },
        "dragon_celestial": {
            name: "Dragón Celestial",
            emoji: "🐉",
            rarity: "LEGENDARY",
            effectType: "ALL_BONUS",
            value: 40,
            description: "Una criatura mítica imparable. +40% de dinero y -40% tiempo de espera."
        }
    }
};

/**
 * @typedef {Object} LootDrop
 * @property {string} item
 * @property {number} chance
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {Object} ToolConfig
 * @property {string} name
 * @property {{money:number, items:Record<string, number>}} upgradeCost
 * @property {LootDrop[]} lootTable
 */

/**
 * @typedef {Object} JobConfig
 * @property {string} name
 * @property {string} emoji
 * @property {string} actionText
 * @property {Record<number, ToolConfig>} tools
 */

 /**
 * @typedef {keyof typeof RPG_CONFIG.MARKET_PRICES} MarketItem
 */

/**
 * @typedef {Object} CraftingRecipe
 * @property {string} name
 * @property {string} description
 * @property {Partial<Record<MarketItem, number>>} cost
 * @property {string} buffId
 * @property {number} durationMs
 */

 /**
 * @typedef {keyof typeof RPG_CONFIG.CRAFTING_RECIPES} CraftingItem
 */

/**
 * @typedef {typeof RPG_CONFIG.CRAFTING_RECIPES[CraftingItem]} CraftingRecipe
 */

/**
 * @typedef {"COMMON" | "EPIC" | "LEGENDARY"} PetRarity
 */

/**
 * @typedef {"WORK_COOLDOWN" | "GAMBLING_BONUS" | "ALL_BONUS"} PetEffectType
 */

/**
 * @typedef {Object} PetConfig
 * @property {string} name - Display name of the pet.
 * @property {string} emoji - Emoji representation.
 * @property {PetRarity} rarity - Rarity level determining the drop chance.
 * @property {PetEffectType} effectType - The kind of buff the pet provides.
 * @property {number} value - The percentage value of the buff.
 * @property {string} description - Lore and effect description.
 */