export class BossRaidUI {
    /**
     * @param {import('socket.io-client').Socket} socket 
     * @param {import('./components/ModalUI.js').ModalUI} modalUI 
     */
    constructor(socket, modalUI) {
        this.socket = socket;
        this.modalUI = modalUI;
        this.isRaidActive = false;
        this.timerInterval = null;

        this.#injectCSS();
        this.#initListeners();
    }


    #injectCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes bossShake {
                0% { transform: translate(2px, 1px) rotate(0deg); }
                25% { transform: translate(-3px, -2px) rotate(-2deg); }
                50% { transform: translate(1px, 3px) rotate(2deg); }
                75% { transform: translate(-2px, 1px) rotate(-1deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }
            .anim-shake { animation: bossShake 0.1s cubic-bezier(.36,.07,.19,.97) both; }
            @keyframes floatDamage {
                0% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
            }
            .floating-dmg {
                position: absolute; pointer-events: none; font-weight: 900;
                font-size: 28px; color: #ef4444;
                text-shadow: 0 0 10px rgba(0,0,0,0.8), 2px 2px 0 #000;
                animation: floatDamage 0.6s ease-out forwards; z-index: 50;
            }
        `;
        document.head.appendChild(style);
    }

    #initListeners() {
        this.socket.on("activity:raidStarted", (data) => this.#showInviteInChat(data));
        this.socket.on("activity:syncResponse", (data) => {
            if (data && !this.isRaidActive) {
                this.#showInviteInChat(data);
            }
        });
        this.socket.on("activity:raidSync", (data) => {
            if (this.isRaidActive) {
                this.#updateHp(data.hp);
                this.#showHitEffect();
            }
        });
        this.socket.on("activity:raidEnded", (data) => this.#handleRaidEnd(data));

        this.socket.on("connect", () => {
            this.socket.emit("activity:requestRaidSync");
        });
    }

    #showInviteInChat(data) {
        const chatContainer = document.getElementById("mensajes");
        if (!chatContainer) return;

        const oldInvite = document.getElementById("active-raid-invite");
        if (oldInvite) oldInvite.remove();

        const div = document.createElement("div");
        div.id = "active-raid-invite";
        div.className = "bg-red-900/40 border-2 border-red-600 rounded-lg p-4 mb-4 text-center shadow-lg animate-pulse";
        div.innerHTML = `
            <h4 class="text-xl font-bold text-red-400 mb-1">🚨 ¡INCURSIÓN DE JEFE GLOBAL! 🚨</h4>
            <p class="text-gray-300 text-sm mb-3">El servidor corre peligro. ¡El Rey Demonio está atacando!</p>
            <button class="join-raid-btn bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95">
                ⚔️ ENTRAR A LA BATALLA
            </button>
        `;
        
        chatContainer.prepend(div);

        div.querySelector('.join-raid-btn').addEventListener("click", () => {
            this.#renderRaidModal(data);
            div.remove(); 
        });
    }

    /**
     * Renders the raid modal and initializes interaction.
     * @param {Object} data - The raid synchronization data.
     */
    #renderRaidModal(data) {
        this.isRaidActive = true;
        this.maxHp = data.maxHp;

        const timeLimit = data.timeLimit || 30000;
        const hpPercentage = Math.max(0, (data.hp / data.maxHp) * 100);

        const html = `
            <div class="flex flex-col items-center justify-center p-6 select-none relative" id="raid-container">
                <h3 class="text-2xl font-black text-red-500 mb-4 uppercase tracking-widest drop-shadow-md">¡Rey Demonio!</h3>
                
                <!-- RELOJ CIRCULAR SVG -->
                <div class="relative w-20 h-20 mb-6 flex items-center justify-center">
                    <svg class="transform -rotate-90 w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" stroke-width="8" fill="none" />
                        <circle id="boss-timer-circle" cx="50" cy="50" r="42" 
                            stroke="white" stroke-width="8" fill="none" stroke-linecap="round" 
                            stroke-dasharray="263.89" stroke-dashoffset="0" 
                            class="transition-[stroke-dashoffset] duration-1000 ease-linear" />
                    </svg>
                    <span id="boss-timer-text" class="absolute text-2xl font-black text-white drop-shadow-md"></span>
                </div>

                <!-- BARRA DE VIDA -->
                <div class="w-full max-w-md bg-gray-900 rounded-full h-6 mb-8 border-2 border-gray-700 overflow-hidden relative shadow-inner">
                    <div id="boss-hp-bar" class="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-75" style="width: ${hpPercentage}%"></div>
                    <span id="boss-hp-text" class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white text-shadow">${data.hp} / ${data.maxHp} HP</span>
                </div>
                
                <div id="boss-entity" class="text-[140px] cursor-pointer transition-transform hover:scale-105 active:scale-95 drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                    👺
                </div>
                <p class="text-gray-500 mt-6 animate-pulse">¡Clica lo más rápido que puedas!</p>
            </div>
        `;

        this.modalUI.open("⚔️ Batalla en Directo", html);

        this.#startTimer(data.expiresAt, timeLimit);

        setTimeout(() => {
            const bossEntity = document.getElementById("boss-entity");
            if (bossEntity) {
                const hit = (e) => {
                    e.preventDefault();
                    this.socket.emit("activity:hitBoss");
                    
                    const rect = bossEntity.getBoundingClientRect();
                    const x = (e.clientX || (e.touches?.[0].clientX)) - rect.left;
                    const y = (e.clientY || (e.touches?.[0].clientY)) - rect.top;
                    this.#createLocalFloatingText(x, y);
                };
                bossEntity.addEventListener("mousedown", hit);
                bossEntity.addEventListener("touchstart", hit);
            }
        }, 100);
    }

    /**
     * Updates the circular countdown timer every second.
     * @param {number} expiresAt - Unix timestamp when the raid ends.
     * @param {number} timeLimit - Total duration of the raid in milliseconds.
     */
    #startTimer(expiresAt, timeLimit) {
        this.#stopTimer(); 
        
        const circleEl = document.getElementById("boss-timer-circle");
        const textEl = document.getElementById("boss-timer-text");
        if (!circleEl || !textEl) return;

        const circumference = 263.89;

        const updateTimer = () => {
            const now = Date.now();
            const timeLeft = expiresAt - now;

            if (timeLeft <= 0) {
                textEl.textContent = "0";
                circleEl.style.strokeDashoffset = circumference;
                this.#stopTimer();
                return;
            }

            const secondsLeft = Math.ceil(timeLeft / 1000);
            textEl.textContent = secondsLeft;

            const percentage = Math.max(0, timeLeft / timeLimit);
            const offset = circumference - (percentage * circumference);
            circleEl.style.strokeDashoffset = offset;

            if (timeLeft <= 10000) {
                circleEl.setAttribute("stroke", "#ef4444");
                textEl.classList.add("text-red-500", "animate-pulse");
            }
        };

        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    /**
     * Clears the active interval to prevent memory leaks.
     */
    #stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    #updateHp(currentHp) {
        const hpBar = document.getElementById("boss-hp-bar");
        const hpText = document.getElementById("boss-hp-text");
        if (hpBar && hpText) {
            const percentage = Math.max(0, (currentHp / this.maxHp) * 100);
            hpBar.style.width = `${percentage}%`;
            hpText.textContent = `${currentHp} / ${this.maxHp} HP`;
        }
    }

    #showHitEffect() {
        const bossEntity = document.getElementById("boss-entity");
        if (!bossEntity) return;
        bossEntity.classList.remove("anim-shake");
        void bossEntity.offsetWidth;
        bossEntity.classList.add("anim-shake");
    }

    #createLocalFloatingText(x, y) {
        const bossEntity = document.getElementById("boss-entity");
        if (!bossEntity) return;

        const floatEl = document.createElement("div");
        floatEl.className = "floating-dmg";
        floatEl.style.left = `${x + (Math.random() * 40 - 20)}px`;
        floatEl.style.top = `${y + (Math.random() * 40 - 20)}px`;
        floatEl.textContent = "💥"; 

        bossEntity.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 600);
    }

    /**
     * Handles the visual results when a raid ends.
     * @param {Object} data - The results data from the server.
     */
    #handleRaidEnd(data) {
        this.isRaidActive = false;
        this.#stopTimer();
        
        let resultHtml = "";
        
        if (data.success) {
            const sortedPlayers = Object.entries(data.leaderboard).sort((a, b) => b[1] - a[1]);
            const listHtml = sortedPlayers.map((p, i) => `
                <li class="flex justify-between py-2 border-b border-gray-700 text-sm">
                    <span class="text-gray-300">#${i+1} ${p[0]}</span>
                    <span class="font-bold text-green-400">${p[1]} Daño (${Math.floor(p[1]*2)}€)</span>
                </li>
            `).join('');

            if (globalThis.confetti) {
                globalThis.confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
            }

            resultHtml = `
                <div class="text-center p-4">
                    <div class="text-[60px] mb-2">🏆</div>
                    <h2 class="text-2xl font-black text-yellow-400 mb-2">¡EL JEFE CAYÓ!</h2>
                    <p class="text-gray-300 mb-4 text-sm">El servidor está a salvo. Aquí están los héroes:</p>
                    <ul class="w-full bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto shadow-inner">
                        ${listHtml}
                    </ul>
                </div>
            `;
        } else {
            const penaltyHtml = data.penalty ? `<p class="text-red-400 font-bold text-lg mt-3 bg-red-900/30 py-2 rounded shadow-inner border border-red-800">¡Todos los participantes han perdido ${data.penalty}€!</p>` : "";
            
            resultHtml = `
                <div class="text-center p-6">
                    <div class="text-[80px] mb-4 grayscale opacity-70">💨</div>
                    <h2 class="text-3xl font-black text-gray-500 mb-2">SE ESCAPÓ</h2>
                    <p class="text-gray-400">No tuvisteis el daño suficiente a tiempo...</p>
                    ${penaltyHtml}
                </div>
            `;
        }

        this.modalUI.open("⚔️ Resultados de Incursión", resultHtml);
    }
}