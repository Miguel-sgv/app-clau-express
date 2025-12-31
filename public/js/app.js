// API Base URL
const API_URL = '/api';

// State
let currentUser = null;
let records = [];

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');
const userNameSpan = document.getElementById('user-name');
const dashboardCards = document.querySelectorAll('.dashboard-card');
const cardUsers = document.getElementById('card-users');
const messageToast = document.getElementById('message-toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLoginForm();
    initDashboard();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`);
        if (response.ok) {
            currentUser = await response.json();
            showMainApp();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        showLoginScreen();
    }
}

// Login Form
function initLoginForm() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMessage(' Bienvenido al cosmos, ' + currentUser.username);
            setTimeout(() => {
                showMainApp();
            }, 1000);
        } else {
            const error = await response.json();
            showMessage(' ' + error.error, 'error');
        }
    } catch (error) {
        showMessage(' Error al conectar con el servidor', 'error');
    }
}

// Logout
function initLogout() {
    btnLogout.addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
            currentUser = null;
            showMessage(' Hasta pronto, viajero estelar');
            setTimeout(() => {
                showLoginScreen();
            }, 1000);
        } catch (error) {
            showMessage(' Error al cerrar sesión', 'error');
        }
    });
}

// Show/Hide Screens
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    loginForm.reset();
}

function showMainApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    // Update user name
    if (currentUser) {
        userNameSpan.textContent = currentUser.username;
        
        // Show user management card if admin
        if (currentUser.role === 'admin') {
            cardUsers.classList.remove('hidden');
        }
    }
    
    initLogout();
}

// Dashboard Navigation
function initDashboard() {
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const section = card.dataset.section;
            navigateToSection(section);
        });
    });
}

function navigateToSection(section) {
    showMessage(' Navegando a ' + section + '...');
    
    // TODO: Implement section views
    // For now, just show a message
    setTimeout(() => {
        showMessage(' Sección en construcción: ' + section, 'error');
    }, 1000);
}

// Utilities
function showMessage(message, type = 'success') {
    messageToast.textContent = message;
    messageToast.className = `toast ${type}`;
    
    setTimeout(() => {
        messageToast.classList.add('hidden');
    }, 3000);
}
