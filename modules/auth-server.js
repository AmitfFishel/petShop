const bcrypt = require('bcrypt');
const persistModule = require('./persist_module');

const register = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Validate input
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        // Check if user exists
        const existingUser = await persistModule.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Create user
        const user = await persistModule.createUser({ username, password, email });
        
        res.json({ message: 'Registration successful', userId: user.id });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        
        // Find user
        const user = await persistModule.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create session
        const token = await persistModule.createSession(username, rememberMe);
        
        // Set cookie
        const maxAge = rememberMe ? 12 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
        res.cookie('authToken', token, { 
            httpOnly: true, 
            maxAge,
            sameSite: 'strict'
        });
        
        // Log activity
        await persistModule.logActivity(username, 'login');
        
        res.json({ 
            message: 'Login successful', 
            user: { 
                username: user.username, 
                email: user.email 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        
        if (token) {
            await persistModule.deleteSession(token);
            await persistModule.logActivity(req.user.username, 'logout');
        }
        
        res.clearCookie('authToken');
        res.json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed' });
    }
};

module.exports = {
    register,
    login,
    logout
};