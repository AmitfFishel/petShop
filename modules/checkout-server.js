const persistModule = require('./persist_module');

const processCheckout = async (req, res) => {
    try {
        const cart = await persistModule.getCart(req.user.username);
        
        if (cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        
        // Calculate total
        const total = cart.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);
        
        res.json({
            items: cart,
            total,
            message: 'Ready for payment'
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Checkout failed' });
    }
};

const processPayment = async (req, res) => {
    try {
        const { cardNumber, cardName, expiryDate, cvv } = req.body;
        
        // Validate payment details (basic validation)
        if (!cardNumber || !cardName || !expiryDate || !cvv) {
            return res.status(400).json({ error: 'All payment fields required' });
        }
        
        // Get cart items
        const cart = await persistModule.getCart(req.user.username);
        
        if (cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        
        // Create purchase record
        const purchaseItems = cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        }));
        
        const purchase = await persistModule.createPurchase(
            req.user.username,
            purchaseItems,
            { cardNumber, cardName, expiryDate }
        );
        
        // Clear cart after successful payment
        await persistModule.clearCart(req.user.username);
        
        res.json({
            message: 'Payment successful',
            purchaseId: purchase.id,
            total: purchase.total
        });
    } catch (err) {
        console.error('Payment error:', err);
        res.status(500).json({ error: 'Payment failed' });
    }
};

const getPurchases = async (req, res) => {
    try {
        const purchases = await persistModule.getPurchases(req.user.username);
        res.json(purchases);
    } catch (err) {
        console.error('Error getting purchases:', err);
        res.status(500).json({ error: 'Failed to get purchases' });
    }
};

module.exports = {
    processCheckout,
    processPayment,
    getPurchases
};