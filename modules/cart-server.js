const persistModule = require('./persist_module');

const getCart = async (req, res) => {
    try {
        const cart = await persistModule.getCart(req.user.username);
        res.json(cart);
    } catch (err) {
        console.error('Error getting cart:', err);
        res.status(500).json({ error: 'Failed to get cart' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        if (!productId) {
            return res.status(400).json({ error: 'Product ID required' });
        }
        
        const cart = await persistModule.addToCart(req.user.username, productId, quantity);
        res.json({ message: 'Added to cart', cart });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const cart = await persistModule.removeFromCart(req.user.username, productId);
        res.json({ message: 'Removed from cart', cart });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart
};