export class GachaUI {
    constructor(socket) {
        this.socket = socket;
        this.buildHTML();
        this.initListeners();
    }

    buildHTML() {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes shake {
                0% { transform: translate(1px, 1px) rotate(0deg); }
                10% { transform: translate(-1px, -2px) rotate(-5deg); }
                20% { transform: translate(-3px, 0px) rotate(5deg); }
                30% { transform: translate(3px, 2px) rotate(0deg); }
                40% { transform: translate(1px, -1px) rotate(5deg); }
                50% { transform: translate(-1px, 2px) rotate(-5deg); }
                60% { transform: translate(-3px, 1px) rotate(0deg); }
                70% { transform: translate(3px, 1px) rotate(-5deg); }
                80% { transform: translate(-1px, -1px) rotate(5deg); }
                90% { transform: translate(1px, 2px) rotate(0deg); }
                100% { transform: translate(1px, -2px) rotate(-5deg); }
            }
            .animate-shake { animation: shake 0.4s infinite; }
            .scale-up { transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: scale(1); }
            .scale-down { transform: scale(0); }
        `;
        document.head.appendChild(style);

        this.overlay = document.createElement('div');
        this.overlay.className = "fixed inset-0 bg-black bg-opacity-90 z-[200] hidden flex flex-col items-center justify-center transition-opacity duration-300 opacity-0";
        
        this.eggContainer = document.createElement('div');
        this.eggContainer.className = "text-[150px] cursor-pointer drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]";
        this.eggContainer.innerHTML = "🥚";

        this.resultContainer = document.createElement('div');
        this.resultContainer.className = "text-center hidden scale-down";
        
        this.petEmoji = document.createElement('div');
        this.petEmoji.className = "text-[120px] drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] mb-4";
        
        this.petName = document.createElement('h2');
        this.petName.className = "text-4xl font-black text-white mb-2 drop-shadow-md";

        this.petRarity = document.createElement('p');
        this.petRarity.className = "text-xl font-bold tracking-widest uppercase mb-6";

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = "bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-500 transition-colors focus:outline-none";
        this.closeBtn.textContent = "¡Increíble!";

        this.resultContainer.appendChild(this.petEmoji);
        this.resultContainer.appendChild(this.petName);
        this.resultContainer.appendChild(this.petRarity);
        this.resultContainer.appendChild(this.closeBtn);

        this.overlay.appendChild(this.eggContainer);
        this.overlay.appendChild(this.resultContainer);
        document.body.appendChild(this.overlay);
    }

    initListeners() {
        this.socket.on("gachaAnimation", (petData) => this.playAnimation(petData));
        this.closeBtn.addEventListener('click', () => this.close());
    }

    playAnimation(petData) {
        this.eggContainer.classList.remove("hidden");
        this.resultContainer.classList.add("hidden");
        this.resultContainer.classList.remove("scale-up");
        this.resultContainer.classList.add("scale-down");
        
        this.overlay.classList.remove("hidden");
        requestAnimationFrame(() => this.overlay.classList.remove("opacity-0"));

        this.eggContainer.classList.add("animate-shake");

        setTimeout(() => {
            this.eggContainer.classList.remove("animate-shake");
            this.eggContainer.classList.add("hidden");

            this.petEmoji.textContent = petData.emoji;
            this.petName.textContent = petData.name;
            
            if (petData.rarity === 'LEGENDARY') {
                this.petRarity.textContent = "🔥 LEYENDA ABSOLUTA 🔥";
                this.petRarity.className = "text-2xl font-black tracking-widest text-orange-400 mb-6 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]";
            } else if (petData.rarity === 'EPIC') {
                this.petRarity.textContent = "🌟 ÉPICO 🌟";
                this.petRarity.className = "text-xl font-bold tracking-widest uppercase text-purple-400 mb-6";
            } else {
                this.petRarity.textContent = "COMÚN";
                this.petRarity.className = "text-xl font-bold tracking-widest uppercase text-gray-400 mb-6";
            }

            // Mostrar resultado
            this.resultContainer.classList.remove("hidden");
            requestAnimationFrame(() => {
                this.resultContainer.classList.remove("scale-down");
                this.resultContainer.classList.add("scale-up");
            });

            // Lógica de Confeti
            this.shootConfetti(petData.rarity);

        }, 2000); // 2 segundos de temblor
    }

    shootConfetti(rarity) {
        if (!globalThis.confetti) return;

        const count = rarity === 'LEGENDARY' ? 300 : (rarity === 'EPIC' ? 150 : 80);
        const defaults = { origin: { y: 0.7 }, zIndex: 300 };

        function fire(particleRatio, opts) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio)});
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    close() {
        this.overlay.classList.add("opacity-0");
        setTimeout(() => this.overlay.classList.add("hidden"), 300);
    }
}