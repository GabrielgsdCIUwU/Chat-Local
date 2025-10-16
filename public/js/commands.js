const textarea = document.getElementById("mensaje")
const suggestionBoxContainer = document.getElementById("suggestionBoxContainer")
const parameterChips = document.getElementById("parameterChips")
const enviarButton = document.getElementById("enviar")

if (!textarea || !suggestionBoxContainer || !parameterChips || !enviarButton) {
    console.error("Elementos DOM requeridos no encontrados", { textarea, suggestionBoxContainer, parameterChips, enviarButton })
}

const suggestionBox = document.createElement("div")
suggestionBox.className = "absolute bg-gray-700 text-white rounded-lg shadow-xl hidden z-50 border border-gray-600"
suggestionBoxContainer.appendChild(suggestionBox)

let commandsTree = {}
let pathStack = []
let suggestions = []
let selectedIndex = -1
let userInput = ""
let activeCommand = null
let activeParams = []
let paramValues = {}


function debounce(fn, wait) {
    let t
    return function (...args) {
        clearTimeout(t)
        t = setTimeout(() => fn.apply(this, args), wait)
    }
}
//region load Commands
async function loadCommands() {
    try {
        const r = await fetch("/commands")
        commandsTree = await r.json()
    } catch (e) {
        console.error("Error cargando comandos", e)
        commandsTree = {}
    }
}

//region Suggestions
function resetSuggestions() {
    suggestions = []
    selectedIndex = -1
    suggestionBox.innerHTML = ""
    suggestionBox.classList.add("hidden")
}

function openSuggestions() {
    if (!suggestions.length) {
        suggestionBox.classList.add("hidden")
        return
    }
    suggestionBox.innerHTML = ""
    suggestions.forEach((s, i) => {
        const item = document.createElement("div")
        item.className = "px-4 py-3 cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-b-0 transition-colors duration-150"
        const main = document.createElement("div")
        main.className = "font-medium text-white"
        main.textContent = s.display || s.text
        const desc = document.createElement("div")
        desc.className = "text-sm text-gray-300 mt-1"
        desc.textContent = s.description || ""
        item.appendChild(main)
        item.appendChild(desc)
        if (s.params && s.params.length) {
            const paramsLine = document.createElement("div")
            paramsLine.className = "text-xs text-blue-400 mt-2 flex flex-wrap gap-2"
            s.params.forEach(p => {
                const span = document.createElement("span")
                span.className = `px-2 py-1 rounded ${p.required ? "bg-red-900 text-red-200" : "bg-blue-900 text-blue-200"}`
                span.textContent = `${p.name} (${p.required ? "req" : "opt"})`
                paramsLine.appendChild(span)
            })
            item.appendChild(paramsLine)
        }
        if (s.isParam && s.param) {
            const t = document.createElement("div")
            t.className = `text-xs mt-2 px-2 py-1 rounded inline-block ${s.param.required ? "bg-red-900 text-red-200" : "bg-green-900 text-green-200"}`
            t.textContent = `${s.param.required ? "Requerido" : "Opcional"} • ${s.param.type}`
            item.appendChild(t)
        }
        item.addEventListener("click", () => handleSuggestionClick(s))
        suggestionBox.appendChild(item)
    })
    positionSuggestionBox()
    suggestionBox.classList.remove("hidden")
}

function positionSuggestionBox() {
    const boxParent = suggestionBoxContainer
    const rect = boxParent.getBoundingClientRect()
    suggestionBox.style.minWidth = Math.max(boxParent.clientWidth, 240) + "px"
    suggestionBox.style.left = "0px"
    suggestionBox.style.top = "0px"
    suggestionBox.classList.add("top-full")
}

function getNodeFromPath(path) {
    let node = commandsTree
    for (const p of path) {
        if (!node || !node[p]) return null
        node = node[p]
    }
    return node
}

