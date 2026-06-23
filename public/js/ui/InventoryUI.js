export class InventoryUI {
    constructor(socket, modalUI) {
        this.socket = socket;
        this.modalUI = modalUI;
        this.initListeners();
    }

    initListeners() {
        document.getElementById('btn-inventory')?.addEventListener('click', () => {
            this.modalUI.open("🎒 Mi Inventario", `
                <div class="text-center py-8">
                    <svg class="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p>Rebuscando en los bolsillos...</p>
                </div>
            `);
            this.socket.emit("requestInventory");
        });

        this.socket.on("inventoryData", (data) => {
            this.render(data);
        });
    }

    render(data) {
         if (this.modalUI.overlay.classList.contains('hidden')) return;

        const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Columna Izquierda: Stats y Mochila -->
            <div class="space-y-4">
                
                <!-- Tarjeta: Estadísticas -->
                <div class="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-md">
                    <h3 class="text-lg font-bold text-gray-300 mb-3 border-b border-gray-700 pb-1">Estadísticas</h3>
                    <p>💰 <span class="text-gray-400">Dinero:</span> <span class="font-bold text-green-400">${data.wallet.money.toLocaleString('es-ES')}€</span></p>
                    ${data.wallet.debt > 0 ? `<p>💳 <span class="text-gray-400">Deuda:</span> <span class="font-bold text-red-400">${data.wallet.debt.toLocaleString('es-ES')}€</span></p>` : ''}
                    
                    <div class="mt-3 pt-3 border-t border-gray-700">
                        ${data.job ? `
                            <p>${data.job.emoji} <span class="text-gray-400">Oficio:</span> <span class="font-bold text-blue-400">${data.job.name}</span></p>
                            <p>🛠️ <span class="text-gray-400">Herramienta:</span> Nv.${data.job.toolLevel} (${data.job.toolName})</p>
                            ${data.job.prestige > 0 ? `<p>🌟 <span class="text-gray-400">Prestigio:</span> <span class="font-bold text-yellow-400">Nivel ${data.job.prestige}</span></p>` : ''}
                        ` : `<p class="text-gray-500 italic">No tienes oficio. Usa el comando <code class="text-gray-300 bg-gray-800 px-1 rounded">/rpg join</code></p>`}
                    </div>
                </div>

                <!-- Tarjeta: Mochila (Items) -->
                <div class="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-md">
                    <h3 class="text-lg font-bold text-gray-300 mb-3 border-b border-gray-700 pb-1">Mochila</h3>
                    ${Object.keys(data.items).length === 0 ? '<p class="text-gray-500 italic text-sm">Tu mochila está completamente vacía.</p>' : `
                    <div class="flex flex-wrap gap-2">
                        ${Object.entries(data.items).map(([item, amount]) => `
                            <div class="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 flex items-center gap-2 hover:bg-gray-700 transition">
                                <span class="text-gray-200 text-sm font-medium">${item}</span>
                                <span class="bg-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">${amount}</span>
                            </div>
                        `).join('')}
                    </div>
                    `}
                </div>
            </div>

            <!-- Columna Derecha: Mascotas -->
            <div class="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-md h-full">
                <h3 class="text-lg font-bold text-gray-300 mb-3 border-b border-gray-700 pb-1 flex justify-between items-center">
                    <span>Mis Mascotas</span>
                    <span class="text-sm bg-gray-800 border border-gray-600 px-3 py-1 rounded-full text-gray-300">
                        🥚 Huevos: <span class="font-bold text-white">${data.eggs}</span>
                    </span>
                </h3>
                
                ${data.pets.length === 0 ? '<p class="text-gray-500 italic text-sm">No tienes mascotas capturadas. ¡Compra huevos en la tienda!</p>' : `
                <div class="space-y-3">
                    ${data.pets.map(p => `
                        <div class="bg-gray-800 border ${p.equipped ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.2)]' : 'border-gray-600'} rounded-lg p-3 flex justify-between items-center transition-all hover:-translate-y-0.5">
                            <div class="flex items-center gap-3">
                                <span class="text-3xl drop-shadow-md">${p.emoji}</span>
                                <div>
                                    <p class="font-bold text-gray-200 leading-tight">${p.name}</p>
                                    <p class="text-xs font-semibold tracking-wide ${p.rarity === 'LEGENDARY' ? 'text-orange-400' : p.rarity === 'EPIC' ? 'text-purple-400' : 'text-gray-400'}">${p.rarity}</p>
                                </div>
                            </div>
                            ${p.equipped ? '<span class="bg-green-600 text-white text-xs px-2.5 py-1 rounded-md font-bold shadow-sm uppercase tracking-wider">Equipada</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                `}
            </div>
        </div>`;

        this.modalUI.open("🎒 Mi Inventario de Rol", html);
    }
}