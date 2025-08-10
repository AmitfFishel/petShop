const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

class PersistModule {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.usersFile = path.join(this.dataDir, 'users.json');
        this.productsFile = path.join(this.dataDir, 'products.json');
        this.activitiesFile = path.join(this.dataDir, 'activities.json');
        
        this.users = [];
        this.products = [];
        this.activities = [];
        this.sessions = {};
    }

    async init() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Load existing data
            await this.loadUsers();
            await this.loadProducts();
            await this.loadActivities();
            
            // Create admin user if doesn't exist
            await this.createAdminIfNotExists();
            
            // Initialize default products if empty
            if (this.products.length === 0) {
                await this.initializeDefaultProducts();
            }
        } catch (err) {
            console.error('Error initializing persist module:', err);
            throw err;
        }
    }

    async loadUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf8');
            this.users = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.users = [];
                await this.saveUsers();
            } else {
                throw err;
            }
        }
    }

    async saveUsers() {
        try {
            await fs.writeFile(this.usersFile, JSON.stringify(this.users, null, 2));
        } catch (err) {
            console.error('Error saving users:', err);
            throw err;
        }
    }

    async loadProducts() {
        try {
            const data = await fs.readFile(this.productsFile, 'utf8');
            this.products = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.products = [];
                await this.saveProducts();
            } else {
                throw err;
            }
        }
    }

    async saveProducts() {
        try {
            await fs.writeFile(this.productsFile, JSON.stringify(this.products, null, 2));
        } catch (err) {
            console.error('Error saving products:', err);
            throw err;
        }
    }

    async loadActivities() {
        try {
            const data = await fs.readFile(this.activitiesFile, 'utf8');
            this.activities = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.activities = [];
                await this.saveActivities();
            } else {
                throw err;
            }
        }
    }

    async saveActivities() {
        try {
            await fs.writeFile(this.activitiesFile, JSON.stringify(this.activities, null, 2));
        } catch (err) {
            console.error('Error saving activities:', err);
            throw err;
        }
    }

    async createAdminIfNotExists() {
        const adminExists = this.users.some(u => u.username === 'admin');
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            const admin = {
                id: 'admin-001',
                username: 'admin',
                password: hashedPassword,
                email: 'admin@petstore.com',
                cart: [],
                purchases: [],
                createdAt: new Date().toISOString()
            };
            this.users.push(admin);
            await this.saveUsers();
        }
    }

    async initializeDefaultProducts() {
        this.products = [
            {
                id: 'pet-001',
                name: 'Golden Retriever Puppy',
                description: 'Friendly and loyal companion, 8 weeks old',
                price: 1200,
                category: 'Dogs',
                image: '/images/golden-retriever.jpg',
                stock: 3,
                petInfo: {
                    breed: 'Golden Retriever',
                    age: '8 weeks',
                    weight: '5 kg',
                    vaccinated: true,
                    temperament: 'Friendly, Intelligent, Devoted'
                }
            },
            {
                id: 'pet-002',
                name: 'Persian Cat',
                description: 'Beautiful long-haired cat, very calm',
                price: 800,
                category: 'Cats',
                image: '/images/persian-cat.jpg',
                stock: 5,
                petInfo: {
                    breed: 'Persian',
                    age: '12 weeks',
                    weight: '2 kg',
                    vaccinated: true,
                    temperament: 'Calm, Sweet, Gentle'
                }
            },
            {
                id: 'pet-003',
                name: 'Tropical Fish Tank Set',
                description: 'Complete aquarium with 10 tropical fish',
                price: 250,
                category: 'Fish',
                image: '/images/fish-tank.jpg',
                stock: 10,
                petInfo: {
                    species: 'Mixed Tropical',
                    tankSize: '50 gallons',
                    included: 'Tank, Filter, Heater, 10 Fish',
                    difficulty: 'Beginner'
                }
            },
            {
                id: 'pet-004',
                name: 'Cockatiel',
                description: 'Friendly bird, great for beginners',
                price: 150,
                category: 'Birds',
                image: '/images/cockatiel.jpg',
                stock: 7,
                petInfo: {
                    species: 'Cockatiel',
                    age: '6 months',
                    wingspan: '30 cm',
                    lifespan: '15-20 years',
                    temperament: 'Social, Playful'
                }
            },
            {
                id: 'pet-005',
                name: 'Holland Lop Rabbit',
                description: 'Small, friendly rabbit with floppy ears',
                price: 120,
                category: 'Small Pets',
                image: '/images/holland-lop.jpg',
                stock: 8,
                petInfo: {
                    breed: 'Holland Lop',
                    age: '10 weeks',
                    weight: '1.5 kg',
                    lifespan: '7-10 years',
                    temperament: 'Gentle, Friendly'
                }
            }
        ];
        await this.saveProducts();
    }

    // User methods
    async createUser(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = {
            id: 'user-' + Date.now(),
            username: userData.username,
            password: hashedPassword,
            email: userData.email,
            cart: [],
            purchases: [],
            createdAt: new Date().toISOString()
        };
        this.users.push(user);
        await this.saveUsers();
        return user;
    }

    async getUserByUsername(username) {
        return this.users.find(u => u.username === username);
    }

    async getUserByToken(token) {
        const session = this.sessions[token];
        if (!session) return null;
        
        // Check if session expired
        if (session.expiresAt < Date.now()) {
            delete this.sessions[token];
            return null;
        }
        
        return await this.getUserByUsername(session.username);
    }

    async createSession(username, rememberMe) {
        const token = 'token-' + Date.now() + '-' + Math.random();
        const expiresIn = rememberMe ? 12 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000; // 12 days or 30 minutes
        
        this.sessions[token] = {
            username,
            expiresAt: Date.now() + expiresIn
        };
        
        return token;
    }

    async deleteSession(token) {
        delete this.sessions[token];
    }

    // Cart methods
    async addToCart(username, productId, quantity) {
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        
        const product = this.products.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');
        
        const existingItem = user.cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({ productId, quantity });
        }
        
        await this.saveUsers();
        await this.logActivity(username, 'add-to-cart', { productId, quantity });
        return user.cart;
    }

    async removeFromCart(username, productId) {
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        
        user.cart = user.cart.filter(item => item.productId !== productId);
        await this.saveUsers();
        return user.cart;
    }

    async getCart(username) {
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        
        // Populate cart with product details
        const cartWithDetails = user.cart.map(item => {
            const product = this.products.find(p => p.id === item.productId);
            return {
                ...item,
                product
            };
        });
        
        return cartWithDetails;
    }

    async clearCart(username) {
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        
        user.cart = [];
        await this.saveUsers();
    }

    // Purchase methods
    async createPurchase(username, items, paymentDetails) {
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        
        const purchase = {
            id: 'purchase-' + Date.now(),
            items,
            total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            paymentDetails: {
                ...paymentDetails,
                cardNumber: paymentDetails.cardNumber.slice(-4) // Store only last 4 digits
            },
            date: new Date().toISOString()
        };
        
        user.purchases.push(purchase);
        await this.saveUsers();
        return purchase;
    }

    async getPurchases(username) {
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        
        return user.purchases;
    }

    // Product methods
    async getProducts() {
        return this.products;
    }

    async getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    async searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery)
        );
    }

    async addProduct(productData) {
        const product = {
            id: 'pet-' + Date.now(),
            ...productData,
            createdAt: new Date().toISOString()
        };
        this.products.push(product);
        await this.saveProducts();
        return product;
    }

    async removeProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        await this.saveProducts();
    }

    // Activity logging
    async logActivity(username, type, details = {}) {
        const activity = {
            datetime: new Date().toISOString(),
            username,
            type,
            details
        };
        this.activities.push(activity);
        await this.saveActivities();
    }

    async getActivities(usernameFilter = '') {
        if (usernameFilter) {
            return this.activities.filter(a => 
                a.username.toLowerCase().startsWith(usernameFilter.toLowerCase())
            );
        }
        return this.activities;
    }
}

module.exports = new PersistModule();