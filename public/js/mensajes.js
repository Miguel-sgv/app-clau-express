// ===== MESSAGING SECTION - MENSAJES.JS =====

let currentChatUser = null;
let messagePollingInterval = null;
let lastMessageCount = 0; // Track message count to avoid unnecessary updates

// ===== INITIALIZATION =====

function initMensajesSection() {
    loadConversations();
    setupMessageForm();
    setupCharCounter();
    setupBulkMessaging();

    // Start polling for new messages every 5 seconds
    startMessagePolling();

    // Back button
    const btnBack = document.getElementById('btn-back-mensajes');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            stopMessagePolling();
            backToDashboard();
        });
    }
}

// ===== CONVERSATIONS =====

async function loadConversations() {
    try {
        const response = await fetch('/api/messages/conversations');
        const data = await response.json();

        if (response.ok) {
            displayConversations(data.conversations);
        } else {
            showMessage(data.error || 'Error al cargar conversaciones', 'error');
        }
    } catch (error) {
        console.error('Load conversations error:', error);
        showMessage('Error al cargar conversaciones', 'error');
    }
}

function displayConversations(conversations) {
    const list = document.getElementById('conversations-list');

    if (conversations.length === 0) {
        list.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                <p>No hay conversaciones</p>
            </div>
        `;
        return;
    }

    list.innerHTML = conversations.map(conv => `
        <div class="conversation-item" data-username="${conv.username}">
            <input type="checkbox" class="user-checkbox" data-username="${conv.username}" onclick="event.stopPropagation()">
            <div class="conversation-content" onclick="openChat('${conv.username}')">
                <div class="conversation-username">
                    ${conv.username === 'admin' ? '👑' : '👤'} ${conv.username}
                </div>
                <div class="conversation-preview">
                    ${conv.lastMessage || 'Sin mensajes'}
                </div>
            </div>
            ${conv.unreadCount > 0 ? `<span class="conversation-badge">${conv.unreadCount}</span>` : ''}
        </div>
    `).join('');
}

// ===== CHAT =====

async function openChat(username) {
    currentChatUser = username;

    // Update active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-username="${username}"]`)?.classList.add('active');

    // Update chat header
    document.getElementById('chat-username').textContent = username === 'admin' ? '👑 Admin' : `👤 ${username}`;

    // Show input container
    document.getElementById('chat-input-container').classList.remove('hidden');

    // Load messages
    await loadMessages(username);

    // Mark as read
    await markAsRead(username);

    // Update conversations to remove badge
    await loadConversations();
}

async function loadMessages(username) {
    try {
        const response = await fetch(`/api/messages/${username}`);
        const data = await response.json();

        if (response.ok) {
            // Only update if message count changed
            if (data.messages.length !== lastMessageCount) {
                lastMessageCount = data.messages.length;
                displayMessages(data.messages);
            }
        } else {
            showMessage(data.error || 'Error al cargar mensajes', 'error');
        }
    } catch (error) {
        console.error('Load messages error:', error);
        showMessage('Error al cargar mensajes', 'error');
    }
}

function displayMessages(messages) {
    const container = document.getElementById('chat-messages');

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <p>👋 No hay mensajes. ¡Inicia la conversación!</p>
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

    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// ===== SEND MESSAGE =====

function setupMessageForm() {
    const form = document.getElementById('form-send-message');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await sendMessage();
        });
    }

    // Auto-resize textarea
    const textarea = document.getElementById('message-input');
    if (textarea) {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });

        // Send on Enter (Shift+Enter for new line)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message || !currentChatUser) {
        return;
    }

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: currentChatUser,
                message: message
            })
        });

        const data = await response.json();

        if (response.ok) {
            input.value = '';
            input.style.height = 'auto';
            updateCharCount();

            // Reload messages
            await loadMessages(currentChatUser);

            // Update conversations
            await loadConversations();
        } else {
            showMessage(data.error || 'Error al enviar mensaje', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showMessage('Error al enviar mensaje', 'error');
    }
}

// ===== MARK AS READ =====

async function markAsRead(username) {
    try {
        await fetch(`/api/messages/${username}/mark-read`, {
            method: 'PUT'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
    }
}

// ===== POLLING =====

function startMessagePolling() {
    // Poll every 5 seconds
    messagePollingInterval = setInterval(async () => {
        if (currentChatUser) {
            await loadMessages(currentChatUser);
        }
        await loadConversations();
        await updateUnreadBadge();
    }, 5000);
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

// ===== UNREAD BADGE =====

async function updateUnreadBadge() {
    try {
        const response = await fetch('/api/messages/unread/count');
        const data = await response.json();

        if (response.ok) {
            const badge = document.getElementById('message-count');
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
        console.error('Update unread badge error:', error);
    }
}

// ===== UTILITIES =====

function setupCharCounter() {
    const input = document.getElementById('message-input');
    const counter = document.getElementById('char-count');

    if (input && counter) {
        input.addEventListener('input', updateCharCount);
    }
}

function updateCharCount() {
    const input = document.getElementById('message-input');
    const counter = document.getElementById('char-count');

    if (input && counter) {
        counter.textContent = input.value.length;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== BULK MESSAGING =====

function setupBulkMessaging() {
    const selectAllCheckbox = document.getElementById('select-all-users');
    const btnBulkSend = document.getElementById('btn-bulk-send');

    // Select all checkbox
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateSelectedCount();
        });
    }

    // Update count when individual checkboxes change
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('user-checkbox')) {
            updateSelectedCount();
        }
    });

    // Bulk send button
    if (btnBulkSend) {
        btnBulkSend.addEventListener('click', sendBulkMessage);
    }
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const count = checkboxes.length;
    const btnBulkSend = document.getElementById('btn-bulk-send');
    const selectedCount = document.getElementById('selected-count');

    if (selectedCount) {
        selectedCount.textContent = count;
    }

    if (btnBulkSend) {
        if (count > 0) {
            btnBulkSend.classList.remove('hidden');
        } else {
            btnBulkSend.classList.add('hidden');
        }
    }
}

async function sendBulkMessage() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const selectedUsers = Array.from(checkboxes).map(cb => cb.dataset.username);

    if (selectedUsers.length === 0) {
        showMessage('Selecciona al menos un usuario', 'error');
        return;
    }

    const message = prompt(`Enviar mensaje a ${selectedUsers.length} usuario(s):\n\nEscribe tu mensaje:`);

    if (!message || !message.trim()) {
        return;
    }

    try {
        let successCount = 0;
        let errorCount = 0;

        for (const username of selectedUsers) {
            try {
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: username,
                        message: message.trim()
                    })
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
            }
        }

        if (successCount > 0) {
            showMessage(`✅ Mensaje enviado a ${successCount} usuario(s)`, 'success');
        }

        if (errorCount > 0) {
            showMessage(`⚠️ Error al enviar a ${errorCount} usuario(s)`, 'error');
        }

        // Uncheck all
        document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('select-all-users').checked = false;
        updateSelectedCount();

        // Reload conversations
        await loadConversations();

    } catch (error) {
        console.error('Bulk send error:', error);
        showMessage('Error al enviar mensajes', 'error');
    }
}
