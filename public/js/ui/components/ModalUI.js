export class ModalUI {
    constructor() {
        this.buildHTML();
        this.initListeners();
    }

    buildHTML() {
        this.overlay = document.createElement('div');
        this.overlay.className = "fixed inset-0 bg-black bg-opacity-60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300 opacity-0";
        
        this.modalBox = document.createElement('div');
        this.modalBox.className = "bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transform scale-95 transition-transform duration-300";
        
        this.header = document.createElement('div');
        this.header.className = "p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900";
        
        this.titleElement = document.createElement('h2');
        this.titleElement.className = "text-xl font-bold text-white";
        
        this.closeBtn = document.createElement('button');
        this.closeBtn.innerHTML = "&times;";
        this.closeBtn.className = "text-gray-400 hover:text-white text-3xl leading-none focus:outline-none transition-colors";
        
        this.header.appendChild(this.titleElement);
        this.header.appendChild(this.closeBtn);
        
        this.bodyContent = document.createElement('div');
        this.bodyContent.className = "p-6 overflow-y-auto text-gray-200";

        this.modalBox.appendChild(this.header);
        this.modalBox.appendChild(this.bodyContent);
        this.overlay.appendChild(this.modalBox);
        
        document.body.appendChild(this.overlay);
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && !this.overlay.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    /**
     * Open a modal with a title and specific content.
     * @param {string} title
     * @param {string|HTMLElement} content
     */
    open(title, content) {
        this.titleElement.textContent = title;
        
        if (typeof content === 'string') {
            this.bodyContent.innerHTML = content;
        } else {
            this.bodyContent.innerHTML = '';
            this.bodyContent.appendChild(content);
        }

        this.overlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.overlay.classList.remove('opacity-0');
            this.modalBox.classList.remove('scale-95');
            this.modalBox.classList.add('scale-100');
        });
    }

    close() {
        this.overlay.classList.add('opacity-0');
        this.modalBox.classList.remove('scale-100');
        this.modalBox.classList.add('scale-95');
        
        setTimeout(() => {
            this.overlay.classList.add('hidden');
            this.bodyContent.innerHTML = '';
        }, 300);
    }
}