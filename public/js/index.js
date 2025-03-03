// Simple users database for frontend only (no backend authentication)
const users = {
    admin: {
        username: "admin",
        password: "admin", // Example password for admin
        role: "admin"
    },
    user: {
        username: "user",
        password: "user", // Example password for general user
        role: "user"
    }
};

// Listen for form submission
document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Get the username and password values entered by the user
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if the entered username exists in our "users" object
    const user = users[username];

    // If the username exists and the password matches
    if (user && user.password === password) {
        // Redirect based on the user's role
        if (user.role === 'admin') {
            // Redirect to admin panel (replace '/admin' with the actual URL)
            window.location.href = 'admin.html';
        } else if (user.role === 'user') {
            // Redirect to user panel (replace '/user' with the actual URL)
            window.location.href = 'report.html';
        }
    } else {
        // If login is invalid, show an error message
        alert('Invalid username or password!');
    }
});
