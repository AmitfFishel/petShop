// Common functionality across all pages
(function () {
    // Check authentication
    async function checkAuth() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                updateNavForUser(user);
                return user;
            }
        } catch (err) {
            console.log('Not authenticated');
        }
        return null;
    }

    // Update navigation for logged in user
    function updateNavForUser(user) {
        const userInfo = document.getElementById('userInfo');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginLink = document.getElementById('loginLink');

        if (user) {
            if (userInfo) userInfo.textContent = `Welcome, ${user.username}`;
            if (user.isAdmin || localStorage.getItem('isAdmin') === 'true') {
                const adminLink = document.getElementById('adminLink');
                if (adminLink) adminLink.style.display = 'inline-block';
                try {
                    const isAdminStored = localStorage.getItem('isAdmin') === 'true';
                    if (adminLink) adminLink.style.display = (user && (user.isAdmin || isAdminStored)) ? 'inline-block' : 'none';
                } catch (_) { }
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
                logoutBtn.onclick = logout;
            }
            if (loginLink) loginLink.style.display = 'none';
        }
    }

    // Logout function
    async function logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/login.html';
            }
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }

    // Theme management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.className = savedTheme + '-theme';

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.onclick = () => {
                const currentTheme = document.body.className.includes('dark') ? 'light' : 'dark';
                document.body.className = currentTheme + '-theme';
                localStorage.setItem('theme', currentTheme);
            };
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        checkAuth();
        initTheme();
    });

    // Export for use in other scripts
    window.appUtils = {
        checkAuth,
        logout
    };
})();