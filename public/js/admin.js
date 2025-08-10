// Admin page functionality
(async function() {
    let allActivities = [];
    let filteredActivities = [];
    let allProducts = [];
    let filteredProducts = [];

    // Check if user is admin
    async function checkAdminAccess() {
        try {
            const response = await fetch('/api/admin/activities', {
                credentials: 'include'
            });

            if (response.status === 401) {
                alert('Please login to access admin panel');
                window.location.href = '/login.html';
                return false;
            }

            if (response.status === 403) {
                alert('Admin access required. Please login with admin credentials.');
                window.location.href = '/login.html';
                return false;
            }

            return true;
        } catch (err) {
            console.error('Access check failed:', err);
            alert('Failed to verify admin access');
            window.location.href = '/login.html';
            return false;
        }
    }

    // Load activities
    async function loadActivities(filter = '') {
        try {
            const response = await fetch(`/api/admin/activities?filter=${encodeURIComponent(filter)}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const activities = await response.json();
                
                if (filter) {
                    filteredActivities = activities;
                    displayActivities(filteredActivities);
                    document.getElementById('filteredCount').textContent = filteredActivities.length;
                } else {
                    allActivities = activities;
                    filteredActivities = activities;
                    displayActivities(allActivities);
                    document.getElementById('totalActivities').textContent = allActivities.length;
                    document.getElementById('filteredCount').textContent = allActivities.length;
                }
            }
        } catch (err) {
            console.error('Failed to load activities:', err);
            displayError('activitiesTableBody', 'Failed to load activities');
        }
    }

    // Display activities in table
    function displayActivities(activities) {
        const tableBody = document.getElementById('activitiesTableBody');
        if (!tableBody) return;

        if (activities.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">No activities found</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = '';

        // Sort activities by datetime (newest first)
        activities.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        activities.forEach(activity => {
            const row = document.createElement('tr');
            
            // Format datetime
            const date = new Date(activity.datetime);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            // Format activity type
            const activityType = formatActivityType(activity.type);
            
            // Format details
            const details = formatActivityDetails(activity.type, activity.details);
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td><strong>${activity.username}</strong></td>
                <td><span class="activity-type ${activity.type}">${activityType}</span></td>
                <td>${details}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Format activity type for display
    function formatActivityType(type) {
        const types = {
            'login': '🔐 Login',
            'logout': '🚪 Logout',
            'add-to-cart': '🛒 Add to Cart',
            'register': '📝 Register',
            'purchase': '💰 Purchase',
            'grooming-booking': '✂️ Grooming Booking'
        };
        return types[type] || type;
    }

    // Format activity details
    function formatActivityDetails(type, details) {
        if (!details || Object.keys(details).length === 0) {
            return '-';
        }

        switch(type) {
            case 'add-to-cart':
                return `Product ID: ${details.productId}, Quantity: ${details.quantity || 1}`;
            case 'grooming-booking':
                return `Pet: ${details.petType}, Service: ${details.service}`;
            case 'purchase':
                return `Order ID: ${details.orderId}, Total: $${details.total}`;
            default:
                return JSON.stringify(details);
        }
    }

    // Load products for management
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                allProducts = await response.json();
                filteredProducts = allProducts;
                displayProductsManagement(allProducts);
                document.getElementById('productCount').textContent = allProducts.length;
            }
        } catch (err) {
            console.error('Failed to load products:', err);
            displayError('productsManagement', 'Failed to load products');
        }
    }

    // Display products management section
    function displayProductsManagement(products) {
        const container = document.getElementById('productsManagement');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<p>No products available</p>';
            return;
        }

        container.innerHTML = '';

        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'admin-product-item';
            productDiv.innerHTML = `
                <div class="product-info">
                    <img src="${product.image || '/images/placeholder.jpg'}" alt="${product.name}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <strong>${product.name}</strong>
                        <span class="category-badge">${product.category}</span>
                        <br>
                        <small>${product.description}</small>
                        <br>
                        <span class="price">$${product.price}</span> | 
                        <span>Stock: ${product.stock}</span>
                    </div>
                </div>
                <button onclick="removeProduct('${product.id}')" class="btn btn-danger">
                    🗑️ Remove
                </button>
            `;
            container.appendChild(productDiv);
        });
    }

    // Filter activities
    window.filterActivities = function() {
        const filterInput = document.getElementById('activityFilter');
        if (filterInput) {
            const filter = filterInput.value.trim();
            loadActivities(filter);
        }
    };

    // Clear filter
    window.clearFilter = function() {
        const filterInput = document.getElementById('activityFilter');
        if (filterInput) {
            filterInput.value = '';
            loadActivities('');
        }
    };

    // Refresh activities
    window.refreshActivities = function() {
        const filterInput = document.getElementById('activityFilter');
        const filter = filterInput ? filterInput.value.trim() : '';
        loadActivities(filter);
    };

    // Filter products by category
    window.filterProducts = function() {
        const categoryFilter = document.getElementById('categoryFilter');
        const category = categoryFilter.value;
        
        if (category === 'all') {
            filteredProducts = allProducts;
        } else {
            filteredProducts = allProducts.filter(p => p.category === category);
        }
        
        displayProductsManagement(filteredProducts);
    };

    // Add new product
    window.addProduct = async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert('Product added successfully!');
                form.reset();
                loadProducts(); // Reload products
            } else {
                const error = await response.json();
                alert('Failed to add product: ' + error.error);
            }
        } catch (err) {
            console.error('Error adding product:', err);
            alert('Failed to add product. Please try again.');
        }
    };

    // Remove product
    window.removeProduct = async function(productId) {
        if (!confirm('Are you sure you want to remove this product? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('Product removed successfully!');
                loadProducts(); // Reload products
            } else {
                const error = await response.json();
                alert('Failed to remove product: ' + error.error);
            }
        } catch (err) {
            console.error('Error removing product:', err);
            alert('Failed to remove product. Please try again.');
        }
    };

    // Export activities to CSV
    window.exportActivities = function() {
        if (filteredActivities.length === 0) {
            alert('No activities to export');
            return;
        }

        // Create CSV content
        let csv = 'DateTime,Username,Type,Details\n';
        
        filteredActivities.forEach(activity => {
            const date = new Date(activity.datetime);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const details = JSON.stringify(activity.details || {}).replace(/"/g, '""');
            
            csv += `"${formattedDate}","${activity.username}","${activity.type}","${details}"\n`;
        });

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `activities_export_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Display error message
    function displayError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: red;">
                        ⚠️ ${message}
                    </td>
                </tr>
            `;
        }
    }

    // Initialize
    if (localStorage.getItem('isAdmin') !== 'true') {
    alert('Admin access required.');
    window.location.href = '/login.html';
    return;
}
    document.addEventListener('DOMContentLoaded', async () => {
        const isAdmin = await checkAdminAccess();
        if (isAdmin) {
            // Load initial data
            loadActivities();
            loadProducts();

            // Set up form submission
            const productForm = document.getElementById('addProductForm');
            if (productForm) {
                productForm.addEventListener('submit', addProduct);
            }

            // Auto-refresh activities every 30 seconds
            setInterval(() => {
                refreshActivities();
            }, 30000);
        }
    });
})();