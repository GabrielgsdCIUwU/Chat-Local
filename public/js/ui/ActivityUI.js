import { appState } from '../core/state.js';

/**
 * @typedef {Object} CommandParam
 * @property {string} name - The internal variable name.
 * @property {string} [displayName] - The UI alias.
 * @property {string} type - The data type (string, number, user).
 * @property {boolean} required - Whether the parameter is mandatory.
 * @property {string} description - Description of the parameter.
 * @property {string[]} [values] - Optional array of specific allowed values.
 */

/**
 * @typedef {Object} ParsedCommand
 * @property {string} id - The full command string space-separated (e.g., "rpg work").
 * @property {string} command - The base root command (e.g., "rpg").
 * @property {string[]} subcommands - Array of subcommands (e.g., ["work"]).
 * @property {string} name - The display name (usually the last subcommand).
 * @property {string} category - The category group.
 * @property {string} description - The command description.
 * @property {CommandParam[]} params - The required and optional parameters.
 * @property {string} icon - The visual emoji icon.
 */

export class ActivityUI {
    /**
     * Initializes the Activity UI component.
     * @param {import('socket.io-client').Socket} socket - The Socket.io client instance.
     */
    constructor(socket) {
        this.socket = socket;
        
        this.elements = {
            openBtn: document.getElementById("openActivityMenuBtn"),
            altOpenBtn: document.getElementById("btn-activities"),
            modal: document.getElementById("activityMenuModal"),
            box: document.getElementById("activityMenuBox"),
            closeBtn: document.getElementById("closeActivityMenuBtn"),
            listView: document.getElementById("activityListView"),
            formView: document.getElementById("activityFormView"),
            searchInput: document.getElementById("activitySearchInput"),
            categoriesContainer: document.getElementById("activityCategories"),
            commandsGrid: document.getElementById("activityCommandsGrid"),
            emptyState: document.getElementById("activityEmptyState"),
            backBtn: document.getElementById("backToActivitiesBtn"),
            cancelBtn: document.getElementById("cancelActivityBtn"),
            formTitle: document.getElementById("activityFormTitle"),
            formDesc: document.getElementById("activityFormDesc"),
            paramForm: document.getElementById("activityParamForm")
        };

        if (this.elements.listView) this.elements.listView.classList.add("min-h-0", "flex-1");
        if (this.elements.formView) this.elements.formView.classList.add("min-h-0", "flex-1");
        
        /** @type {string} */
        this.selectedCategory = "All";
        
        /** @type {string} */
        this.searchQuery = "";
        
        /** @type {ParsedCommand | null} */
        this.activeCommand = null; 
        
        /** @type {ParsedCommand[]} */
        this.commandsList = [];

        /** @type {string[]} */
        this.categoriesList = ["All", "⭐ Recientes", "General"];
        
        this.wallet = 0;
        this.inventory = {};
        this.cooldowns = {};

        this.#initListeners();
    }
    
    /**
     * Binds all necessary event listeners for the UI interactions.
     */
    #initListeners() {
        const { openBtn, altOpenBtn, closeBtn, modal, searchInput, backBtn, cancelBtn, paramForm } = this.elements;

