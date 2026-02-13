// ==========================================
// CAMPFIRE (bottom drop-up activity feed)
// ==========================================
let lastFeedViewed = 0; // timestamp

// Try to restore from localStorage
try { lastFeedViewed = Number(localStorage.getItem('hunt_lastFeedViewed')) || 0; } catch(e) {}

function renderFeedBar() {
    const listEl = document.getElementById('feedBarList');

    if (hallFeed.length === 0) {
        listEl.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-faint); font-size: 13px;">The campfire crackles quietly...</div>`;
    } else {
        // Chat-style: oldest at top, newest at bottom
        const sorted = [...hallFeed].reverse();
        listEl.innerHTML = sorted.map(entry => {
            const isChatMsg = entry.type === 'campfire_message' || entry.icon === 'campfire';

            if (isChatMsg) {
                const t = entry.senderTier || 'scout';
                const icon = tierLetters[t] || 'S';
                const lvl = entry.senderLevel != null ? entry.senderLevel : '?';
                return `<div class="game-activity chat-msg">
                    <div class="chat-msg-header"><span class="chat-tier">&lt;${icon}:${lvl}&gt;</span> ${entry.handle || '???'} says:</div>
                    <div class="chat-msg-body">${entry.text}</div>
                    <div class="chat-msg-meta">${getTimeAgo(entry.timestamp)}</div>
                </div>`;
            } else {
                return `<div class="game-activity system-msg">
                    <div class="game-activity-body">
                        <div class="game-activity-text">${entry.emoji} ${entry.text}</div>
                        <div class="game-activity-meta">${getTimeAgo(entry.timestamp)}</div>
                    </div>
                </div>`;
            }
        }).join('');

        // Auto-scroll to bottom (newest)
        listEl.scrollTop = listEl.scrollHeight;
    }

    // Show campfire input for all users
    const adminBar = document.getElementById('feedBarAdmin');
    if (adminBar) {
        adminBar.classList.add('visible');
    }

    updateFeedBadge();
}

function updateFeedBadge() {
    const badge = document.getElementById('feedBarBadge');
    const unread = hallFeed.filter(e => new Date(e.timestamp).getTime() > lastFeedViewed).length;
    badge.textContent = unread;
    badge.className = unread > 0 ? 'feed-bar-badge' : 'feed-bar-badge empty';
}

async function sendCampfireMessage() {
    const input = document.getElementById('campfireInput');
    const text = input.value.trim();
    if (!text || !gameState.userId || !CONFIG.huntScriptUrl) return;

    input.value = '';
    const btn = document.getElementById('campfireSendBtn');
    btn.textContent = '...';
    btn.disabled = true;

    try {
        const result = await huntPost('campfirePost', {
            userId: gameState.userId,
            text: text
        });

        if (result.status === 'success' && result.entry) {
            // Add to local feed and re-render
            hallFeed.unshift({
                icon: 'campfire',
                type: 'campfire_message',
                emoji: '🔥',
                text: result.entry.text,
                handle: result.entry.handle || gameState.handle,
                senderTier: result.entry.senderTier || gameState.tier,
                senderLevel: result.entry.senderLevel != null ? result.entry.senderLevel : (gameState.level ? gameState.level.level : 0),
                timestamp: result.entry.timestamp
            });
            renderFeedBar();
        }
    } catch (err) {
        console.error('Campfire post failed:', err);
        showToast('Failed to post', 'warning');
    }

    btn.textContent = 'Send';
    btn.disabled = false;
}

function initCampfire() {
    document.getElementById('feedBarToggle').addEventListener('click', () => {
        const feedBar = document.getElementById('feedBar');
        const whoBar = document.getElementById('whoBar');
        // Close who-list if open
        if (whoBar.classList.contains('expanded')) whoBar.classList.remove('expanded');
        feedBar.classList.toggle('expanded');

        // Mark as viewed when opening
        if (feedBar.classList.contains('expanded')) {
            lastFeedViewed = Date.now();
            try { localStorage.setItem('hunt_lastFeedViewed', lastFeedViewed); } catch(e) {}
            updateFeedBadge();
            // Scroll to bottom (newest)
            const listEl = document.getElementById('feedBarList');
            setTimeout(() => { listEl.scrollTop = listEl.scrollHeight; }, 50);
        }
    });

    // Campfire admin posting
    document.getElementById('campfireSendBtn').addEventListener('click', () => sendCampfireMessage());
    document.getElementById('campfireInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendCampfireMessage();
    });

    // Close either overlay on tap outside
    document.addEventListener('click', (e) => {
        const whoBar = document.getElementById('whoBar');
        const feedBar = document.getElementById('feedBar');
        if (whoBar.classList.contains('expanded') && !whoBar.contains(e.target)) {
            whoBar.classList.remove('expanded');
        }
        if (feedBar.classList.contains('expanded') && !feedBar.contains(e.target)) {
            feedBar.classList.remove('expanded');
        }
    });
}
