import { appState } from '../core/state.js';

export class CommandUI {
    constructor(socket, textarea, btnSend) {
        this.socket = socket;
        this.textarea = textarea;
        this.btnSend = btnSend;
        
        this.suggestionBoxContainer = document.getElementById("suggestionBoxContainer");
        this.parameterChips = document.getElementById("parameterChips");
        
        this.suggestionBox = document.createElement("div");
        this.suggestionBox.className = "absolute top-full mt-1 w-full bg-gray-700 text-white rounded-lg shadow-xl hidden z-50 border border-gray-600 max-h-64 overflow-y-auto";
        this.suggestionBoxContainer.appendChild(this.suggestionBox);

        this.paramSuggestionBox = document.createElement("div");
        this.paramSuggestionBox.className = "absolute bg-gray-800 text-white rounded-md shadow-2xl hidden z-[100] border border-gray-600 max-h-40 overflow-y-auto min-w-[120px]";
        document.body.appendChild(this.paramSuggestionBox);

        this.paramSelectedIndex = -1;

        this.reset();
    }

    reset() {
        this.suggestions = [];
        this.selectedIndex = -1;
        this.activeCommand = null;
        this.activeParams = [];
        this.paramValues = {};
        this.pathStack = [];
        
        this.suggestionBox.innerHTML = "";
        this.suggestionBox.classList.add("hidden");
        this.parameterChips.innerHTML = "";
        this.parameterChips.classList.add("hidden");
        this.validateParameters();
    }

    isActive() {
        return this.activeCommand !== null || this.textarea.value.trim().startsWith("/");
    }

