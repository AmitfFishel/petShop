const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testsPassed = 0;
let totalTests = 0;

// Test utility functions
async function runTest(testName, testFunc) {
    totalTests++;
    console.log(`\nRunning test: ${testName}`);
    try {
        await testFunc();
        console.log(`✓ ${testName} PASSED`);
        testsPassed++;
    } catch (err) {
        console.error(`✗ ${testName} FAILED:`, err.message);
    }
}

// Test cases
async function testRegister() {
    const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'testuser' + Date.now(),
            password: 'testpass123',
            email: 'test@example.com'
        })
    });
    
    if (!response.ok) throw new Error('Registration failed');
    const data = await response.json();
    if (!data.userId) throw new Error('No user ID returned');
}

async function testLogin() {
    // First create a user
    const username = 'testuser' + Date.now();
    await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password: 'testpass123',
            email: 'test@example.com'
        })
    });

    // Then login
    const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password: 'testpass123',
            rememberMe: false
        })
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    // Extract cookie for subsequent requests
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
        authToken = cookies.split(';')[0];
    }
}

async function testAdminLogin() {
    const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin',
            rememberMe: false
        })
    });
    
    if (!response.ok) throw new Error('Admin login failed');
}

async function testGetProducts() {
    const response = await fetch(`${BASE_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to get products');
    
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Products should be an array');
    if (products.length === 0) throw new Error('No products found');
}

async function testSearchProducts() {
    const response = await fetch(`${BASE_URL}/api/products/search?q=dog`);
    if (!response.ok) throw new Error('Search failed');
    
    const results = await response.json();
    if (!Array.isArray(results)) throw new Error('Search results should be an array');
}

async function testAddToCartWithoutAuth() {
    const response = await fetch(`${BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: 'pet-001',
            quantity: 1
        })
    });
    
    if (response.status !== 401) throw new Error('Should return 401 when not authenticated');
}

async function testAddToCartWithAuth() {
    // First login
    await testLogin();
    
    const response = await fetch(`${BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': authToken
        },
        body: JSON.stringify({
            productId: 'pet-001',
            quantity: 1
        })
    });
    
    if (!response.ok) throw new Error('Failed to add to cart');
}

async function testGetCart() {
    const response = await fetch(`${BASE_URL}/api/cart`, {
        headers: { 'Cookie': authToken }
    });
    
    if (!response.ok) throw new Error('Failed to get cart');
    
    const cart = await response.json();
    if (!Array.isArray(cart)) throw new Error('Cart should be an array');
}

async function testRemoveFromCart() {
    const response = await fetch(`${BASE_URL}/api/cart/remove/pet-001`, {
        method: 'DELETE',
        headers: { 'Cookie': authToken }
    });
    
    if (!response.ok) throw new Error('Failed to remove from cart');
}

async function testCheckout() {
    // Add item to cart first
    await fetch(`${BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': authToken
        },
        body: JSON.stringify({
            productId: 'pet-001',
            quantity: 1
        })
    });

    const response = await fetch(`${BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': authToken
        }
    });
    
    if (!response.ok) throw new Error('Checkout failed');
}

async function testPayment() {
    const response = await fetch(`${BASE_URL}/api/payment`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': authToken
        },
        body: JSON.stringify({
            cardNumber: '1234567812345678',
            cardName: 'Test User',
            expiryDate: '12/25',
            cvv: '123'
        })
    });
    
    if (!response.ok) throw new Error('Payment failed');
}

async function testGetPurchases() {
    const response = await fetch(`${BASE_URL}/api/purchases`, {
        headers: { 'Cookie': authToken }
    });
    
    if (!response.ok) throw new Error('Failed to get purchases');
    
    const purchases = await response.json();
    if (!Array.isArray(purchases)) throw new Error('Purchases should be an array');
}

async function testAdminActivities() {
    // Login as admin first
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin',
            rememberMe: false
        })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    const adminToken = cookies ? cookies.split(';')[0] : '';

    const response = await fetch(`${BASE_URL}/api/admin/activities`, {
        headers: { 'Cookie': adminToken }
    });
    
    if (!response.ok) throw new Error('Failed to get admin activities');
    
    const activities = await response.json();
    if (!Array.isArray(activities)) throw new Error('Activities should be an array');
}

async function testLogout() {
    const response = await fetch(`${BASE_URL}/api/logout`, {
        method: 'POST',
        headers: { 'Cookie': authToken }
    });
    
    if (!response.ok) throw new Error('Logout failed');
}

async function testRateLimiting() {
    // Make many requests quickly to test rate limiting
    const promises = [];
    for (let i = 0; i < 150; i++) {
        promises.push(fetch(`${BASE_URL}/api/products`));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (!rateLimited) throw new Error('Rate limiting not working');
}

// Run all tests
async function runAllTests() {
    console.log('Starting Pet Store API Tests...\n');
    console.log('================================');
    
    await runTest('User Registration', testRegister);
    await runTest('User Login', testLogin);
    await runTest('Admin Login', testAdminLogin);
    await runTest('Get Products', testGetProducts);
    await runTest('Search Products', testSearchProducts);
    await runTest('Add to Cart (No Auth)', testAddToCartWithoutAuth);
    await runTest('Add to Cart (With Auth)', testAddToCartWithAuth);
    await runTest('Get Cart', testGetCart);
    await runTest('Remove from Cart', testRemoveFromCart);
    await runTest('Checkout Process', testCheckout);
    await runTest('Payment Processing', testPayment);
    await runTest('Get Purchases', testGetPurchases);
    await runTest('Admin Activities', testAdminActivities);
    await runTest('User Logout', testLogout);
    await runTest('Rate Limiting', testRateLimiting);
    
    console.log('\n================================');
    console.log(`Tests Completed: ${testsPassed}/${totalTests} passed`);
    console.log('================================\n');
    
    process.exit(testsPassed === totalTests ? 0 : 1);
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch(`${BASE_URL}/api/products`);
        if (response.ok) {
            console.log('Server is running. Starting tests...\n');
            runAllTests();
        }
    } catch (err) {
        console.error('Server is not running. Please start the server first.');
        console.log('Run: npm start');
        process.exit(1);
    }
}

checkServer();