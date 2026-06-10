import { FormatContext } from "./formatters/FormatContext.js";
import {
    EmojiRule,
    MarkdownAndCodeRule,
    ListRule,
    MentionRule,
    LineBreakRule,
}  from './formatters/rules.js';

export class MessageFormatter {
    constructor(appState) {
        this.appState = appState;
        
        this.rules = [
            EmojiRule,
            MarkdownAndCodeRule,
            ListRule,
            MentionRule,
            LineBreakRule,
        ];
    }

    /**
     * @returns {Object} { formattedText: string, metadata: Object }
     */
    format(msgObj, isHistory = false) {
        const context = new FormatContext(msgObj, this.appState, isHistory);
        let processedText = context.originalText;

        for (const rule of this.rules) {
            processedText = rule(processedText, context);
        }

        return {
            formattedText: processedText,
            metadata: context.metadata
        };
    }
}