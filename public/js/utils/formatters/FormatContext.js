export class FormatContext {
    constructor(messageObject, appState, isHistory = false) {
        this.originalText = (messageObject.message ||"").trim();
        this.messageObject = messageObject;
        this.appState = appState;
        this.isHistory = isHistory;
        this.metadata = {
            mentionsCurrentUser: false
        };
    }
}