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

// assuming route uses upload.single('image')
const addProduct = async (req, res) => {
  try {
    const { name, description, price, imageUrl } = req.body;

    // prefer uploaded file; fallback to URL field
    let finalImageUrl = imageUrl && imageUrl.trim();
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`; // <-- web path, not filesystem path
    }
    if (!finalImageUrl) finalImageUrl = '/images/placeholder.png';

    const product = {
      id: Date.now().toString(),
      name,
      description,
      price: Number(price),
      imageUrl: finalImageUrl
    };

    await persistModule.addProduct(product);
    return res.json(product);
  } catch (e) {
    console.error(e);
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