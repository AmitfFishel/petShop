const persistModule = require('./persist_module');

const getActivities = async (req, res) => {
    try {
        const { filter } = req.query;
        const activities = await persistModule.getActivities(filter || '');
        res.json(activities);
    } catch (err) {
        console.error('Error getting activities:', err);
        res.status(500).json({ error: 'Failed to get activities' });
    }
};

const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;
        
        if (!name || !description || !price) {
            return res.status(400).json({ error: 'Name, description, and price required' });
        }
        
        const product = await persistModule.addProduct({
            name,
            description,
            price: parseFloat(price),
            category: category || 'General',
            stock: parseInt(stock) || 10,
            image
        });
        
        res.json({ message: 'Product added', product });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Failed to add product' });
    }
};

const removeProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await persistModule.removeProduct(id);
        res.json({ message: 'Product removed' });
    } catch (err) {
        console.error('Error removing product:', err);
        res.status(500).json({ error: 'Failed to remove product' });
    }
};

module.exports = {
    getActivities,
    addProduct,
    removeProduct
};