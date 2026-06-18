import crypto from "node:crypto";

/**
 * @typedef {import('../repositories/AuctionRepository.js').AuctionItem} AuctionItem
 */

export class MarketService {
    /**
     * 
     * @param {import('./EconomyService.js').EconomyService} economyService 
     * @param {import('../repositories/InventoryRepository.js').InventoryRepository} inventoryRepository 
     * @param {import('../repositories/AuctionRepository.js').AuctionRepository} auctionRepository 
     */
    constructor(economyService, inventoryRepository, auctionRepository) {
        this.economyService = economyService;
        this.inventoryRepository = inventoryRepository;
        this.auctionRepository = auctionRepository;
    }

    /**
     * Publishes a new item on the global auction house.
     * @param {string} sellerName - Username of the seller.
     * @param {string} itemName - Name of the item.
     * @param {number} amount - Quantity to sell
     * @param {number} price - Total price for the bundle.
     * @returns {Promise<AuctionItem>} The created auction object.
     * @throws {Error} If input is invalid or insufficient items.
     */
    async publishAuction(sellerName, itemName, amount, price) {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Cantidad inválida.");
        if (!Number.isSafeInteger(price) || price <= 0) throw new Error("Precio inválido.");

        await this.inventoryRepository.executeTransaction((inventories) => {
            const inventory = this.inventoryRepository.ensureInventory(inventories, sellerName);

            const actualItem = Object.keys(inventory.items).find(k => k.toLowerCase() === itemName.toLowerCase());
            if (!actualItem || inventory.items[actualItem] < amount) {
                throw new Error(`Tú no tienes suficientes items: ${amount}x ${itemName}`);
            }

            itemName = actualItem;
            inventory.items[actualItem] -= amount;
            if (inventory.items[actualItem] === 0) delete inventory.items[actualItem];
        });

        const newAuction = {
            id: crypto.randomBytes(3).toString("hex"),
            seller: sellerName,
            itemName: itemName,
            amount: amount,
            price: price,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
        };

        await this.auctionRepository.executeTransaction((auctions) => {
            auctions.push(newAuction);
        });

        return newAuction;
    }

    /**
     * Processes the purchase of an auction. Includes rollback logic.
     * @param {string} buyerName - Username of the buyer.
     * @param {string} auctionId - The auction ID.
     * @returns {Promise<AuctionItem>} The successfully purchased auction object.
     * @throws {Error} If auction doesn't exist, insufficient funds, or already sold.
     */
    async buyAuction(buyerName, auctionId) {
        const auctions = await this.auctionRepository.getAll();
        const auction = auctions.find(a => a.id === auctionId);

        if (!auction) throw new Error("Auction no encontrado o ya se vendió.");
        if (auction.seller === buyerName) throw new Error("No puedes comprar tu propio Auction.");

        await this.economyService.removeFunds(buyerName, auction.price);

        try {
            const claimed = await this.auctionRepository.removeAuction(auctionId);
            if (!claimed) throw new Error("Auction ya está reclamado");
        } catch(error) {
            await this.economyService.addFunds(buyerName, auction.price);
            throw new Error("Demasiado tarde! este item ya lo compró alguien.");
        }

        await this.economyService.addFunds(auction.seller, auction.price);

        await this.inventoryRepository.executeTransaction((inventories) => {
            const inventory = this.inventoryRepository.ensureInventory(inventories, buyerName);
            inventory.items[auction.itemName] = (inventory.items[auction.itemName] || 0) + auction.amount;
        });

        return auction;
    }

    /**
     * Retrieves a paginated/sliced list of active auctions.
     * @returns {Promise<AuctionItem[]>}
     */
    async getActiveAuctions() {
        const auctions = await this.auctionRepository.getAll();
        const now = Date.now();
        return auctions.filter(a => a.expiresAt > now);
    }

    /**
     * Checks for expired auctions, removes them, and returns the items.
     * @returns {Promise<void>}
     */
    async checkExpiredAuctions() {
        const now = Date.now();
        let expiredAuctions = [];

        await this.auctionRepository.executeTransaction((auctions) => {
            expiredAuctions = auctions.filter(a => a.expiresAt <= now);
            
            for (let i = auctions.length - 1; i >= 0; i--) {
                if (auctions[i].expiresAt <= now) {
                    auctions.splice(i, 1);
                }
            }
        });

        if (expiredAuctions.length === 0) return;

        await this.inventoryRepository.executeTransaction((inventories) => {
            for (const auction of expiredAuctions) {
                const inventory = this.inventoryRepository.ensureInventory(inventories, auction.seller);
                inventory.items[auction.itemName] = (inventory.items[auction.itemName] || 0) + auction.amount;
            }
        });

        console.log(`[Market] Se han devuelto ${expiredAuctions.length} subastas expiradas a sus dueños.`);
    }
}