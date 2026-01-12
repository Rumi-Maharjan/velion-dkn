class User {
    constructor({ userId, email, name, role, region }) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role; // Consultant | KnowledgeChampion | SystemAdmin
        this.region = region;
    }
}
module.exports = User;
