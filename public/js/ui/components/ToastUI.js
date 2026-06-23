export class ToastUI {
    constructor(audioSFX) {
        this.audioSFX = audioSFX;
        
        this.container = document.createElement('div');
        this.container.className = "fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none";
        document.body.appendChild(this.container);
    }

    /**
     * Shows a notification
     * @param {string} message - Text to show.
     * @param {'info'|'success'|'error'} type - Defines the color and icon.
     */
    show(message, type = 'info') {
        const toast = document.createElement('div');
        
        let bgColor = "bg-gray-800";
        let icon = "🔔";
        
        if (type === 'success') {
            bgColor = "bg-green-900 border border-green-500";
            icon = "✅";
            this.audioSFX.playCoin();
        } else if (type === 'error') {
            bgColor = "bg-red-900 border border-red-500";
            icon = "❌";
        } else if (type === 'mention') {
            bgColor = "bg-yellow-800 border border-yellow-500";
            icon = "👋";
            this.audioSFX.playMention();
        }

        toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto max-w-sm`;
        
        toast.innerHTML = `
            <div class="text-xl">${icon}</div>
            <div class="text-sm font-medium leading-tight">${message}</div>
        `;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}