        if (openBtn) openBtn.addEventListener("click", () => this.open());
        if (altOpenBtn) altOpenBtn.addEventListener("click", () => this.open());
        if (closeBtn) closeBtn.addEventListener("click", () => this.close());
        
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) this.close();
            });
        }
        
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
                this.close();
            }
        });
        
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderCommands();
            });
        }
        
        if (backBtn) backBtn.addEventListener("click", () => this.showListView());
        if (cancelBtn) cancelBtn.addEventListener("click", () => this.showListView());
        
        if (paramForm) {
            paramForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.#executeFormCommand();
            });
        }

        this.socket.on("activityData", (data) => {
            this.wallet = data.wallet;
            this.inventory = data.inventory;
            this.cooldowns = data.cooldowns;
            if (this.elements.modal && !this.elements.modal.classList.contains("hidden")) {
                this.renderCommands();
            }
        });
    }

    /**
     * Saves a command to the browser's local storage for the 'Recent' section.
     * @param {string} cmdId 
     */
    #saveRecentCommand(cmdId) {
        let recents = JSON.parse(localStorage.getItem("recentActivityCommands") || "[]");
        recents = recents.filter(id => id !== cmdId);
        recents.unshift(cmdId);
        if (recents.length > 5) recents.pop();
        localStorage.setItem("recentActivityCommands", JSON.stringify(recents));
    }

    /**
     * Formats milliseconds into a readable string format.
     * @param {number} ms 
     * @returns {string} Formatted time string.
     */
    #formatCooldown(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m ${seconds}s`;
    }
    
    /**
     * Parses the global commands tree filtering groups and standalone commands.
     */
    parseCommandsTree() {
        this.commandsList = [];
        this.categoriesList = ["All", "General"];
        
        const recents = JSON.parse(localStorage.getItem("recentActivityCommands") || "[]");
        if (recents.length > 0) this.categoriesList.push("⭐ Recientes");

        const tree = appState.commandsTree || {};
        
        for (const [rootKey, rootValue] of Object.entries(tree)) {
            if (rootKey === "types") continue;
            
            const subKeys = Object.keys(rootValue).filter(
                k => k !== "params" && k !== "description" && k !== "adminOnly"
            );
            
            if (subKeys.length > 0) {
                const categoryName = rootKey.charAt(0).toUpperCase() + rootKey.slice(1);
                if (!this.categoriesList.includes(categoryName)) this.categoriesList.push(categoryName);
                
                for (const subKey of subKeys) {
                    const subCmd = rootValue[subKey];
                    if (subCmd.adminOnly) continue;
                    
                    const cmdObj = {
                        id: `${rootKey} ${subKey}`, command: rootKey, subcommands: [subKey],
                        name: subKey, category: categoryName, description: subCmd.description || "Sin descripción.",
                        params: subCmd.params || [], icon: this.#getIconForCategory(categoryName)
                    };

                    this.commandsList.push(cmdObj);
                    if (recents.includes(cmdObj.id)) this.commandsList.push({ ...cmdObj, category: "⭐ Recientes" });
                }
            } else {
                if (rootValue.adminOnly) continue;
                
                const cmdObj = {
                    id: rootKey, command: rootKey, subcommands: [],
                    name: rootKey, category: "General", description: rootValue.description || "Sin descripción.",
                    params: rootValue.params || [], icon: this.#getIconForCategory("General")
                };

                this.commandsList.push(cmdObj);
                if (recents.includes(cmdObj.id)) this.commandsList.push({ ...cmdObj, category: "⭐ Recientes" });
            }
        }

        this.categoriesList.sort((a, b) => {
            if (a === "All") return -1; if (b === "All") return 1;
            if (a === "⭐ Recientes") return -1; if (b === "⭐ Recientes") return 1;
            if (a === "General") return -1; if (b === "General") return 1;
            return a.localeCompare(b);
        });
    }
    
    /**
     * Maps a category name to a visual emoji.
     * @param {string} category - The category name.
     * @returns {string} The assigned emoji.
     */
    #getIconForCategory(category) {
        const icons = { "Rpg": "⛏️", "Eco": "💰", "Gambling": "🎰", "Pet": "🐾", "Guild": "🛡️", "Market": "⚖️", "General": "⚡", "⭐ Recientes": "⭐" };
        return icons[category] || "🕹️";
    }
    
    /**
     * Opens the Activity Menu Modal and initializes the views.
     */
    open() {
        if (!this.elements.modal) return;
        
        this.socket.emit("requestActivityData")

        this.parseCommandsTree();
        this.renderCategories();
        this.renderCommands();
        this.showListView();
        
        this.elements.modal.classList.remove("hidden");
        requestAnimationFrame(() => {
            this.elements.modal.classList.remove("opacity-0");
            this.elements.box.classList.remove("scale-95");
            this.elements.box.classList.add("scale-100");
        });
        
        if (this.elements.searchInput) {
            this.elements.searchInput.value = "";
            this.searchQuery = "";
            this.elements.searchInput.focus();
        }
    }
    
    /**
     * Closes the Activity Menu Modal with animation.
     */
    close() {
        if (!this.elements.modal) return;
        
        this.elements.modal.classList.add("opacity-0");
        this.elements.box.classList.remove("scale-100");
        this.elements.box.classList.add("scale-95");
        setTimeout(() => this.elements.modal.classList.add("hidden"), 300);
    }
    
    /**
     * Switches the view to the Command List Grid.
     */
    showListView() {
        const { listView, formView } = this.elements;
        if (!listView || !formView) return;
        formView.classList.add("hidden"); formView.classList.remove("flex");
        listView.classList.remove("hidden"); listView.classList.add("flex");
        this.activeCommand = null;
    }
    
    /**
     * Switches the view to the Parameter Form for a specific command.
     * @param {ParsedCommand} cmd - The command selected by the user.
     */
    showFormView(cmd) {
        const { listView, formView, formTitle, formDesc, paramForm } = this.elements;
        if (!listView || !formView) return;
        
        this.activeCommand = cmd;
        listView.classList.add("hidden"); listView.classList.remove("flex");
        formView.classList.remove("hidden"); formView.classList.add("flex");
        
        if (formTitle) formTitle.textContent = `/${cmd.id}`;
        if (formDesc) formDesc.textContent = cmd.description;
        
        const iconContainer = document.getElementById("activityFormIcon");
        if (iconContainer) iconContainer.textContent = cmd.icon;
        
        if (paramForm) {
            paramForm.innerHTML = "";
            
            cmd.params.forEach((param, index) => {
                const wrapper = document.createElement("div");
                wrapper.className = "mb-5";
                
                const label = document.createElement("label");
                label.className = "block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide";
                const uiName = param.displayName || param.name;
                label.innerHTML = `${uiName} ${param.required ? '<span class="text-red-400">*</span>' : '<span class="text-gray-500 font-normal normal-case ml-1">(Opcional)</span>'}`;
                
                const inputElement = this.#createInputElement(param);
                
                wrapper.appendChild(label);
                wrapper.appendChild(inputElement);
                paramForm.appendChild(wrapper);

                if (index === 0) setTimeout(() => inputElement.focus(), 50);
            });

            const errorBox = document.createElement("div");
            errorBox.className = "text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm font-medium mt-4 hidden flex items-center gap-2";
            paramForm.appendChild(errorBox);

            const submitBtn = document.querySelector('button[form="activityParamForm"]');
            
            const validateForm = () => {
                let errorMsg = "";
                const formData = new FormData(paramForm);
                
                const amountFields = ["cantidad", "dinero", "precio_total"];
                let reqAmount = 0;
                amountFields.forEach(f => { if (formData.has(f)) reqAmount += Number(formData.get(f)); });

                if (reqAmount > 0 && reqAmount > this.wallet) {
                    errorMsg = `Fondos insuficientes. Tienes: ${this.wallet.toLocaleString()}€`;
                }

                const itemFields = cmd.params.filter(p => p.type === "inventory_item");
                if (itemFields.length > 0) {
                    const selectedItem = formData.get(itemFields[0].name);
                    const qty = Number(formData.get("cantidad") || formData.get("mi_cantidad") || 0);
                    
                    if (selectedItem && qty > 0) {
                        const userHas = this.inventory[selectedItem] || 0;
                        if (qty > userHas) {
                            errorMsg = `No tienes suficientes ítems. Tienes: ${userHas}x ${selectedItem}`;
                        }
                    }
                }

                if (errorMsg) {
                    errorBox.innerHTML = `<span>⚠️</span> ${errorMsg}`;
                    errorBox.classList.remove("hidden");
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.classList.add("opacity-50", "cursor-not-allowed");
                    }
                } else {
                    errorBox.classList.add("hidden");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
                    }
                }
            };

            paramForm.addEventListener("input", validateForm);
            validateForm(); 
        }
    }

    /**
     * Creates the correct DOM input element based on the parameter definition.
     * @param {CommandParam} param - The parameter definition.
     * @returns {HTMLElement} The constructed input or select element.
     */
    #createInputElement(param) {
        const baseClasses = "w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 shadow-inner";
        let element;

        if (param.values && Array.isArray(param.values)) {
            element = document.createElement("select");
            element.className = baseClasses + " cursor-pointer appearance-none";
            element.innerHTML = `<option value="" disabled selected>Selecciona una opción...</option>`;
            param.values.forEach(val => element.innerHTML += `<option value="${val}">${val}</option>`);
        } else if (param.type === "user") {
            element = document.createElement("select");
            element.className = baseClasses + " cursor-pointer appearance-none";
            element.innerHTML = `<option value="" disabled selected>Selecciona un usuario...</option>`;
            appState.userNames.forEach(user => {
                if(user !== appState.currentUser) element.innerHTML += `<option value="${user}">@${user}</option>`;
            });
        } else if (param.type === "inventory_item") {
            element = document.createElement("select");
            element.className = baseClasses + " cursor-pointer appearance-none";
            element.innerHTML = `<option value="" disabled selected>Selecciona un material...</option>`;
            Object.entries(this.inventory).forEach(([item, amount]) => {
                element.innerHTML += `<option value="${item}">${item} (Tienes ${amount})</option>`;
            });
        } else {
            element = document.createElement("input");
            element.type = param.type === "number" ? "number" : "text";
            element.className = `${baseClasses} placeholder:text-gray-600`;
            const uiName = param.displayName || param.name;
            element.placeholder = param.description || `Introduce ${uiName}...`;
        }

        element.name = param.name;
        element.required = param.required;
        return element;
    }
    
    /**
     * Renders the category filter sidebar.
     */
    renderCategories() {
        const container = this.elements.categoriesContainer;
        if (!container) return;
        
        container.innerHTML = "";
        
        this.categoriesList.forEach(cat => {
            const btn = document.createElement("button");
            const isSelected = this.selectedCategory === cat;
            
            btn.className = `shrink-0 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all w-full flex items-center gap-2 ${
                isSelected 
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent'
            }`;
            
            const icon = cat === "All" ? "🔍" : this.#getIconForCategory(cat);
            const name = cat === "All" ? "Explorar" : cat;
            
            btn.innerHTML = `<span>${icon}</span> <span>${name}</span>`;
            
            btn.onclick = () => {
                this.selectedCategory = cat;
                this.renderCategories();
                this.renderCommands();
            };
            
            container.appendChild(btn);
        });
    }
    
    /**
     * Renders the grid of command buttons based on filters.
     */
    renderCommands() {
        const { commandsGrid, emptyState } = this.elements;
        if (!commandsGrid) return;
        
        commandsGrid.innerHTML = "";
        
        const filtered = this.commandsList.filter(cmd => {
            const matchCat = this.selectedCategory === "All" || cmd.category === this.selectedCategory;
            const matchSearch = cmd.name.toLowerCase().includes(this.searchQuery) || 
                                cmd.description.toLowerCase().includes(this.searchQuery) ||
                                cmd.id.toLowerCase().includes(this.searchQuery);
            return matchCat && matchSearch;
        });
        
        if (filtered.length === 0) {
            if (emptyState) emptyState.classList.remove("hidden");
        } else {
            if (emptyState) emptyState.classList.add("hidden");
            
            filtered.forEach(cmd => {
                const btn = document.createElement("button");
                const hasParams = cmd.params && cmd.params.length > 0;
                
                const cdMs = this.cooldowns[cmd.id];
                const isOnCooldown = cdMs && cdMs > 0;
                
                let renderDesc = cmd.description;
                if (isOnCooldown) renderDesc = `⏳ En espera: Disponible en ${this.#formatCooldown(cdMs)}`;

                const btnStateClass = isOnCooldown 
                    ? "opacity-50 cursor-not-allowed border-red-900/30 bg-red-900/10" 
                    : "hover:bg-gray-800 border-transparent hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer";

                btn.className = `shrink-0 flex items-center gap-4 p-2 w-full text-left bg-transparent border rounded-xl transition-all group ${btnStateClass}`;
                
                const paramStr = hasParams ? cmd.params.map(p => {
                                    const uiName = p.displayName || p.name;
                                    return p.required ? `&lt;${uiName}&gt;` : `[${uiName}]`;
                                }).join(" ") : "";
                btn.innerHTML = `
                    <div class="p-3 bg-gray-900 rounded-xl text-2xl ${isOnCooldown ? 'grayscale' : 'group-hover:scale-110 group-hover:bg-gray-950 shadow-inner border border-gray-800 group-hover:border-gray-700'} transition-all">
                        ${cmd.icon}
                    </div>
                    <div class="flex-1 min-w-0 py-1">
                        <div class="font-bold ${isOnCooldown ? 'text-gray-400' : 'text-gray-100'} flex items-baseline gap-2">
                            /${cmd.id}
                            ${paramStr ? `<span class="text-xs font-normal text-gray-500 font-mono tracking-tight">${paramStr}</span>` : ''}
                        </div>
                        <div class="text-sm ${isOnCooldown ? 'text-red-400 font-medium' : 'text-gray-400'} mt-0.5 truncate">${renderDesc}</div>
                    </div>
                    ${hasParams && !isOnCooldown ? `
                    <div class="text-gray-600 group-hover:text-blue-400 transition-colors self-center px-2">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>` : ''}
                `;
                
                btn.onclick = () => {
                    if (isOnCooldown) return;
                    if (hasParams) {
                        this.showFormView(cmd);
                    } else {
                        this.#emitCommandExecution(cmd, []);
                    }
                };
                
                commandsGrid.appendChild(btn);
            });
        }
    }
    
    /**
     * Gathers data from the form and executes the command.
     */
    #executeFormCommand() {
        if (!this.activeCommand || !this.elements.paramForm) return;
        
        const formData = new FormData(this.elements.paramForm);
        const paramValues = [];
        
        for (const param of this.activeCommand.params) {
            const value = formData.get(param.name)?.toString().trim();
            if (value) paramValues.push(value);
        }
        
        this.#emitCommandExecution(this.activeCommand, paramValues);
    }

    /**
     * Directly emits the command structure to the server via Socket.io.
     * @param {ParsedCommand} cmdObj - The parsed command object.
     * @param {string[]} paramValues - The array of evaluated parameters.
     */
    #emitCommandExecution(cmdObj, paramValues) {
        this.#saveRecentCommand(cmdObj.id);

        const rawParams = paramValues.map(p => p.includes(" ") ? `%${p}%` : p).join(" ");
        const rawCmd = `/${cmdObj.id} ${rawParams}`.trim();

        this.socket.emit("sendcmd", {
            command: cmdObj.command,
            subcommands: cmdObj.subcommands,
            params: paramValues,
            raw: rawCmd
        });
        
        this.close();
    }
}