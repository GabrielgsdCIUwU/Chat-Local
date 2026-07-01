import crypto from "node:crypto";
import { GAME_CONFIG } from "../core/constants.js";
import { RPG_CONFIG } from "../core/rpgConfig.js";

/**
 * @typedef {import('../core/types.js').IMarketService} IMarketService
 * @typedef {import('../core/types.js').IEconomyService} IEconomyService
 * @typedef {import('../core/types.js').IInventoryRepository} IInventoryRepository
 * @typedef {import('../core/types.js').IAuctionRepository} IAuctionRepository
 * @typedef {import('../core/types.js').AuctionItem} AuctionItem
 */

/**
 * Service orchestrating Global Auction Listings and safe direct peer trading.
 * 
 * @implements {IMarketService}
 */
export class MarketService {
    /**
     * 
     * @param {IEconomyService} economyService 
     * @param {IInventoryRepository} inventoryRepository 
     * @param {IAuctionRepository} auctionRepository 
     */
    constructor(economyService, inventoryRepository, auctionRepository) {
        this.economyService = economyService;
        this.inventoryRepository = inventoryRepository;
        this.auctionRepository = auctionRepository;
        this.pendingTrades = new Map();
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

        let finalItemName = itemName;

        await this.inventoryRepository.updateTransactional(sellerName, (inventory) => {
            const actualKey = inventory.findItemKey(itemName);

            if (!actualKey || !inventory.hasItem(actualKey, amount)) {
                throw new Error(`Tú no tienes suficientes items: ${amount}x ${itemName}`);
            }

            finalItemName = actualKey;
            inventory.removeItem(actualKey, amount);
        });

        const newAuction = {
            id: crypto.randomBytes(3).toString("hex"),
            seller: sellerName,
            itemName: finalItemName,
            amount: amount,
            price: price,
            expiresAt: Date.now() + GAME_CONFIG.AUCTION_EXPIRATION_MS,
        };

        await this.auctionRepository.save(newAuction);

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

        await this.inventoryRepository.updateTransactional(buyerName, (inventory) => {
            inventory.addItem(auction.itemName, auction.amount);
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
        const auctions = await this.auctionRepository.getAll();
        const expiredAuctions = auctions.filter(a => a.expiresAt <= now);

        if (expiredAuctions.length === 0) return;

        for (const auction of expiredAuctions) {
            await this.auctionRepository.removeAuction(auction.id);
            
            await this.inventoryRepository.updateTransactional(auction.seller, (inventory) => {
                inventory.addItem(auction.itemName, auction.amount);
            });
        }

        console.log(`[Market] Se han devuelto ${expiredAuctions.length} subastas expiradas a sus dueños.`);
    }

    /**
     * Creates a temporal propose trade.
     * @param {string} senderName 
     * @param {string} targetName 
     * @param {string} sendItem 
     * @param {number} sendAmount 
     * @param {string} reqItem 
     * @param {number} reqAmount 
     */
    async proposeTrade(senderName, targetName, sendItem, sendAmount, reqItem, reqAmount) {
        if (senderName === targetName) throw new Error("No puedes intercambiar contigo mismo.");
        if (sendAmount <= 0 || reqAmount <= 0) throw new Error("Cantidades inválidas.");

        const sItemActual = Object.keys(RPG_CONFIG.MARKET_PRICES).find(k => k.toLowerCase() === sendItem.toLowerCase());
        const rItemActual = Object.keys(RPG_CONFIG.MARKET_PRICES).find(k => k.toLowerCase() === reqItem.toLowerCase());

        if (!sItemActual || !rItemActual) throw new Error("Uno de los ítems no existe en el juego.");

        const senderInv = await this.inventoryRepository.getInventory(senderName);
        if (!senderInv.hasItem(sItemActual, sendAmount)) {
            throw new Error(`No tienes suficientes ${sItemActual}. Tienes ${senderInv.getItemAmount(sItemActual)}.`);
        }

        const existingTrade = this.pendingTrades.get(targetName);
        if (existingTrade) {
            if (Date.now() > existingTrade.expiresAt) {
                this.pendingTrades.delete(targetName);
            } else {
                throw new Error(`El usuario ${targetName} ya tiene un intercambio pendiente, debe responder primero.`);
            }
        }

        this.pendingTrades.set(targetName, {
            senderName,
            sendItem: sItemActual,
            sendAmount,
            reqItem: rItemActual,
            reqAmount,
            expiresAt: Date.now() + GAME_CONFIG.PROPOSE_TRAIDING_EXPIRATION
        });

        return { sItemActual, rItemActual };
    }

    /**
     * Resolves a trade propose (accept or deny as a transaction).
     * @param {string} targetName 
     * @param {boolean} accept 
     */
    async resolveTrade(targetName, accept) {
        const trade = this.pendingTrades.get(targetName);
        if (!trade || Date.now() > trade.expiresAt) {
            this.pendingTrades.delete(targetName);
            throw new Error("No tienes intercambios pendientes o la oferta ha caducado.");
        }

        this.pendingTrades.delete(targetName);
        if (!accept) return false;

        const senderInv = await this.inventoryRepository.getInventory(trade.senderName);
        if (!senderInv.hasItem(trade.sendItem, trade.sendAmount)) {
            throw new Error(`El intercambio falló: ${trade.senderName} ya no tiene suficientes ${trade.sendItem}.`);
        }

        await this.inventoryRepository.updateTransactional(trade.senderName, (txSender) => {
            txSender.removeItem(trade.sendItem, trade.sendAmount);
            txSender.addItem(trade.reqItem, trade.reqAmount);
        });

        await this.inventoryRepository.updateTransactional(targetName, (txTarget) => {
            txTarget.removeItem(trade.reqItem, trade.reqAmount);
            txTarget.addItem(trade.sendItem, trade.sendAmount);
        });

        return trade;
    }
}