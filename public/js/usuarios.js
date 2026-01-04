// ===== SECURITY PANEL - USUARIOS.JS =====

// Global variables
let currentUserId = null;
let currentUsername = null;

// ===== NAVIGATION =====

// Show/hide dashboard and panels
function showDashboard() {
    document.querySelector('.security-dashboard').classList.remove('hidden');
    document.querySelectorAll('.security-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
}

function showPanel(panelId) {
    document.querySelector('.security-dashboard').classList.add('hidden');
    document.querySelectorAll('.security-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById(panelId).classList.remove('hidden');
}

// ===== MODALS =====

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// ===== USER MANAGEMENT =====

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        const tbody = document.getElementById('users-tbody');

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No hay usuarios registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td><span style="color: ${user.role === 'admin' ? '#8B5CF6' : '#3B82F6'}; font-weight: 600;">${user.role === 'admin' ? 'Admin' : 'Usuario'}</span></td>
                <td>
                    <span class="user-status-badge ${user.isActive ? 'active' : 'blocked'}">
                        ${user.isActive ? '✅ Activo' : '🔒 Bloqueado'}
                    </span>
                </td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-ES') : 'Nunca'}</td>
                <td>${user.loginCount || 0}</td>
                <td>
                    <button class="btn-action" onclick="openUserActionsMenu('${user._id}', '${user.username}')" title="Acciones">
                        🔧
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('Error al cargar usuarios', 'error');
    }
}

// Create user
async function createUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        password: formData.get('password'),
        role: formData.get('role'),
        phone: formData.get('phone') || '',
        email: formData.get('email') || ''
    };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`Usuario "${userData.username}" creado correctamente`, 'success');
            closeModal('modal-create-user');
            event.target.reset();
            loadUsers(); // Reload users table
        } else {
            showMessage(data.error || 'Error al crear usuario', 'error');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showMessage('Error al crear usuario', 'error');
    }
}

// Open user actions menu
function openUserActionsMenu(userId, username) {
    currentUserId = userId;
    currentUsername = username;
    showModal('modal-user-actions');
}

// Handle user action
async function handleUserAction(action) {
    closeModal('modal-user-actions');

    switch (action) {
        case 'view-records':
            await viewUserRecords(currentUserId, currentUsername);
            break;
        case 'toggle-status':
            await toggleUserStatus(currentUserId);
            break;
        case 'change-role':
            openChangeRoleModal(currentUserId, currentUsername);
            break;
        case 'reset-password':
            await resetUserPassword(currentUserId);
            break;
        case 'delete':
            await deleteUser(currentUserId, currentUsername);
            break;
    }
}

// Toggle user status
async function toggleUserStatus(userId) {
    if (!confirm('¿Estás seguro de cambiar el estado de este usuario?')) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}/toggle-status`, {
            method: 'PUT'
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`Usuario ${data.user.isActive ? 'activado' : 'bloqueado'} correctamente`, 'success');
            loadUsers();
        } else {
            showMessage(data.error || 'Error al cambiar estado', 'error');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showMessage('Error al cambiar estado del usuario', 'error');
    }
}

// Reset user password
async function resetUserPassword(userId) {
    if (!confirm('¿Estás seguro de resetear la contraseña de este usuario?')) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}/reset-password`, {
            method: 'PUT'
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Contraseña reseteada correctamente.\n\nContraseña temporal: ${data.temporaryPassword}\n\nEl usuario deberá cambiarla en el próximo login.`);
            showMessage('Contraseña reseteada correctamente', 'success');
        } else {
            showMessage(data.error || 'Error al resetear contraseña', 'error');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showMessage('Error al resetear contraseña', 'error');
    }
}

// Delete user
async function deleteUser(userId, username) {
    const confirmation = prompt(`⚠️ ADVERTENCIA: Esta acción es irreversible.\n\nEscribe "${username}" para confirmar la eliminación:`);

    if (confirmation !== username) {
        showMessage('Eliminación cancelada', 'info');
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`Usuario "${username}" eliminado correctamente`, 'success');
            loadUsers();
        } else {
            showMessage(data.error || 'Error al eliminar usuario', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error al eliminar usuario', 'error');
    }
}

// Change user role
function openChangeRoleModal(userId, username) {
    currentUserId = userId;
    currentUsername = username;

    document.getElementById('change-role-username').textContent = username;
    showModal('modal-change-role');
}

async function changeUserRole(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newRole = formData.get('role');

    try {
        const response = await fetch(`/api/users/${currentUserId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`✅ Rol actualizado correctamente`, 'success');
            closeModal('modal-change-role');
            loadUsers();
        } else {
            showMessage(data.error || 'Error al cambiar rol', 'error');
        }
    } catch (error) {
        console.error('Error changing role:', error);
        showMessage('Error al cambiar rol', 'error');
    }
}

