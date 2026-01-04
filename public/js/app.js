// ===== Theme Toggle Functionality =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Noche';
    } else {
        document.body.classList.remove('light-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'Día';
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    body.classList.toggle('light-theme');

    if (body.classList.contains('light-theme')) {
        localStorage.setItem('theme', 'light');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Noche';
    } else {
        localStorage.setItem('theme', 'dark');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'Día';
    }
}

// ===== Color Theme Functionality =====
const COLOR_THEMES = ['default', 'yellow', 'blue', 'green'];

function initColorTheme() {
    const savedColor = localStorage.getItem('color-theme') || 'default';
    setColorTheme(savedColor);
}

function setColorTheme(theme) {
    const body = document.body;
    // Remove existing themes
    COLOR_THEMES.forEach(t => body.classList.remove(`theme-${t}`));

    if (theme !== 'default') {
        body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('color-theme', theme);
}

function cycleColorTheme() {
    const currentState = localStorage.getItem('color-theme') || 'default';
    const currentIndex = COLOR_THEMES.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % COLOR_THEMES.length;
    const nextTheme = COLOR_THEMES[nextIndex];

    setColorTheme(nextTheme);

    const themeName = nextTheme === 'default' ? 'Violeta' :
        nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1);
    showMessage(`🎨 Tema de color: ${themeName}`, 'info');
}

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
const introOverlay = document.getElementById('intro-overlay');
const introLoader = document.getElementById('intro-loader');
const introWelcome = document.getElementById('intro-welcome');
const welcomeUsername = document.getElementById('welcome-username');

// Play Intro Sequence
function playIntro(username) {
    // Show intro overlay
    introOverlay.classList.remove('hidden');
    introLoader.classList.remove('hidden');
    introWelcome.classList.add('hidden');

    // Add no-animation class to cards initially
    dashboardCards.forEach(card => card.classList.add('no-animation'));

    // Add no-animation to title and subtitle
    const dashboardTitle = document.querySelector('.dashboard-title');
    const dashboardSubtitle = document.querySelector('.dashboard-subtitle');
    if (dashboardTitle) dashboardTitle.classList.add('no-animation');
    if (dashboardSubtitle) dashboardSubtitle.classList.add('no-animation');

    // Animate percentage from 0 to 100 over 2 seconds
    const percentageEl = document.getElementById('loader-percentage');
    let currentPercentage = 0;
    const percentageInterval = setInterval(() => {
        currentPercentage += 2;
        if (currentPercentage <= 100) {
            percentageEl.textContent = currentPercentage + '%';
        } else {
            clearInterval(percentageInterval);
        }
    }, 40);

    // Phase 1: Show welcome below loader (2s) - DON'T hide loader
    setTimeout(() => {
        introWelcome.classList.remove('hidden');
        welcomeUsername.textContent = username;
    }, 2000);

    // Phase 2: Fade out intro (4s) - Added 0.5s
    setTimeout(() => {
        introOverlay.classList.add('fade-out');
    }, 4000);

    // Phase 3: Hide overlay and animate title (4.5s)
    setTimeout(() => {
        introOverlay.classList.add('hidden');
        introOverlay.classList.remove('fade-out');

        // Animate dashboard title
        const dashboardTitle = document.querySelector('.dashboard-title');
        const dashboardSubtitle = document.querySelector('.dashboard-subtitle');
        if (dashboardTitle) {
            dashboardTitle.classList.remove('no-animation');
            dashboardTitle.classList.add('animate-in');
        }
        if (dashboardSubtitle) {
            dashboardSubtitle.classList.remove('no-animation');
            dashboardSubtitle.classList.add('animate-in');
        }
    }, 4500);

    // Phase 4: Show cards with staggered animation (5.0s)
    setTimeout(() => {
        dashboardCards.forEach(card => card.classList.remove('no-animation'));
    }, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initColorTheme();
    initGridBackground();
    checkAuth();
    initLoginForm();
    initDashboard();

    // Theme toggle button
    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
});

// Grid Background
function initGridBackground() {
    const gridContainer = document.getElementById("gridContainer");

    // Function to add numbers to top row cells except the last one
    function addNumbersToTopRow() {
        // Determine the number of columns
        const numberOfColumns = getComputedStyle(gridContainer).gridTemplateColumns.split(' ').length;

        // Remove existing numbers
        document.querySelectorAll('.number').forEach(function (number) {
            number.remove();
        });

        // Add numbers to top row cells except the last one
        const topRowItems = document.querySelectorAll(".grid-item:nth-child(-n+" + (numberOfColumns - 1) + ")");
        topRowItems.forEach(function (item, index) {
            if (index !== numberOfColumns - 1) {
                const number = document.createElement("div");
                number.textContent = index + 1;
                number.classList.add("number");
                item.appendChild(number);
            }
        });
    }

    // Function to handle resize event
    function handleResize() {
        addNumbersToTopRow();
    }

    // Create grid items
    const numberOfCells = 256;
    for (let i = 0; i < numberOfCells; i++) {
        const gridItem = document.createElement("div");
        gridItem.classList.add("grid-item");
        gridContainer.appendChild(gridItem);
    }

    addNumbersToTopRow();

    // Watch for changes in the grid structure
    const observer = new MutationObserver(function (mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                addNumbersToTopRow();
            }
        }
    });

    observer.observe(gridContainer, { attributes: true });

    window.addEventListener('resize', handleResize);
}

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

