// ==========================================
// WHO-LIST BAR
// ==========================================
function renderWhoList() {
    const count = whoList.length;
    document.getElementById('whoBarCount').textContent = 
        count === 0 ? 'The realm is empty' :
        count === 1 ? '1 in the realm' :
        `${count} in the realm`;

    const listEl = document.getElementById('whoBarList');
    const exitBtn = document.getElementById('exitRealmBtn');
    
    // Clear existing users (keep exit button)
    const existingUsers = listEl.querySelectorAll('.who-bar-user');
    existingUsers.forEach(u => u.remove());

    const tierIcons = { scout: '🔍', hunter: '🗡️', tamer: '🐉', warden: '🛡️' };

    whoList.forEach(user => {
        const el = document.createElement('div');
        el.className = 'who-bar-user';
        const isMe = user.userId === gameState.userId;
        const lvl = user.level ? user.level.level : '?';
        const displayName = user.characterTitle ? `${user.handle} ${user.characterTitle}` : user.handle;
        const idleStr = user.idleMinutes >= 5 ? ` <span class="who-bar-user-idle">(idle: ${user.idleMinutes}m)</span>` : '';

        el.innerHTML = `
            <span class="who-bar-user-badge">${tierIcons[user.tier] || '🔍'}</span>
            <span class="who-bar-user-handle" data-userid="${user.userId}">
                ${displayName}${isMe ? ' <span style="opacity:0.5">(you)</span>' : ''}
            </span>
            <span class="who-bar-user-meta">Lvl ${lvl}${idleStr}</span>
        `;
        // Tap to open profile
        el.querySelector('.who-bar-user-handle').addEventListener('click', (e) => {
            e.stopPropagation();
            openProfile(user.userId);
        });
        listEl.insertBefore(el, exitBtn);
    });
}

// ==========================================
// EXIT REALM
// ==========================================
function exitRealm() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    console.log('🚪 Exiting realm...');
    showHuntLoading('Departing the realm...', '🚪');
    if (gameState.userId && CONFIG.huntScriptUrl) {
        huntPost('exitTheHunt', { userId: gameState.userId });
    }
    setTimeout(() => {
        window.location.href = CONFIG.chimeraUrl + '?from=hunt';
    }, 400);
}

function initWhoList() {
    document.getElementById('whoBarToggle').addEventListener('click', () => {
        const whoBar = document.getElementById('whoBar');
        const feedBar = document.getElementById('feedBar');
        // Close feed if open
        if (feedBar.classList.contains('expanded')) feedBar.classList.remove('expanded');
        whoBar.classList.toggle('expanded');
    });

    document.getElementById('exitRealmBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        exitRealm();
    });
}
