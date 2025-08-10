// Store page functionality
(async function() {
    let products = [];
    let cart = [];

    // Load products on page load
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                products = await response.json();
                displayProducts(products);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    }

    // Display products in grid
    function displayProducts(productsToShow) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        
        productsToShow.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image || '/images/placeholder.jpg'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">$${product.price}</p>
                <p>Stock: ${product.stock}</p>
                <button onclick="addToCart('${product.id}')">Add to Cart</button>
                <a href="/pet-info.html?id=${product.id}" style="display:block; text-align:center; margin-top:10px;">View Details</a>
            `;
            grid.appendChild(card);
        });
    }

    // Add to cart function
    window.addToCart = async function(productId) {
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity: 1 }),
                credentials: 'include'
            });

            if (response.status === 401) {
                // Not logged in, redirect to login
                window.location.href = '/login.html';
                return;
            }

            if (response.ok) {
                alert('Added to cart!');
                updateCartCount();
            } else {
                const error = await response.json();
                alert('Failed to add to cart: ' + error.error);
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert('Failed to add to cart');
        }
    };

    // Update cart count in nav
    async function updateCartCount() {
        try {
            const response = await fetch('/api/cart', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const cart = await response.json();
                const count = cart.reduce((sum, item) => sum + item.quantity, 0);
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    cartCount.textContent = `(${count})`;
                }
            }
        } catch (err) {
            console.error('Failed to update cart count:', err);
        }
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchBtn) {
        searchBtn.onclick = async () => {
            const query = searchInput.value.trim();
            
            try {
                const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const results = await response.json();
                    displayProducts(results);
                }
            } catch (err) {
                console.error('Search failed:', err);
            }
        };
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        loadProducts();
        updateCartCount();
    });
})();