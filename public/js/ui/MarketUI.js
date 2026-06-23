export class MarketUI {
    constructor(socket, modalUI) {
        this.socket = socket;
        this.modalUI = modalUI;
        this.initListeners();
    }

    initListeners() {
        document.getElementById('btn-market')?.addEventListener('click', () => {
            this.modalUI.open("⚖️ Mercado Global", `
                <div class="text-center py-8">
                    <svg class="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p>Consultando a los mercaderes...</p>
                </div>
            `);
            this.socket.emit("requestMarket");
        });

        this.socket.on("marketData", (auctions) => {
            this.renderTable(auctions);
        });

        this.socket.on("myItemsData", (items) => {
            this.renderPublishForm(items);
        });

        this.socket.on("refreshMarket", () => {
            if (!this.modalUI.overlay.classList.contains('hidden') && 
                this.modalUI.titleElement.textContent.includes("Mercado") &&
                !document.getElementById("publish-form")) {
                this.socket.emit("requestMarket");
            }
        });
    }

    renderTable(auctions) {
        if (this.modalUI.overlay.classList.contains('hidden')) return;

        const sortedAuctions = auctions.sort((a, b) => a.price - b.price);

        let html = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-gray-300 font-bold">Listado de Subastas</h3>
            <button id="btn-open-publish" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Vender Item
            </button>
        </div>
        <div class="bg-gray-900 rounded-lg border border-gray-700 shadow-md overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-800 text-gray-300 text-sm uppercase tracking-wider border-b border-gray-700">
                            <th class="p-3 font-semibold">Ítem</th>
                            <th class="p-3 font-semibold text-center">Cantidad</th>
                            <th class="p-3 font-semibold">Vendedor</th>
                            <th class="p-3 font-semibold text-right">Precio Total</th>
                            <th class="p-3 font-semibold text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-200 divide-y divide-gray-800">
        `;

        if (sortedAuctions.length === 0) {
            html += `<tr><td colspan="5" class="p-6 text-center text-gray-500 italic">No hay ninguna subasta activa en este momento. ¡Anímate a ser el primero!</td></tr>`;
        } else {
            sortedAuctions.forEach(auc => {
                const unitPrice = (auc.price / auc.amount).toFixed(1);
                html += `
                    <tr class="hover:bg-gray-750 transition-colors group">
                        <td class="p-3 font-medium text-blue-300">${auc.itemName}</td>
                        <td class="p-3 text-center"><span class="bg-gray-800 px-2 py-1 rounded text-sm">${auc.amount}</span></td>
                        <td class="p-3 text-sm text-gray-400">${auc.seller}</td>
                        <td class="p-3 text-right">
                            <div class="font-bold text-green-400">${auc.price.toLocaleString('es-ES')}€</div>
                            <div class="text-xs text-gray-500">(${unitPrice}€/u)</div>
                        </td>
                        <td class="p-3 text-center">
                            <button data-id="${auc.id}" class="buy-auction-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded transition-all shadow-md active:scale-95 text-sm">
                                Comprar
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div></div>
        <div class="mt-4 text-xs text-gray-500 text-center">* Las subastas expiran a las 24 horas y los objetos se devuelven al vendedor.</div>`;

        this.modalUI.open("⚖️ Mercado Global", html);

        document.getElementById('btn-open-publish').addEventListener('click', () => {
            this.socket.emit("requestMyItems");
        });

        document.querySelectorAll('.buy-auction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const auctionId = e.target.getAttribute('data-id');
                e.target.disabled = true;
                e.target.textContent = "Comprando...";
                e.target.classList.replace("bg-emerald-600", "bg-gray-600");
                this.socket.emit("buyAuction", auctionId);
            });
        });
    }

    renderPublishForm(items) {
        const itemNames = Object.keys(items);
        
        let optionsHtml = '';
        if (itemNames.length === 0) {
            optionsHtml = `<option value="" disabled selected>No tienes ningún material en tu mochila</option>`;
        } else {
            itemNames.forEach(name => {
                optionsHtml += `<option value="${name}">${name} (Tienes ${items[name]})</option>`;
            });
        }

        const html = `
        <div id="publish-form" class="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-md max-w-md mx-auto">
            <h3 class="text-xl font-bold text-gray-200 mb-4 text-center">Poner a la Venta</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Selecciona el material</label>
                    <select id="pub-item" class="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" ${itemNames.length === 0 ? 'disabled' : ''}>
                        ${optionsHtml}
                    </select>
                </div>

                <div class="flex gap-4">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-400 mb-1">Cantidad a vender</label>
                        <input type="number" id="pub-amount" min="1" class="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" placeholder="Ej: 5" ${itemNames.length === 0 ? 'disabled' : ''}>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-400 mb-1">Precio TOTAL (€)</label>
                        <input type="number" id="pub-price" min="1" class="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" placeholder="Ej: 500" ${itemNames.length === 0 ? 'disabled' : ''}>
                    </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button id="btn-cancel-pub" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button id="btn-confirm-pub" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${itemNames.length === 0 ? 'disabled' : ''}>
                        Publicar Subasta
                    </button>
                </div>
            </div>
        </div>
        `;

        this.modalUI.open("⚖️ Mercado Global", html);

        document.getElementById('btn-cancel-pub').addEventListener('click', () => {
            this.socket.emit("requestMarket");
        });

        document.getElementById('btn-confirm-pub').addEventListener('click', () => {
            const itemName = document.getElementById('pub-item').value;
            const amount = document.getElementById('pub-amount').value;
            const price = document.getElementById('pub-price').value;

            if (!itemName || amount <= 0 || price <= 0) {
                alert("Por favor, rellena todos los campos correctamente.");
                return;
            }

            this.socket.emit("publishAuction", { itemName, amount, price });
            this.socket.emit("requestMarket"); 
        });
    }
}