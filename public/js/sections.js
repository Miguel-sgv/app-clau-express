// ===== REGISTRO SECTION =====

function initRegistroSection() {
    const form = document.getElementById('form-registro');
    const btnBack = document.getElementById('btn-back-registro');
    const horaInicioInput = document.getElementById('horaInicio');
    const horaFinInput = document.getElementById('horaFin');
    const totalHorasInput = document.getElementById('totalHoras');
    const fechaInput = document.getElementById('fecha');

    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;

    // Calcular horas totales automáticamente
    function calculateTotalHours() {
        const horaInicio = horaInicioInput.value;
        const horaFin = horaFinInput.value;

        if (horaInicio && horaFin) {
            const [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
            const [horasFin, minutosFin] = horaFin.split(':').map(Number);

            const inicioEnMinutos = horasInicio * 60 + minutosInicio;
            let finEnMinutos = horasFin * 60 + minutosFin;

            // Si la hora de fin es menor que la de inicio, asumimos que es del día siguiente
            if (finEnMinutos < inicioEnMinutos) {
                finEnMinutos += 24 * 60;
            }

            const totalMinutos = finEnMinutos - inicioEnMinutos;
            const totalHoras = (totalMinutos / 60).toFixed(2);

            totalHorasInput.value = totalHoras;
        }
    }

    // Event listeners para calcular horas
    horaInicioInput.addEventListener('change', calculateTotalHours);
    horaFinInput.addEventListener('change', calculateTotalHours);

    // Botón volver
    btnBack.addEventListener('click', () => {
        backToDashboard();
    });

    // Submit del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            fecha: fechaInput.value,
            horaInicio: horaInicioInput.value,
            horaFin: horaFinInput.value,
            totalHoras: parseFloat(totalHorasInput.value),
            parador: document.getElementById('parador').value,
            notas: document.getElementById('notas').value
        };

        try {
            const response = await fetch(`${API_URL}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showMessage('✅ Registro guardado correctamente', 'success');
                form.reset();
                fechaInput.value = today; // Restablecer fecha actual
                totalHorasInput.value = '';
            } else {
                const error = await response.json();
                showMessage('❌ ' + error.error, 'error');
            }
        } catch (error) {
            console.error('Error al guardar registro:', error);
            showMessage('❌ Error al guardar el registro', 'error');
        }
    });
}

// ===== LISTA SECTION =====
async function initListaSection() {
    const btnBack = document.getElementById('btn-back-lista');
    const tbody = document.getElementById('records-tbody');

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            backToDashboard();
        });
    }

    // Cargar registros
    await loadRecords();
}



async function deleteRecord(id) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
        const response = await fetch(`${API_URL}/records/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('✅ Registro eliminado correctamente', 'success');
            await loadRecords();
        } else {
            showMessage('❌ Error al eliminar el registro', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error al eliminar el registro', 'error');
    }
}

function editRecord(id) {
    showMessage('🚧 Función de edición en desarrollo', 'error');
}

// Helper function to escape HTML in notes
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, '&apos;');
}

// Show notes modal
let currentRecords = [];