function handleSuggestionClick(s) {
    if (s.isParam && s.param) {
        const tokens = userInput.slice(1).split(" ")
        tokens[tokens.length - 1] = s.text
        textarea.value = "/" + tokens.join(" ") + " "
        textarea.focus()
        textarea.dispatchEvent(new Event("input", { bubbles: true }))
        resetSuggestions()
        return
    }
    const clickedKey = s.text
    const node = getNodeFromPath([...pathStack, clickedKey])
    const hasChildren = node && Object.keys(node).some(k => k !== "description" && k !== "params" && typeof node[k] === "object")
    if (hasChildren) {
        pathStack.push(clickedKey)
        const newNode = {}
        Object.keys(node).forEach(k => {
            if (k !== "description" && k !== "params" && typeof node[k] === "object") newNode[k] = node[k]
        })
        const display = "/" + pathStack.join(" ")
        textarea.value = display + " "
        userInput = textarea.value
        textarea.focus()
        setTimeout(() => textarea.dispatchEvent(new Event("input", { bubbles: true })), 10)
        resetSuggestions()
        return
    }
    const display = s.display || ("/" + ([...pathStack, clickedKey].join(" ")))
    textarea.value = display + " "
    const leafNode = getNodeFromPath([...pathStack, clickedKey])
    if (leafNode && Array.isArray(leafNode.params) && leafNode.params.length) {
        showParameterChips(display, leafNode.params)
    } else {
        hideParameterChips()
    }
    textarea.focus()
    resetSuggestions()
}

function buildCommandSuggestions(node, lastToken) {
    const keys = Object.keys(node || {}).filter(k => k !== "description" && k !== "params" && typeof node[k] === "object")
    const list = keys
        .filter(k => k.toLowerCase().startsWith(lastToken.toLowerCase()))
        .map(k => {
            const obj = node[k] || {}
            const fullPath = [...pathStack, k].join(" ")
            const hasSub = Object.keys(obj).some(key => key !== "description" && key !== "params" && typeof obj[key] === "object")
            return { text: k, display: "/" + fullPath, description: obj.description || "Comando disponible", params: obj.params || [], hasSubcommands: hasSub }
        })
    suggestions = list
    openSuggestions()
}



//region update paramater
function updateParameterChipsPositionLeft() {
    const text = textarea.value
    let measure = document.getElementById("textMeasure")
    if (!measure) {
        measure = document.createElement("span")
        measure.id = "textMeasure"
        measure.className = "invisible absolute whitespace-pre text-sm"
        document.body.appendChild(measure)
    }
    measure.textContent = text

    const rect = textarea.getBoundingClientRect()
    parameterChips.style.position = "absolute"
    parameterChips.style.top = rect.top + window.scrollY - 84 + "px"
    parameterChips.style.left = rect.left + window.scrollX + measure.offsetWidth + 4 + "px"
    parameterChips.style.transform = "translateY(0)"
    parameterChips.style.pointerEvents = "auto"
}