// Settings Dropdown
let settingsDropdownInitialized = false;

function initSettingsDropdown() {
    if (settingsDropdownInitialized) return; // Prevent duplicate initialization

    const btnSettings = document.getElementById('btn-settings');
    const dropdown = document.getElementById('settings-dropdown');

    if (btnSettings && dropdown) {
        btnSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.classList.contains('hidden') &&
                !e.target.closest('.settings-dropdown-container')) {
                dropdown.classList.add('hidden');
            }
        });

        // Handle dropdown options
        document.querySelectorAll('.settings-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                dropdown.classList.add('hidden');
                handleSettingsAction(action);
            });
        });

        settingsDropdownInitialized = true;
    }
}

function handleSettingsAction(action) {
    switch (action) {
        case 'theme':
            toggleTheme();
            break;
        case 'color':
            cycleColorTheme();
            break;
        case 'message':
            openUserMessageModal();
            break;
    }
}

// User Message Modal
let userMessagePolling = null;
let lastUserMessageCount = 0; // Track message count to avoid flicker

function openUserMessageModal() {
    const modal = document.getElementById('user-message-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('user-message-input').value = '';
        const counter = document.getElementById('user-char-count');
        if (counter) counter.textContent = '0';

        // Load messages when opening
        loadUserMessages();

        // Start polling for new messages
        startUserMessagePolling();
    }
}

function closeUserMessageModal() {
    const modal = document.getElementById('user-message-modal');
    if (modal) {
        modal.classList.add('hidden');

        // Stop polling when closing
        stopUserMessagePolling();
    }
}

async function loadUserMessages() {
    try {
        // Fetch messages with admin
        const response = await fetch('/api/messages/admin');
        const data = await response.json();

        if (response.ok) {
            // Only update if message count changed
            if (data.messages.length !== lastUserMessageCount) {
                lastUserMessageCount = data.messages.length;
                displayUserMessages(data.messages);
            }

            // Mark messages from admin as read
            await fetch('/api/messages/admin/mark-read', { method: 'PUT' });

            // Update badge
            updateUserMessageBadge();
        }
    } catch (error) {
        console.error('Load user messages error:', error);
        const container = document.getElementById('user-chat-messages');
        if (container) {
            container.innerHTML = `
                <div class="chat-empty">
                    <p>❌ Error al cargar mensajes</p>
                </div>
            `;
        }
    }
}

function displayUserMessages(messages) {
    const container = document.getElementById('user-chat-messages');

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <p>👋 No hay mensajes. ¡Inicia la conversación con el admin!</p>
            </div>
        `;
        return;
    }

    let lastDate = null;
    container.innerHTML = messages.map(msg => {
        const isSent = msg.from === currentUser.username;
        const msgDate = new Date(msg.timestamp);
        const time = msgDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Format date as "4-Ene"
        const dateStr = msgDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const currentDate = msgDate.toDateString();

        // Check if we need to show the date badge
        const showDate = lastDate !== currentDate;
        lastDate = currentDate;

        return `
            <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                <div class="message-time">
                    ${showDate ? `<span class="message-date-badge">${dateStr}</span>` : ''}
                    <span class="message-hour">${time}</span>
                </div>
                <p class="message-text">${escapeHtml(msg.message)}</p>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function initUserMessageForm() {
    const form = document.getElementById('user-message-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await sendUserMessage();
        });
    }

    // Character counter
    const input = document.getElementById('user-message-input');
    const counter = document.getElementById('user-char-count');
    if (input && counter) {
        input.addEventListener('input', () => {
            counter.textContent = input.value.length;
        });
    }
}

