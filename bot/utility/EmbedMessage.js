export class EmbedMessage {
    constructor() {
        this.fields = [];
    }
    addField(name, value) {
        this.fields.push({ name, value });
        return this;
    }

    toString() {
        return this.fields.map(field => `**${field.name}:** ${field.value}`).join("\n");
    }
}