async function showParameterChips(commandText, params) {
    activeCommand = commandText;
    activeParams = params;
    paramValues = {};
    parameterChips.innerHTML = "";

    updateParameterChipsPositionLeft();

    params.forEach((p, idx) => {
        const chip = document.createElement("div");
        chip.className = `inline-flex items-center space-x-1 ${p.required ? "bg-red-800 border-red-600" : "bg-blue-800 border-blue-600"} border rounded-md px-2 py-1 text-xs transition-all`;

        const label = document.createElement("label");
        label.className = `font-medium ${p.required ? "text-red-200" : "text-blue-200"}`;
        label.textContent = p.name;

        let input = document.createElement("input");
        input.type = "text";
        input.className = p.type === "user"
            ? "bg-transparent text-white text-xs w-32 focus:outline-none transition-all placeholder-gray-400 border-none"
            : "bg-transparent text-white text-xs w-20 focus:outline-none transition-all placeholder-gray-400 border-none";
        input.placeholder = p.type === "user" ? "Buscar usuario..." : (p.type === "number" ? "0" : "...");
        input.dataset.paramIndex = idx;
        input.dataset.paramName = p.name;
        input.dataset.required = p.required;
        if (p.type === "number") input.min = "1";

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";

        const listBox = document.createElement("div");
        listBox.className = "absolute bg-gray-700 text-white rounded shadow-xl mt-1 max-h-40 overflow-auto z-50 hidden";
        listBox.style.width = "100%";
        listBox.style.top = "100%";
        listBox.style.left = "0";

        if (p.type === "user") {
            const updateList = () => {
                const term = input.value.trim().toLowerCase();
                listBox.innerHTML = "";
                const matches = term === "" ? window.userNames : window.userNames.filter(u => u.toLowerCase().includes(term));
                matches.forEach(u => {
                    const item = document.createElement("div");
                    item.className = "px-2 py-1 hover:bg-gray-600 cursor-pointer text-xs";
                    item.textContent = u;
                    item.addEventListener("click", () => {
                        input.value = u;
                        paramValues[p.name] = u;
                        listBox.classList.add("hidden");
                        validateParameters();
                    });
                    listBox.appendChild(item);
                });
                listBox.classList.toggle("hidden", matches.length === 0);
            };

            input.addEventListener("input", updateList);
            input.addEventListener("focus", updateList);
            input.addEventListener("blur", () => setTimeout(() => listBox.classList.add("hidden"), 150));
            input.addEventListener("keydown", (ev) => {
                const items = Array.from(listBox.querySelectorAll("div"));
                const hasVisibleItems = items.length && !listBox.classList.contains("hidden");
                let activeIndex = items.findIndex(i => i.classList.contains("bg-gray-600"));

                if (ev.key === "ArrowDown") {
                    ev.preventDefault();
                    if (hasVisibleItems) {
                        if (activeIndex >= 0) items[activeIndex].classList.remove("bg-gray-600");
                        activeIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
                        items[activeIndex].classList.add("bg-gray-600");
                        items[activeIndex].scrollIntoView({ block: "nearest" });
                    }
                } else if (ev.key === "ArrowUp") {
                    ev.preventDefault();
                    if (hasVisibleItems) {
                        if (activeIndex >= 0) items[activeIndex].classList.remove("bg-gray-600");
                        activeIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
                        items[activeIndex].classList.add("bg-gray-600");
                        items[activeIndex].scrollIntoView({ block: "nearest" });
                    }
                } else if (ev.key === "Enter") {
                    ev.preventDefault();
                    if (hasVisibleItems && activeIndex >= 0) {
                        items[activeIndex].click();
                    } else {
                        sendCommandFromTextarea();
                    }
                } else if (ev.key === "Escape") {
                    listBox.classList.add("hidden");
                }
            });


        } else {
            input.addEventListener("input", () => {
                paramValues[p.name] = input.value;
                validateParameters();
            });
        }

        wrapper.appendChild(input);
        wrapper.appendChild(listBox);
        chip.appendChild(label);
        chip.appendChild(wrapper);
        parameterChips.appendChild(chip);
    });

    parameterChips.classList.remove("hidden");
    validateParameters();

    const firstInput = parameterChips.querySelector("input, select");
    if (firstInput) firstInput.focus();
}


//region chips
function hideParameterChips() {
    parameterChips.classList.add("hidden")
    activeCommand = null
    activeParams = []
    paramValues = {}
    validateParameters()
}

function validateParameters() {
    if (!activeParams || !activeParams.length) {
        enviarButton.disabled = false
        return
    }
    const missing = []
    activeParams.forEach(p => {
        if (p.required && (!paramValues[p.name] || String(paramValues[p.name]).trim() === "")) missing.push(p.name)
    })
    enviarButton.disabled = missing.length > 0
}



enviarButton.addEventListener("click", sendCommandFromTextarea)