async function sendUserMessage() {
    const input = document.getElementById('user-message-input');
    const message = input.value.trim();

    if (!message) return;

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: 'admin',
                message: message
            })
        });

        if (response.ok) {
            // Clear input
            input.value = '';
            const counter = document.getElementById('user-char-count');
            if (counter) counter.textContent = '0';

            // Reload messages to show the sent message
            await loadUserMessages();
        } else {
            const data = await response.json();
            showMessage(data.error || 'Error al enviar mensaje', 'error');
        }
    } catch (error) {
        console.error('Send user message error:', error);
        showMessage('Error al enviar mensaje', 'error');
    }
}

function startUserMessagePolling() {
    userMessagePolling = setInterval(async () => {
        await loadUserMessages();
    }, 5000);
}

function stopUserMessagePolling() {
    if (userMessagePolling) {
        clearInterval(userMessagePolling);
        userMessagePolling = null;
    }
}

async function updateUserMessageBadge() {
    try {
        const response = await fetch('/api/messages/unread/count');
        const data = await response.json();

        if (response.ok) {
            const badge = document.getElementById('message-badge-small');
            if (badge) {
                if (data.count > 0) {
                    badge.textContent = data.count;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }
    } catch (error) {
        console.error('Update user message badge error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== USER PROFILE MODAL =====

function openUserProfile() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) {
        modal.classList.remove('hidden');
        loadUserProfile();
    }
}

function closeUserProfile() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch('/api/me');
        const data = await response.json();

        if (response.ok) {
            const user = data.user;

            // Update avatar
            const currentAvatar = document.getElementById('current-avatar');
            if (currentAvatar && user.avatar) {
                currentAvatar.textContent = user.avatar;
            }

            // Update info
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-role').textContent =
                user.role === 'admin' ? 'Administrador' :
                    user.role === 'supervisor' ? 'Supervisor' : 'Usuario';

            const createdDate = new Date(user.createdAt).toLocaleDateString('es-ES');
            document.getElementById('profile-created').textContent = createdDate;

            // Update contact fields
            document.getElementById('profile-phone').value = user.phone || '';
            document.getElementById('profile-email').value = user.email || '';
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

function initProfileModal() {
    // Profile button click
    const btnProfile = document.getElementById('btn-profile');
    if (btnProfile) {
        btnProfile.addEventListener('click', openUserProfile);
    }

    // Tab switching
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });

    // Avatar selection
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', async () => {
            const avatar = option.dataset.avatar;

            // Update UI
            document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('current-avatar').textContent = avatar;

            // Save to backend
            await updateProfile({ avatar });
        });
    });

    // Password form
    const passwordForm = document.getElementById('form-profile-password');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await changeProfilePassword();
        });
    }

    // Contact form
    const contactForm = document.getElementById('form-profile-contact');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfileContact();
        });
    }
}

function showAvatarSelector() {
    const selector = document.getElementById('avatar-selector');
    if (selector) {
        selector.classList.toggle('hidden');
    }
}

async function updateProfile(data) {
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('✅ Perfil actualizado correctamente', 'success');

            // Update current user avatar in header if changed
            if (data.avatar && currentUser) {
                currentUser.avatar = data.avatar;
                const userNameSpan = document.getElementById('user-name');
                if (userNameSpan) {
                    userNameSpan.textContent = `${data.avatar} ${currentUser.username}`;
                }
            }
        } else {
            showMessage(result.error || 'Error al actualizar perfil', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showMessage('Error al actualizar perfil', 'error');
    }
}

