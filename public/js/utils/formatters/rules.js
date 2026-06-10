//region Emoji Rule
export const EmojiRule = (text, context) => {
    let newText = text;
    context.appState.emojiCache.forEach((emoji) => {
        const normalRegex = new RegExp(`:${emoji.name}:`, 'g');
        const stickerRegex = new RegExp(`;${emoji.name};`, 'g');
        
        const normalHtml = `<img src="${emoji.url}" width="50" class="inline-block" alt="${emoji.name}">`;
        const stickerHtml = `<img src="${emoji.url}" width="200" class="inline-block" alt="${emoji.name}">`;
        
        newText = newText.replace(normalRegex, normalHtml).replace(stickerRegex, stickerHtml);
    });
    return newText;
};

//region Markdown Code
export const MarkdownAndCodeRule = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map(part => {
        if (part.startsWith("```") && part.endsWith("```")) {
            const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
            const lang = match[1] || "plaintext";
            const safeCode = match[2].replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre class="bg-gray-900 text-sm rounded-lg p-3 overflow-x-auto"><code class="language-${lang}">${safeCode}</code></pre>`;
        }
        
        return part
            .replace(/`([^`\n]+?)`/g, (_, code) => {
                const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<code class="bg-gray-800 text-green-400 px-1 rounded">${safeCode}</code>`;
            })
            // Negrita e Itálica
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Spoilers
            .replace(/\|\| (.*?) \|\|/g, `<span class="hidden-message cursor-pointer text-blue-500">[Mostrar]</span><span class="actual-message hidden">$1</span>`);
    }).join('');
};

//region List Rule
export const ListRule = (text) => {
    return text.replace(/(?:^- (.*?)(?:\n|$))+/gm, (match) => {
        const listItems = match.trim().split('\n')
            .map(item => `<li>${item.slice(2)}</li>`)
            .join('');
        return `<ul class="list-disc pl-5">${listItems}</ul>`;
    });
};

//region Mention Rule
export const MentionRule = (text, context) => {
    const mentionRegex = /@([^\s]+)/g;
    
    return text.replace(mentionRegex, (match, username) => {
        if (context.appState.userNames.includes(username)) {
            if (username === context.appState.currentUser && !context.isHistory) {
                context.metadata.mentionsCurrentUser = true;
            }
            return `<span class="text-yellow-400">${match}</span>`;
        }
        return match;
    });
};

//region Line Break Rule
export const LineBreakRule = (text) => {
    if (text.includes('<ul') || text.includes('<ol')) {
        return text; 
    }
    
    const parts = text.split(/(<pre[\s\S]*?<\/pre>)/g);
    return parts.map(part => {
        if (part.startsWith('<pre')) {
            return part;
        }
        return part.replaceAll('\n', '<br>');
    }).join('');
};


//region Reply Rule
export const ReplyRule = (text, context) => {
    const reply = context.messageObject.reply;
    if (!reply) return text;

    const preview = reply.replyMessage.slice(0, 40);
    const replyHtml = `<div class="text-sm text-gray-400 mb-1 border-l-2 border-gray-500 pl-2">Respondiendo a ${reply.replyUser}: ${preview}...</div>`;
    
    return `${replyHtml}${text}`;
};