// View user records
async function viewUserRecords(userId, username) {
    try {
        const response = await fetch(`/api/users/${userId}/records`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('user-records-username').textContent = username;
            const tbody = document.getElementById('user-records-tbody');

            if (data.records.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            Este usuario no tiene registros
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = data.records.map(record => `
                    <tr>
                        <td>${record.fecha}</td>
                        <td>${record.parador}</td>
                        <td>${record.horaInicio}</td>
                        <td>${record.horaFin}</td>
                        <td>${record.totalHoras}h</td>
                        <td>
                            <button class="btn-action" onclick="editUserRecord('${record._id}')" title="Editar">✏️</button>
                            <button class="btn-action" onclick="deleteUserRecord('${record._id}')" title="Eliminar">🗑️</button>
                        </td>
                    </tr>
                `).join('');
            }

            showModal('modal-user-records');
        } else {
            showMessage(data.error || 'Error al cargar registros', 'error');
        }
    } catch (error) {
        console.error('Error loading user records:', error);
        showMessage('Error al cargar registros del usuario', 'error');
    }
}

// Edit user record (admin)
async function editUserRecord(recordId) {
    // TODO: Implement edit modal
    showMessage('Funcionalidad de edición en desarrollo', 'info');
}

// Delete user record (admin)
async function deleteUserRecord(recordId) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) {
        return;
    }

    const reason = prompt('Motivo de la eliminación (opcional):') || '';

    try {
        const response = await fetch(`/api/records/${recordId}/admin-delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Registro eliminado correctamente', 'success');
            // Reload user records
            viewUserRecords(currentUserId, currentUsername);
        } else {
            showMessage(data.error || 'Error al eliminar registro', 'error');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        showMessage('Error al eliminar registro', 'error');
    }
}

// ===== LOGS =====

// Load access logs
async function loadAccessLogs() {
    try {
        const response = await fetch('/api/logs/access?limit=100');
        const data = await response.json();

        const tbody = document.getElementById('access-logs-tbody');

        if (data.logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No hay registros de acceso
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.logs.map(log => `
            <tr>
                <td>${log.username}</td>
                <td>
                    <span class="log-action-badge ${log.action}">
                        ${log.action === 'login' ? '🟢 Login' : log.action === 'logout' ? '🔵 Logout' : '🔴 Login Fallido'}
                    </span>
                </td>
                <td>${new Date(log.timestamp).toLocaleString('es-ES')}</td>
                <td>${log.ipAddress || 'N/A'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading access logs:', error);
        showMessage('Error al cargar logs de acceso', 'error');
    }
}

// Load modification logs
async function loadModificationLogs() {
    try {
        const response = await fetch('/api/logs/modifications?limit=100');
        const data = await response.json();

        const tbody = document.getElementById('modification-logs-tbody');

        if (data.logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No hay registros de modificaciones
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.logs.map(log => `
            <tr>
                <td>${log.adminUsername}</td>
                <td>${log.targetUsername}</td>
                <td>
                    <span class="log-action-badge ${log.action}">
                        ${log.action === 'edit' ? '✏️ Edición' : '🗑️ Eliminación'}
                    </span>
                </td>
                <td>${new Date(log.timestamp).toLocaleString('es-ES')}</td>
                <td>
                    <button class="btn-action" onclick="viewLogDetails('${log._id}')" title="Ver detalles">
                        👁️
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading modification logs:', error);
        showMessage('Error al cargar logs de modificaciones', 'error');
    }
}

// View log details
function viewLogDetails(logId) {
    // TODO: Implement log details modal
    showMessage('Funcionalidad de detalles en desarrollo', 'info');
}

// ===== UTILITY FUNCTIONS =====

function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// ===== EVENT LISTENERS =====

function initUsuariosSection() {
    // Restrict role options if not the original admin
    const roleSelect = document.getElementById('role-select');
    const adminOnlyOptions = document.querySelectorAll('.admin-only-option');
    const roleHelpText = document.getElementById('role-help-text');

    if (currentUser && currentUser.username !== 'admin') {
        // Hide admin and supervisor options for non-admin users
        adminOnlyOptions.forEach(option => {
            option.disabled = true;
            option.style.display = 'none';
        });
        if (roleHelpText) {
            roleHelpText.style.display = 'none';
        }
    }

    // Security card actions
    document.querySelectorAll('.btn-security-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;

            switch (action) {
                case 'user-management':
                    showPanel('panel-user-management');
                    loadUsers();
                    break;
                case 'create-user':
                    showModal('modal-create-user');
                    break;
                case 'access-logs':
                    showPanel('panel-access-logs');
                    loadAccessLogs();
                    break;
                case 'modification-logs':
                    showPanel('panel-modification-logs');
                    loadModificationLogs();
                    break;
                case 'messages':
                    // Load messaging section for admin
                    navigateToSection('mensajes');
                    break;
            }
        });
    });

    // Back to panel buttons
    document.querySelectorAll('.btn-back-panel').forEach(btn => {
        btn.addEventListener('click', showDashboard);
    });

    // Create user form
    const createUserForm = document.getElementById('form-create-user');
    if (createUserForm) {
        createUserForm.addEventListener('submit', createUser);
    }

    // Change role form
    const changeRoleForm = document.getElementById('form-change-role');
    if (changeRoleForm) {
        changeRoleForm.addEventListener('submit', changeUserRole);
    }

    // User action buttons
    document.querySelectorAll('.btn-user-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleUserAction(action);
        });
    });

    // Close modal buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Back button
    const btnBack = document.getElementById('btn-back-usuarios');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            backToDashboard();
            closeAllModals();
        });
    }
}