async function changeProfilePassword() {
    const currentPassword = document.getElementById('profile-current-password').value;
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;

    if (newPassword !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('✅ Contraseña cambiada correctamente', 'success');
            document.getElementById('form-profile-password').reset();
        } else {
            showMessage(data.error || 'Error al cambiar contraseña', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showMessage('Error al cambiar contraseña', 'error');
    }
}

async function updateProfileContact() {
    const phone = document.getElementById('profile-phone').value;
    const email = document.getElementById('profile-email').value;

    await updateProfile({ phone, email });
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

            // Check if password change is required
            if (data.requirePasswordChange) {
                showPasswordChangeModal(data.userId, username, password);
                return;
            }

            currentUser = data.user;
            showMessage('🚀 Bienvenido al cosmos, ' + currentUser.username);

            // Show app and play intro
            showMainApp();
            playIntro(currentUser.username);
        } else {
            const error = await response.json();
            showMessage('❌ ' + error.error, 'error');
        }
    } catch (error) {
        showMessage('❌ Error al conectar con el servidor', 'error');
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
        const avatar = currentUser.avatar || '👤';
        userNameSpan.textContent = `${avatar} ${currentUser.username}`;

        // Show user management card if admin or supervisor
        if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
            cardUsers.classList.remove('hidden');
        }

        // Update unread messages badge
        if (typeof updateUnreadBadge === 'function') {
            updateUnreadBadge();
        }

        // Update user message badge in settings
        updateUserMessageBadge();
    }

    // Initialize settings dropdown and user message form
    initSettingsDropdown();
    initUserMessageForm();
    initProfileModal();
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

async function navigateToSection(section) {
    const sectionsContainer = document.getElementById('sections-container');
    const mainApp = document.getElementById('main-app');
    const dashboard = document.querySelector('.dashboard');

    try {
        // Cargar el HTML de la sección
        const response = await fetch(`/sections/${section}.html`);
        if (!response.ok) {
            throw new Error('Sección no encontrada');
        }

        const html = await response.text();

        // Insertar el HTML en el contenedor
        sectionsContainer.innerHTML = html;

        // Ocultar dashboard y mostrar sección
        dashboard.style.display = 'none';
        sectionsContainer.classList.add('active');

        // Activar la sección específica
        const sectionView = sectionsContainer.querySelector(`#section-${section}`);
        if (sectionView) {
            sectionView.classList.add('active');
        }

        // Inicializar la sección según el tipo
        if (section === 'registro') {
            initRegistroSection();
        } else if (section === 'lista') {
            initListaSection();
        } else if (section === 'busqueda') {
            initBusquedaSection();
        } else if (section === 'usuarios') {
            initUsuariosSection();
        } else if (section === 'mensajes') {
            initMensajesSection();
        }

    } catch (error) {
        console.error('Error al cargar sección:', error);
        showMessage('❌ Error al cargar la sección', 'error');
    }
}

// Volver al dashboard
function backToDashboard() {
    const sectionsContainer = document.getElementById('sections-container');
    const dashboard = document.querySelector('.dashboard');

    sectionsContainer.classList.remove('active');
    sectionsContainer.innerHTML = '';
    dashboard.style.display = 'block';
}

// Utilities
function showMessage(message, type = 'success') {
    messageToast.textContent = message;
    messageToast.className = `toast ${type}`;

    setTimeout(() => {
        messageToast.classList.add('hidden');
    }, 3000);
}

// Password Change Modal
function showPasswordChangeModal(userId, username, currentPassword) {
    const modal = document.getElementById('password-change-modal');
    const form = document.getElementById('form-change-password');

    // Store user data
    document.getElementById('temp-user-id').value = userId;
    document.getElementById('current-password').value = currentPassword;

    // Show modal
    modal.classList.remove('hidden');

    // Handle form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        await handlePasswordChange(userId, username);
    };
}

async function handlePasswordChange(userId, username) {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage('❌ Las contraseñas no coinciden', 'error');
        return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
        showMessage('❌ La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    if (!/[A-Z]/.test(newPassword)) {
        showMessage('❌ La contraseña debe incluir al menos una mayúscula', 'error');
        return;
    }

    if (!/[0-9]/.test(newPassword)) {
        showMessage('❌ La contraseña debe incluir al menos un número', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Hide modal
            document.getElementById('password-change-modal').classList.add('hidden');

            // Set current user
            currentUser = data.user;

            // Show success message and redirect to dashboard
            showMessage('✅ Contraseña actualizada correctamente');
            setTimeout(() => {
                showMainApp();
            }, 1000);
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (error) {
        showMessage('❌ Error al cambiar contraseña', 'error');
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}
