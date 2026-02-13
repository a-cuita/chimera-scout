// ==========================================
// HALL: Render main screen
// ==========================================
function renderHall() {
    // Tier badge with level
    const badge = document.getElementById('hallTierBadge');
    const tierConfig = {
        scout: { icon: '🔍', label: 'Scout', class: 'scout' },
        hunter: { icon: '🗡️', label: 'Hunter', class: 'hunter' },
        tamer: { icon: '🐉', label: 'Tamer', class: 'tamer' },
        warden: { icon: '🛡️', label: 'Warden', class: 'warden' }
    };
    const tc = tierConfig[gameState.tier];
    const lvl = gameState.level || { level: 0, xpIntoLevel: 0, xpForNextLevel: 100 };
    badge.className = `tier-badge ${tc.class}`;
    badge.innerHTML = `<span class="tier-badge-icon">${tc.icon}</span><span>${tc.label} • Lvl ${lvl.level}</span>`;

    // XP header
    document.getElementById('headerXP').textContent = gameState.totalXP.toLocaleString();

    // Level progress bar
    const pct = lvl.xpForNextLevel > 0 ? Math.round((lvl.xpIntoLevel / lvl.xpForNextLevel) * 100) : 0;
    document.getElementById('hallProgressText').textContent = `${lvl.xpIntoLevel} / ${lvl.xpForNextLevel} XP to Lvl ${lvl.level + 1}`;
    document.getElementById('hallProgressPct').textContent = pct + '%';
    document.getElementById('hallProgressFill').style.width = pct + '%';

    // Next tier hint
    const nextTiers = { scout: 'Hunter', hunter: 'Tamer', tamer: 'Warden', warden: null };
    const nextEl = document.getElementById('hallNextTier');
    nextEl.textContent = nextTiers[gameState.tier] ? `Next tier: ${nextTiers[gameState.tier]}` : 'Max tier reached';

    // Streaks
    const ss = gameState.scoutStreak;
    const sEl = document.getElementById('hallScoutStreak');
    sEl.textContent = (ss.status === 'active' ? '🔥 ' : '— ') + ss.count;
    sEl.className = `streak-value ${ss.status === 'active' ? 'streak-fire' : 'streak-dead'}`;
    
    const ssStatus = document.getElementById('hallScoutStatus');
    ssStatus.textContent = ss.status.charAt(0).toUpperCase() + ss.status.slice(1);
    ssStatus.className = `streak-status ${ss.status}`;

    const hs = gameState.hunterStreak;
    const hEl = document.getElementById('hallHunterStreak');
    if (gameState.tier === 'scout') {
        hEl.textContent = '🔒 —';
        hEl.className = 'streak-value streak-dead';
    } else {
        hEl.textContent = (hs.status === 'active' ? '🔥 ' : '— ') + hs.count;
        hEl.className = `streak-value ${hs.status === 'active' ? 'streak-fire' : 'streak-dead'}`;
    }
}

// ==========================================
// ONBOARDING
// ==========================================
function showOnboarding() {
    const hallList = document.getElementById('hallActivityList');
    hallList.style.display = 'block';
    hallList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🌲</div>
            <div class="empty-state-text">
                Welcome, traveler.<br><br>
                The Hunt transforms cleanup data collection into an adventure.
                Scout locations, build streaks, earn XP, and prove your territory.<br><br>
            </div>
            <button class="triangle-btn" id="enrollConfirmBtn" style="margin-top: 12px;">Enter the Hunt</button>
        </div>
    `;
    document.getElementById('enrollConfirmBtn').addEventListener('click', () => {
        fireEnrollUser();
    });
}

async function fireEnrollUser() {
    const result = await huntPost('enrollUser', { userId: gameState.userId });
    if (result.status === 'success' && result.enrolled) {
        showToast('Welcome to the Hunt.');
        fireEnterTheHunt();
    } else {
        showToast('Enrollment failed: ' + (result.message || 'Unknown error'), 'warning');
    }
}

// ==========================================
// QUICK ACTIONS - Link back to CHIMERA with handshake
// ==========================================
function initHall() {
    document.getElementById('actionScout').addEventListener('click', () => {
        window.location.href = CONFIG.chimeraUrl + '?from=hunt&action=scout';
    });

    document.getElementById('actionCollect').addEventListener('click', () => {
        window.location.href = CONFIG.chimeraUrl + '?from=hunt&action=collect';
    });
}