textarea.addEventListener("keydown", (e) => {
    const paramInputs = Array.from(parameterChips.querySelectorAll("input"))

    if (e.key === "Tab" && paramInputs.length) {
        e.preventDefault()
        const currentIndex = paramInputs.indexOf(document.activeElement)
        const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1
        if (nextIndex >= 0 && nextIndex < paramInputs.length) {
            paramInputs[nextIndex].focus()
        } else {
            textarea.focus()
        }
        return
    }

    if (!suggestionBox.classList.contains("hidden") && suggestionBox.children.length) {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            selectedIndex = (selectedIndex + 1) % suggestionBox.children.length
            highlightSuggestion()
            return
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            selectedIndex = selectedIndex <= 0 ? suggestionBox.children.length - 1 : selectedIndex - 1
            highlightSuggestion()
            return
        } else if (e.key === "Enter") {
            e.preventDefault()
            if (selectedIndex >= 0 && suggestionBox.children[selectedIndex]) {
                suggestionBox.children[selectedIndex].click()
                selectedIndex = -1
                return
            }
        } else if (e.key === "Escape") {
            resetSuggestions()
            return
        }
    }

    if (e.key === "Enter" && textarea.value.trim().startsWith("/")) {
        console.log("enter")
        e.preventDefault()
        sendCommandFromTextarea()
    }
})

function sendCommandFromTextarea() {
    if (!activeCommand && !textarea.value.trim()) return;

    // Recoger todos los valores de los parámetros
    const paramInputs = Array.from(parameterChips.querySelectorAll("input"))
    paramInputs.forEach(input => {
        const name = input.dataset.paramName
        paramValues[name] = input.value
    })

    // Construir comando final
    let finalCmd = activeCommand || textarea.value
    if (activeCommand && activeParams.length) {
        activeParams.forEach(p => {
            const v = paramValues[p.name]
            if (v && String(v).trim() !== "") {
                const val = String(v).trim()
                finalCmd += val.includes(" ") ? ` %${val}%` : ` ${val}`
            }
        })
    }

    // Reset UI
    hideParameterChips()
    resetSuggestions()
    textarea.value = ""

    // Enviar con parsing correcto
    sendMessage(finalCmd)

    paramValues = {};
    parameterChips.innerHTML = "";
}




function highlightSuggestion() {
    Array.from(suggestionBox.children).forEach((el, idx) => {
        el.classList.toggle("bg-gray-600", idx === selectedIndex)
    })
}

document.addEventListener("click", (e) => {
    if (!textarea.contains(e.target) && !suggestionBox.contains(e.target) && !parameterChips.contains(e.target)) {
        resetSuggestions()
    }
})

const handleInput = debounce(async () => {
    if (!parameterChips.classList.contains("hidden")) updateParameterChipsPositionLeft()
    const raw = textarea.value
    userInput = raw

    if (!raw.startsWith("/")) {
        resetSuggestions()
        hideParameterChips()
        pathStack = []
        return
    }

    const rawTokens = raw.slice(1).split(" ")
    const tokens = rawTokens.filter(Boolean)
    const endsWithSpace = raw.endsWith(" ")
    const lastToken = endsWithSpace ? "" : tokens[tokens.length - 1] || ""
    let node = commandsTree
    let i = 0

    for (; i < tokens.length; i++) {
        const t = tokens[i]
        if (node && node[t]) {
            node = node[t]
        } else {
            break
        }
    }



    // Detectar subcomandos y mostrarlos
    const subKeys = Object.keys(node || {}).filter(
        k => k !== "description" && k !== "params" && !Array.isArray(node[k]) && typeof node[k] === "object"
    )

    if (subKeys.length) {
        const nodeForSuggestions = {}
        subKeys.forEach(k => nodeForSuggestions[k] = node[k])
        buildCommandSuggestions(nodeForSuggestions, lastToken)
        return
    }

    resetSuggestions()
}, 120)


textarea.addEventListener("input", handleInput)

loadCommands()
