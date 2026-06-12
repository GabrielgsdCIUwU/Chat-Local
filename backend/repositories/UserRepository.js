export class UserRepository {
    constructor(dbClient) {
        this.db = dbClient;
    }

    async findAll() {
        return await this.db.read();
    }

    async findByName(name) {
        const users = await this.findAll();
        return users.find(u => u.name === name);
    }

    async save(user) {
        await this.db.update((users) => {
            const index = users.findIndex(u => u.name === user.name);
            if (index !== -1) {
                users[index] = user;
            } else {
                users.push(user);
            }

            return users;
        });
    }
}