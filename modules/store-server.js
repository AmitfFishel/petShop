const persistModule = require('./persist_module');

const getProducts = async (req, res) => {
    try {
        const products = await persistModule.getProducts();
        res.json(products);
    } catch (err) {
        console.error('Error getting products:', err);
        res.status(500).json({ error: 'Failed to get products' });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            const products = await persistModule.getProducts();
            return res.json(products);
        }
        
        const products = await persistModule.searchProducts(q);
        res.json(products);
    } catch (err) {
        console.error('Error searching products:', err);
        res.status(500).json({ error: 'Search failed' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await persistModule.getProductById(id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (err) {
        console.error('Error getting product:', err);
        res.status(500).json({ error: 'Failed to get product' });
    }
};

module.exports = {
    getProducts,
    searchProducts,
    getProductById
};