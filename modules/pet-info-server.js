const persistModule = require('./persist_module');

const getPetInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await persistModule.getProductById(id);
        
        if (!product) {
            return res.status(404).json({ error: 'Pet not found' });
        }
        
        // Return detailed pet information
        res.json({
            ...product,
            careInstructions: getCareInstructions(product.category),
            relatedProducts: await getRelatedProducts(product.category, product.id)
        });
    } catch (err) {
        console.error('Error getting pet info:', err);
        res.status(500).json({ error: 'Failed to get pet info' });
    }
};

const getPetCareTips = async (req, res) => {
    try {
        const tips = {
            dogs: [
                'Regular exercise is essential for dogs',
                'Provide fresh water at all times',
                'Regular vet checkups are important',
                'Socialization from young age is crucial'
            ],
            cats: [
                'Cats need mental stimulation through play',
                'Keep litter box clean',
                'Regular grooming prevents hairballs',
                'Provide scratching posts'
            ],
            fish: [
                'Maintain proper water temperature',
                'Regular water changes are essential',
                'Don\'t overfeed your fish',
                'Monitor pH levels regularly'
            ],
            birds: [
                'Provide variety in diet',
                'Ensure adequate cage space',
                'Social interaction is important',
                'Regular wing trimming may be needed'
            ],
            smallPets: [
                'Provide appropriate bedding',
                'Ensure proper ventilation',
                'Regular cage cleaning is essential',
                'Monitor for signs of illness'
            ]
        };
        
        res.json(tips);
    } catch (err) {
        console.error('Error getting pet care tips:', err);
        res.status(500).json({ error: 'Failed to get pet care tips' });
    }
};

const getAdoptionInfo = async (req, res) => {
    try {
        const info = {
            process: [
                'Browse available pets',
                'Submit adoption application',
                'Meet and greet session',
                'Home visit (for some pets)',
                'Finalize adoption',
                'Post-adoption support'
            ],
            requirements: {
                age: 'Must be 21 or older',
                housing: 'Pet-friendly accommodation',
                experience: 'Prior pet experience preferred',
                commitment: 'Long-term commitment required'
            },
            fees: {
                dogs: '$200-$500',
                cats: '$100-$300',
                smallPets: '$50-$150',
                birds: '$100-$400'
            }
        };
        
        res.json(info);
    } catch (err) {
        console.error('Error getting adoption info:', err);
        res.status(500).json({ error: 'Failed to get adoption info' });
    }
};

const bookGrooming = async (req, res) => {
    try {
        const { petType, service, date, time } = req.body;
        
        if (!petType || !service || !date || !time) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        // Store grooming appointment (you could extend persist_module for this)
        const appointment = {
            id: 'grooming-' + Date.now(),
            username: req.user.username,
            petType,
            service,
            date,
            time,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        // Log activity
        await persistModule.logActivity(req.user.username, 'grooming-booking', appointment);
        
        res.json({
            message: 'Grooming appointment booked',
            appointment
        });
    } catch (err) {
        console.error('Error booking grooming:', err);
        res.status(500).json({ error: 'Failed to book grooming' });
    }
};

// Helper functions
function getCareInstructions(category) {
    const instructions = {
        'Dogs': 'Feed twice daily, provide fresh water, daily exercise, regular grooming',
        'Cats': 'Feed according to age, clean litter daily, provide toys, regular vet visits',
        'Fish': 'Feed once or twice daily, maintain water temperature, regular water changes',
        'Birds': 'Fresh food and water daily, cage cleaning weekly, social interaction',
        'Small Pets': 'Fresh food and water daily, cage cleaning regularly, handling with care'
    };
    
    return instructions[category] || 'Provide proper care according to species needs';
}

async function getRelatedProducts(category, excludeId) {
    const allProducts = await persistModule.getProducts();
    return allProducts
        .filter(p => p.category === category && p.id !== excludeId)
        .slice(0, 3);
}

module.exports = {
    getPetInfo,
    getPetCareTips,
    getAdoptionInfo,
    bookGrooming
};