// Store records globally for modal access
async function loadRecords() {
    const tbody = document.getElementById('records-tbody');

    try {
        const response = await fetch(`${API_URL}/records`);
        if (!response.ok) throw new Error('Error al cargar registros');

        const records = await response.json();
        currentRecords = records; // Store for modal access

        if (records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        No hay registros aún. ¡Crea tu primer registro!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr data-id="${record._id}">
                <td>${new Date(record.fecha).toLocaleDateString('es-ES')}</td>
                <td>${record.parador}</td>
                <td>${record.horaInicio}</td>
                <td>${record.horaFin}</td>
                <td>${record.totalHoras.toFixed(2)}h</td>
                <td class="actions-cell">
                    ${record.notas && record.notas.trim() ? `
                        <button class="btn-action btn-notes" onclick="showNotes('${record._id}')" title="Ver notas">
                            📝
                        </button>
                    ` : ''}
                    <button class="btn-action btn-edit" onclick="editRecord('${record._id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteRecord('${record._id}')" title="Eliminar">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--error);">
                    ❌ Error al cargar los registros
                </td>
            </tr>
        `;
    }
}

function showNotes(recordId) {
    const record = currentRecords.find(r => r._id === recordId);
    if (!record || !record.notas) return;

    const modal = document.getElementById('notes-modal');
    const notesContent = document.getElementById('notes-content');

    notesContent.textContent = record.notas;
    modal.classList.remove('hidden');
}

function closeNotesModal() {
    const modal = document.getElementById('notes-modal');
    modal.classList.add('hidden');
}

// ===== BUSQUEDA SECTION =====
function initBusquedaSection() {
    const btnBack = document.getElementById('btn-back-busqueda');
    const formBusqueda = document.getElementById('form-busqueda');
    const btnExportar = document.getElementById('btn-exportar');

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            backToDashboard();
        });
    }

    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async (e) => {
            e.preventDefault();
            await performSearch();
        });

        formBusqueda.addEventListener('reset', () => {
            document.getElementById('search-results-tbody').innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        Usa los filtros para buscar registros
                    </td>
                </tr>
            `;
            document.getElementById('search-stats').style.display = 'none';
            btnExportar.style.display = 'none';
        });
    }

    if (btnExportar) {
        btnExportar.addEventListener('click', exportToPDF);
    }
}

let searchResults = [];

async function performSearch() {
    const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
    const fechaFin = document.getElementById('filtro-fecha-fin').value;
    const mes = document.getElementById('filtro-mes').value;
    const zona = document.getElementById('filtro-zona').value;
    const texto = document.getElementById('filtro-texto').value.toLowerCase();
    const tbody = document.getElementById('search-results-tbody');
    const btnExportar = document.getElementById('btn-exportar');
    const searchStats = document.getElementById('search-stats');

    try {
        const response = await fetch(`${API_URL}/records`);
        if (!response.ok) throw new Error('Error al buscar');

        let records = await response.json();

        // Aplicar filtros
        // Si hay filtro de mes, tiene prioridad sobre fechas individuales
        if (mes) {
            records = records.filter(r => {
                const recordDate = new Date(r.fecha);
                const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
                return recordMonth === mes;
            });
        } else {
            // Solo aplicar filtros de fecha si no hay filtro de mes
            if (fechaInicio) {
                records = records.filter(r => new Date(r.fecha) >= new Date(fechaInicio));
            }
            if (fechaFin) {
                records = records.filter(r => new Date(r.fecha) <= new Date(fechaFin));
            }
        }
        if (zona) {
            records = records.filter(r => r.parador === zona);
        }
        if (texto) {
            records = records.filter(r =>
                (r.notas && r.notas.toLowerCase().includes(texto)) ||
                r.parador.toLowerCase().includes(texto)
            );
        }

        searchResults = records;

        if (records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        No se encontraron registros con esos filtros
                    </td>
                </tr>
            `;
            btnExportar.style.display = 'none';
            searchStats.style.display = 'none';
            return;
        }

        // Mostrar resultados
        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${new Date(record.fecha).toLocaleDateString('es-ES')}</td>
                <td>${record.parador}</td>
                <td>${record.horaInicio}</td>
                <td>${record.horaFin}</td>
                <td>${record.totalHoras.toFixed(2)}h</td>
                <td>${record.notas || '-'}</td>
            </tr>
        `).join('');

        // Calcular total de horas
        const totalHoras = records.reduce((sum, r) => sum + r.totalHoras, 0);
        document.getElementById('total-horas').textContent = totalHoras.toFixed(2);

        btnExportar.style.display = 'block';
        searchStats.style.display = 'block';

        showMessage(`✅ Se encontraron ${records.length} registro(s)`, 'success');

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--error);">
                    ❌ Error al realizar la búsqueda
                </td>
            </tr>
        `;
    }
}

function exportToPDF() {
    if (searchResults.length === 0) {
        showMessage('❌ No hay resultados para exportar', 'error');
        return;
    }

    try {
        // Acceder a jsPDF desde el objeto global window
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título del documento
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('Registro de Horas - CLAUDIA Express', 14, 20);

        // Fecha de generación
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 28);

        // Preparar datos para la tabla
        const tableData = searchResults.map(r => [
            new Date(r.fecha).toLocaleDateString('es-ES'),
            r.parador,
            r.horaInicio,
            r.horaFin,
            r.totalHoras.toFixed(2) + 'h',
            r.notas || '-'
        ]);

        // Calcular total de horas
        const totalHoras = searchResults.reduce((sum, r) => sum + r.totalHoras, 0);

        // Crear tabla con autoTable
        doc.autoTable({
            startY: 35,
            head: [['Fecha', 'Zona', 'Inicio', 'Fin', 'Total', 'Notas']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [180, 180, 170],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                textColor: [40, 40, 40]
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 35 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 'auto' }
            },
            margin: { top: 35 }
        });

        // Agregar total al final
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'bold');
        doc.text(`Total de Horas: ${totalHoras.toFixed(2)}h`, 14, finalY);
        doc.text(`Total de Registros: ${searchResults.length}`, 14, finalY + 7);

        // Descargar PDF
        const fileName = `registros_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showMessage('✅ PDF exportado correctamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showMessage('❌ Error al generar el PDF', 'error');
    }
}