    handleKeydown(e) {
        if (!this.isActive()) return false;

        const paramInputs = Array.from(this.parameterChips.querySelectorAll("input"));

        // Navegación entre parámetros con Tab
        if (e.key === "Tab" && paramInputs.length) {
            e.preventDefault();
            const currentIndex = paramInputs.indexOf(document.activeElement);
            const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            if (nextIndex >= 0 && nextIndex < paramInputs.length) {
                paramInputs[nextIndex].focus();
            } else {
                this.textarea.focus();
            }
            return true;
        }

        // Navegación en la caja de sugerencias
        if (!this.suggestionBox.classList.contains("hidden") && this.suggestionBox.children.length) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.suggestionBox.children.length;
                this.highlightSuggestion();
                return true;
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                this.selectedIndex = this.selectedIndex <= 0 ? this.suggestionBox.children.length - 1 : this.selectedIndex - 1;
                this.highlightSuggestion();
                return true;
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.suggestionBox.children[this.selectedIndex].click();
                }
                return true;
            } else if (e.key === "Escape") {
                this.reset();
                return true;
            }
        }
        return false;
    }

    handleInput() {
        const raw = this.textarea.value;
        if (!raw.startsWith("/")) {
            this.reset();
            return;
        }

        const tokens = raw.slice(1).split(" ");
        const activeTokens = tokens.slice(0, -1);
        const lastToken = tokens[tokens.length - 1];
        
        let node = appState.commandsTree;
        this.pathStack = [];
        
        for (let i = 0; i < activeTokens.length; i++) {
            const token = activeTokens[i];
            if (token && node && node[token]) {
                node = node[token];
                this.pathStack.push(token);
            } else {
                node = null;
                break;
            }
        }

        const subKeys = Object.keys(node || {}).filter(
            k => k !== "description" && k !== "params" && typeof node[k] === "object"
        );

        if (subKeys.length > 0) {
            this.buildSuggestions(node, subKeys, lastToken);
            this.parameterChips.classList.add("hidden");
            this.activeCommand = null;
        } else if (node?.params) {
            this.suggestionBox.classList.add("hidden");
            const commandPath = "/" + this.pathStack.join(" ");
            
            if (this.activeCommand !== commandPath) {
                this.showParameterChips(commandPath, node.params);
            }
        } else {
            this.suggestionBox.classList.add("hidden");
            this.parameterChips.classList.add("hidden");
            this.activeCommand = null;
        }
    }

    buildSuggestions(node, subKeys, lastToken) {
        this.suggestions = subKeys
            .filter(k => k.toLowerCase().startsWith(lastToken.toLowerCase()))
            .map(k => ({
                text: k,
                display: "/" + [...this.pathStack, k].join(" "),
                description: node[k].description || "Comando",
                params: node[k].params || []
            }));

        this.renderSuggestions();
    }

    renderSuggestions() {
        if (!this.suggestions.length) {
            this.suggestionBox.classList.add("hidden");
            return;
        }
        
        this.suggestionBox.innerHTML = "";
        this.suggestions.forEach((s, i) => {
            const item = document.createElement("div");
            item.className = "px-4 py-3 cursor-pointer hover:bg-gray-600 border-b border-gray-600 text-sm";
            item.innerHTML = `
                <div class="font-medium text-white">${s.display}</div>
                <div class="text-xs text-gray-300 mt-1">${s.description}</div>
            `;
            
            item.addEventListener("click", () => this.selectSuggestion(s));
            this.suggestionBox.appendChild(item);
        });

        this.suggestionBox.style.minWidth = Math.max(this.suggestionBoxContainer.clientWidth, 240) + "px";
        this.suggestionBox.classList.remove("hidden");
    }

    highlightSuggestion() {
        Array.from(this.suggestionBox.children).forEach((el, idx) => {
            el.classList.toggle("bg-gray-600", idx === this.selectedIndex);
        });

        if (this.selectedIndex >= 0) {
            const activeEl = this.suggestionBox.children[this.selectedIndex];
            activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }

    selectSuggestion(s) {
        this.suggestionBox.classList.add("hidden");

        this.textarea.value = s.display + " ";
        this.textarea.focus();
        
        if (s.params?.length) {
            this.showParameterChips(s.display, s.params);
        } else {
            this.activeCommand = null;
            this.activeParams = [];
            
            if (this.parameterChips) {
                this.parameterChips.classList.add("hidden");
            }
            
            this.handleInput(); 
        }
    }

    showParameterChips(commandText, params) {
        this.activeCommand = commandText;
        this.activeParams = params;
        this.parameterChips.innerHTML = "";
        
        if (!params || params.length === 0) {
            this.parameterChips.classList.add("hidden");
            this.validateParameters();
            return;
        }

        this.parameterChips.classList.remove("hidden");

        params.forEach((p, idx) => {
            const chip = document.createElement("div");
            chip.className = `inline-flex items-center space-x-1 border rounded-md px-2 py-1 text-xs ${p.required ? "bg-red-800 border-red-600" : "bg-blue-800 border-blue-600"}`;
            
            chip.innerHTML = `<label class="font-medium ${p.required ? 'text-red-200' : 'text-blue-200'}">${p.name}</label>`;
            
            const input = document.createElement("input");
            input.type = "text";
            input.className = "bg-transparent text-white text-xs w-20 focus:outline-none placeholder-gray-400 border-none";
            input.placeholder = p.type === "user" ? "Usuario..." : (p.values ? "Opciones..." : "...");
            input.dataset.paramName = p.name;
            input.autocomplete = "off";

            input.addEventListener("focus", () => this.showParamAutocomplete(input, p));
            input.addEventListener("input", () => {
                this.paramValues[p.name] = input.value;
                this.validateParameters();
                this.showParamAutocomplete(input, p);
            });

            input.addEventListener("keydown", (e) => {
                const isSuggestionOpen = !this.paramSuggestionBox.classList.contains("hidden") && this.paramSuggestionBox.children.length > 0;

                if (isSuggestionOpen) {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        this.paramSelectedIndex = (this.paramSelectedIndex + 1) % this.paramSuggestionBox.children.length;
                        this.highlightParamSuggestion();
                        return;
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        this.paramSelectedIndex = this.paramSelectedIndex <= 0 ? this.paramSuggestionBox.children.length - 1 : this.paramSelectedIndex - 1;
                        this.highlightParamSuggestion();
                        return;
                    } else if (e.key === "Enter") {
                        if (this.paramSelectedIndex >= 0) {
                            e.preventDefault();
                            this.paramSuggestionBox.children[this.paramSelectedIndex].click();
                            return;
                        }
                        this.hideParamAutocomplete();
                    } else if (e.key === "Tab") {
                        e.preventDefault();
                        const selectIndex = this.paramSelectedIndex >= 0 ? this.paramSelectedIndex : 0;
                        this.paramSuggestionBox.children[selectIndex].click();
                        return;
                    } else if (e.key === "Escape") {
                        e.preventDefault();
                        this.hideParamAutocomplete();
                        return;
                    }
                }

                if (e.key === "Enter" && !e.defaultPrevented) {
                    e.preventDefault();
                    if (!this.btnSend.disabled) {
                        this.sendCommand();
                    }
                } else if (e.key === "Tab" && !e.defaultPrevented) {
                    e.preventDefault();
                    const inputs = Array.from(this.parameterChips.querySelectorAll("input"));
                    const currentIndex = inputs.indexOf(input);
                    const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
                    if (nextIndex >= 0 && nextIndex < inputs.length) {
                        inputs[nextIndex].focus();
                    } else {
                        this.textarea.focus();
                    }
                }
            });

            chip.appendChild(input);
            this.parameterChips.appendChild(chip);
        });

        this.validateParameters();
        
        if (this.textarea.value.trim() !== commandText) {
            this.textarea.value = commandText + " ";
        }

        this.parameterChips.querySelector("input")?.focus();
    }

    showParamAutocomplete(input, paramDef) {
        let options = [];
        
        if (paramDef.type === "user") {
            options = appState.userNames;
        } else if (paramDef.values && Array.isArray(paramDef.values)) {
            options = paramDef.values;
        }

        if (!options || options.length === 0) {
            this.hideParamAutocomplete();
            return;
        }

        const query = input.value.toLowerCase();
        const filtered = options.filter(opt => opt.toLowerCase().includes(query));

        if (!filtered.length || (filtered.length === 1 && filtered[0].toLowerCase() === query)) {
            this.hideParamAutocomplete();
            return;
        }

        this.paramSuggestionBox.innerHTML = "";
        this.paramSelectedIndex = -1;

        filtered.forEach((opt, idx) => {
            const item = document.createElement("div");
            item.className = "px-3 py-2 cursor-pointer hover:bg-gray-600 text-sm";
            item.textContent = opt;
            
            item.addEventListener("click", () => {
                input.value = opt;
                this.paramValues[paramDef.name] = opt;
                this.validateParameters();
                this.hideParamAutocomplete();
                
                const inputs = Array.from(this.parameterChips.querySelectorAll("input"));
                const currentIndex = inputs.indexOf(input);
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    this.textarea.focus();
                }
            });
            
            this.paramSuggestionBox.appendChild(item);
        });

        const rect = input.getBoundingClientRect();
        this.paramSuggestionBox.style.bottom = 'auto';
        this.paramSuggestionBox.style.top = `${rect.bottom + window.scrollY + 5}px`;
        this.paramSuggestionBox.style.left = `${rect.left + window.scrollX}px`;
        
        this.paramSuggestionBox.classList.remove("hidden");
    }

    hideParamAutocomplete() {
        this.paramSuggestionBox.classList.add("hidden");
        this.paramSelectedIndex = -1;
    }

    highlightParamSuggestion() {
        Array.from(this.paramSuggestionBox.children).forEach((el, idx) => {
            el.classList.toggle("bg-gray-600", idx === this.paramSelectedIndex);
        });
        
        if (this.paramSelectedIndex >= 0) {
            const activeEl = this.paramSuggestionBox.children[this.paramSelectedIndex];
            activeEl.scrollIntoView({ block: "nearest" });
        }
    }

    validateParameters() {
        if (!this.activeParams.length) {
            if (this.btnSend) this.btnSend.disabled = false;
            return;
        }
        const hasError = this.activeParams.some(p => {
            const val = (this.paramValues[p.name] || "").trim().toLowerCase();
            
            if (p.required && !val) return true;
            
            if (val && p.values) {
                const lowerValues = p.values.map(v => v.toLowerCase());
                if (!lowerValues.includes(val)) return true;
            }
            
            return false;
        });
        if (this.btnSend) this.btnSend.disabled = hasError;
    }

    sendCommand() {
        const rawCommand = this.#buildRawCommand();
        if (!rawCommand || rawCommand === "/") return;

        const tokens = this.#tokenizeCommand(rawCommand);
        if (!tokens.length) {
            this.reset();
            return;
        }

        const { command, subcommands, params } = this.#resolveCommandStructure(tokens);

        this.socket.emit("sendcmd", { command, subcommands, params, raw: rawCommand });
        this.textarea.value = "";
        this.reset();
    }

    #buildRawCommand() {
        let finalCmd = this.activeCommand || this.textarea.value;
        
        if (this.activeCommand && this.activeParams.length) {
            this.activeParams.forEach(param => {
                const value = (this.paramValues[param.name] || "").trim();
                if (value) {
                    finalCmd += value.includes(" ") ? ` %${value}%` : ` ${value}`;
                }
            });
        }
        
        return finalCmd.trim();
    }

    #tokenizeCommand(rawCommand) {
        const commandString = rawCommand.slice(1).trim(); 
        if (!commandString) return [];

        const matches = commandString.match(/%[^%]+%|[^\s]+/g) || [];

        return matches.map(token => {
            if (token.startsWith('%') && token.endsWith('%') && token.length >= 2) {
                return token.slice(1, -1).trim(); 
            }
            return token;
        });
    }

    #resolveCommandStructure(tokens) {
        const command = tokens[0];
        const subcommands = [];
        const params = [];

        let currentNode = appState.commandsTree[command];

        for (let i = 1; i < tokens.length; i++) {
            const token = tokens[i];
            
            const isSubcommandNode = currentNode && 
                                     currentNode[token] && 
                                     typeof currentNode[token] === "object" && 
                                     token !== "params" && 
                                     token !== "description";

            if (isSubcommandNode) {
                subcommands.push(token);
                currentNode = currentNode[token]; 
            } else {
                params.push(token);
            }
        }

        return { command, subcommands, params };
    }
}