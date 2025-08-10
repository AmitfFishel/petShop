const persistModule = require('./persist_module');
const path = require('path');


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
        const { name, description, price, category, stock, imageUrl } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : imageUrl;
        
        if (!name || !description || !price || !category) {
            return res.status(400).json({ error: 'Name, description, price, and category are required' });
        }
        
        const productData = {
            name,
            description,
            price: parseFloat(price),
            category,
            stock: parseInt(stock) || 10,
            image: image || '/images/placeholder.jpg',
            petInfo: {
                category,
                available: true
            }
        };
        
        const product = await persistModule.addProduct(productData);
        res.json({ message: 'Product added successfully', product });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Failed to add product' });
    }
};

const removeProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'Product ID required' });
        }
        
        await persistModule.removeProduct(id);
        res.json({ message: 'Product removed successfully' });
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