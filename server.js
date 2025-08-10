const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');

// Import modules
const authModule = require('./modules/auth-server');
const storeModule = require('./modules/store-server');
const cartModule = require('./modules/cart-server');
const checkoutModule = require('./modules/checkout-server');
const adminModule = require('./modules/admin-server');
const petInfoModule = require('./modules/pet-info-server');
const persistModule = require('./modules/persist_module');

const app = express();
const PORT = 3000;

// DOS attack prevention
const requestCounts = {};
const RATE_LIMIT = 100; // requests per minute
const TIME_WINDOW = 60000; // 1 minute

// Middleware for DOS protection
const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requestCounts[ip]) {
        requestCounts[ip] = { count: 1, startTime: now };
    } else {
        if (now - requestCounts[ip].startTime > TIME_WINDOW) {
            requestCounts[ip] = { count: 1, startTime: now };
        } else {
            requestCounts[ip].count++;
            if (requestCounts[ip].count > RATE_LIMIT) {
                return res.status(429).json({ error: 'Too many requests' });
            }
        }
    }
    next();
};

// Middleware setup
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Initialize data on server start
(async () => {
    try {
        await persistModule.init();
        console.log('Data loaded from disk');
    } catch (err) {
        console.error('Error initializing data:', err);
    }
})();

// Authentication middleware
const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await persistModule.getUserByToken(token);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
    if (req.user && req.user.username === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Routes - Authentication
app.post('/api/register', authModule.register);
app.post('/api/login', authModule.login);
app.post('/api/logout', requireAuth, authModule.logout);

// Routes - Store
app.get('/api/products', storeModule.getProducts);
app.get('/api/products/search', storeModule.searchProducts);
app.get('/api/products/:id', storeModule.getProductById);

// Routes - Cart
app.get('/api/cart', requireAuth, cartModule.getCart);
app.post('/api/cart/add', requireAuth, cartModule.addToCart);
app.delete('/api/cart/remove/:productId', requireAuth, cartModule.removeFromCart);

// Routes - Checkout
app.post('/api/checkout', requireAuth, checkoutModule.processCheckout);
app.post('/api/payment', requireAuth, checkoutModule.processPayment);
app.get('/api/purchases', requireAuth, checkoutModule.getPurchases);

// Routes - Admin
app.get('/api/admin/activities', requireAuth, requireAdmin, adminModule.getActivities);
app.post('/api/admin/products', requireAuth, requireAdmin, upload.single('image'), adminModule.addProduct);
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, adminModule.removeProduct);

// Routes - Pet Info (Extra Pages)
app.get('/api/pets/:id/info', petInfoModule.getPetInfo);
app.get('/api/pet-care-tips', petInfoModule.getPetCareTips);
app.get('/api/adoption-info', petInfoModule.getAdoptionInfo);
app.post('/api/grooming-appointment', requireAuth, petInfoModule.bookGrooming);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Pet Store server running on http://localhost:${PORT}`);
});

module.exports = app;