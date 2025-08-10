// Authentication functionality
(function () {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();

            const formData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                rememberMe: document.getElementById('rememberMe').checked
            };

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });

                if (response.ok) {
  const result = await response.json();
  localStorage.setItem('username', result.user.username);
  localStorage.setItem('isAdmin', result.user.isAdmin ? 'true' : 'false');
  alert('Login successful!');
  window.location.href = '/store.html';

                } else {
                    const error = await response.json();
                    alert('Login failed: ' + error.error);
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('Login failed. Please try again.');
            }
        };
    }

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const formData = {
                username: document.getElementById('username').value,
                password: password,
                email: document.getElementById('email').value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Registration successful! Please login.');
                    window.location.href = '/login.html';
                } else {
                    const error = await response.json();
                    alert('Registration failed: ' + error.error);
                }
            } catch (err) {
                console.error('Registration error:', err);
                alert('Registration failed. Please try again.');
            }
        };
    }
})();