// ===== USUARIOS SECTION =====
function initUsuariosSection() {
    const btnBack = document.getElementById('btn-back-usuarios');
    const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
    const modal = document.getElementById('user-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const formUsuario = document.getElementById('form-usuario');

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            backToDashboard();
        });
    }

    if (btnNuevoUsuario) {
        btnNuevoUsuario.addEventListener('click', () => {
            openUserModal();
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeUserModal);
    }

    if (btnCancelModal) {
        btnCancelModal.addEventListener('click', closeUserModal);
    }

    if (formUsuario) {
        formUsuario.addEventListener('submit', handleUserSubmit);
    }

    // Cargar usuarios
    loadUsers();
}

let editingUserId = null;

async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Error al cargar usuarios');

        const users = await response.json();

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="openUserModal('${user._id}')" title="Editar">
                        ✏️
                    </button>
                    ${user.username !== 'claudia' ? `
                        <button class="btn-action btn-delete" onclick="deleteUser('${user._id}')" title="Eliminar">
                            🗑️
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--error);">
                    ❌ Error al cargar los usuarios
                </td>
            </tr>
        `;
    }
}

function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-usuario');
    const passwordInput = document.getElementById('user-password');

    editingUserId = userId;
    modal.classList.remove('hidden');

    if (userId) {
        title.textContent = 'Editar Usuario';
        passwordInput.required = false;
        loadUserData(userId);
    } else {
        title.textContent = 'Nuevo Usuario';
        passwordInput.required = true;
        form.reset();
    }
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.add('hidden');
    editingUserId = null;
}

async function loadUserData(userId) {
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        const user = users.find(u => u._id === userId);

        if (user) {
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-role').value = user.role;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('user-username').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    const userData = { username, role };
    if (password) userData.password = password;

    try {
        const url = editingUserId ? `${API_URL}/users/${editingUserId}` : `${API_URL}/users`;
        const method = editingUserId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showMessage(`✅ Usuario ${editingUserId ? 'actualizado' : 'creado'} correctamente`);
            closeUserModal();
            loadUsers();
        } else {
            const error = await response.json();
            showMessage('❌ ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error al guardar usuario', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('✅ Usuario eliminado correctamente');
            loadUsers();
        } else {
            showMessage('❌ Error al eliminar el usuario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error al eliminar el usuario', 'error');
    }
}
