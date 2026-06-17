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