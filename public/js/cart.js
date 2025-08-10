// Cart page functionality
(async function() {
    let cart = [];
    let total = 0;

    // Load cart on page load
    async function loadCart() {
        try {
            const response = await fetch('/api/cart', {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }

            if (response.ok) {
                cart = await response.json();
                displayCart();
            }
        } catch (err) {
            console.error('Failed to load cart:', err);
        }
    }

    // Display cart items
    function displayCart() {
        const cartContainer = document.getElementById('cartItems');
        const totalElement = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!cartContainer) return;

        if (cart.length === 0) {
            cartContainer.innerHTML = '<p>Your cart is empty</p>';
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (totalElement) totalElement.textContent = 'Total: $0';
            return;
        }

        cartContainer.innerHTML = '';
        total = 0;

        cart.forEach(item => {
            if (!item.product) return;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            const itemTotal = item.product.price * item.quantity;
            total += itemTotal;

            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <img src="${item.product.image || '/images/placeholder.jpg'}" alt="${item.product.name}">
                    <div>
                        <h3>${item.product.name}</h3>
                        <p>${item.product.description}</p>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: $${item.product.price}</p>
                    <p>Subtotal: $${itemTotal.toFixed(2)}</p>
                    <button onclick="removeFromCart('${item.product.id}')" class="btn btn-danger">Remove</button>
                </div>
            `;
            
            cartContainer.appendChild(itemElement);
        });

        if (totalElement) {
            totalElement.textContent = `Total: $${total.toFixed(2)}`;
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }
    }

    // Remove item from cart
    window.removeFromCart = async function(productId) {
        try {
            const response = await fetch(`/api/cart/remove/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('Item removed from cart');
                loadCart(); // Reload cart
            } else {
                alert('Failed to remove item');
            }
        } catch (err) {
            console.error('Error removing item:', err);
            alert('Failed to remove item');
        }
    };

    // Proceed to checkout
    window.proceedToCheckout = async function() {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                // Store checkout data in sessionStorage for payment page
                sessionStorage.setItem('checkoutData', JSON.stringify(result));
                window.location.href = '/payment.html';
            } else {
                const error = await response.json();
                alert('Checkout failed: ' + (error.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Checkout failed. Please try again.');
        }
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        loadCart();
    });
})();