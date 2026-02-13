// ==========================================
// AUTH - Read from CHIMERA's session
// ==========================================
function loadAuth() {
    const saved = sessionStorage.getItem('chimera_user');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            gameState.userId = user.userId;
            gameState.handle = user.handle;
            return true;
        } catch (e) { return false; }
    }
    return false;
}

// ==========================================
// TAB NAVIGATION
// ==========================================
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const screens = document.querySelectorAll('.screen');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            screens.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Fire API calls on tab switch
            if (targetId === 'screenLedger' && gameState.userId && CONFIG.huntScriptUrl) {
                const activeFilter = document.querySelector('.ledger-filter-btn[data-filter].active');
                loadLedger(activeFilter ? activeFilter.dataset.filter : 'all');
            }
            if (targetId === 'screenRanks' && gameState.userId && CONFIG.huntScriptUrl) {
                const activeRank = document.querySelector('.ledger-filter-btn[data-rank].active');
                const activeScope = document.querySelector('.ledger-filter-btn[data-scope].active');
                loadLeaderboard(
                    activeRank ? activeRank.dataset.rank : 'alltime',
                    activeScope ? activeScope.dataset.scope : 'everyone'
                );
            }
            if (targetId === 'screenTracker') {
                // Leaflet maps need invalidateSize when container becomes visible
                setTimeout(() => {
                    if (trackerTerritoryMap) {
                        trackerTerritoryMap.invalidateSize();
                    } else {
                        renderTerritoryMap();
                    }
                }, 150);
            }
        });
    });
}

// ==========================================
// ENTER THE HUNT (main API call)
// ==========================================
async function fireEnterTheHunt() {
    console.log('🏰 Entering the Hunt...');
    showHuntLoading('Entering the realm...', '🌿');
    const result = await huntPost('enterTheHunt', { userId: gameState.userId });

    if (result.status === 'error') {
        console.error('enterTheHunt failed:', result.message);
        showToast('Connection error — loading demo data', 'warning');
        loadDemoData();
        renderHall();
        renderWhoList();
        renderHallFeed();
        renderTracker();
        hideHuntLoading();
        return;
    }

    if (!result.enrolled) {
        console.log('🆕 User not enrolled — show onboarding');
        showOnboarding();
        hideHuntLoading();
        return;
    }

    // Apply live game state
    const gs = result.gameState;
    gameState.tier = gs.tier;
    gameState.totalXP = gs.totalXP;
    gameState.level = gs.level || { level: 0, xpIntoLevel: 0, xpForNextLevel: 100 };
    gameState.scoutStreak = gs.scoutStreak;
    gameState.hunterStreak = gs.hunterStreak;
    gameState.calibration = {
        divergence: gs.calibration.avgDivergence,
        bias: gs.calibration.biasTrend,
        multiplier: gs.calibration.multiplier
    };
    gameState.triangleComplete = gs.triangleComplete;
    gameState.triangles = gs.triangles || { triangles: [], activeCount: 0 };
    gameState.profile = gs.profile || { characterTitle: '', characterBio: '' };
    gameState.isAdmin = result.isAdmin || false;

    // Apply live Hall feed
    hallFeed = (result.hallFeed || []).map(e => ({
        icon: e.icon || 'realm',
        type: e.type || e.icon || 'realm',
        emoji: feedEmoji(e.icon || e.type),
        text: e.text,
        handle: e.handle || '',
        senderTier: e.senderTier || null,
        senderLevel: e.senderLevel != null ? e.senderLevel : null,
        timestamp: e.timestamp
    }));

    // Apply live who-list
    whoList = (result.whoList || []).map(u => ({
        userId: u.userId,
        handle: u.handle,
        tier: u.tier,
        enteredAt: u.enteredAt,
        lastHeartbeat: u.lastHeartbeat,
        idleMinutes: u.idleMinutes || 0,
        level: u.level || { level: 1 },
        characterTitle: u.characterTitle || ''
    }));

    // Show new XP awards
    if (result.newXPAwarded && result.newXPAwarded.length > 0) {
        const totalNew = result.newXPAwarded.reduce((sum, x) => sum + x.finalXP, 0);
        showToast(`+${totalNew} XP earned!`);
    }

    renderHall();
    renderWhoList();
    renderHallFeed();
    renderTracker();
    hideHuntLoading();
    console.log('✅ Hunt loaded. Tier:', gs.tier, 'XP:', gs.totalXP);
}

// ==========================================
// HALL FEED RENDERING (delegates to campfire)
// ==========================================
function renderHallFeed() {
    renderFeedBar();
}

// ==========================================
// HEARTBEAT (keep presence alive)
// ==========================================
function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        if (gameState.userId && CONFIG.huntScriptUrl) {
            huntPost('heartbeat', { userId: gameState.userId });
            console.log('💓 Heartbeat');
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

// ==========================================
// DEMO DATA (placeholder until endpoints exist)
// ==========================================
function loadDemoData() {
    gameState.totalXP = 342;
    gameState.tier = 'hunter';
    gameState.triangleComplete = true;
    gameState.scoutStreak = { count: 7, status: 'active' };
    gameState.hunterStreak = { count: 0, status: 'locked' };
    gameState.calibration = { divergence: 1.8, bias: -0.4, multiplier: 1.10 };
    gameState.isAdmin = true;

    // Demo triangles
    const now24ago = new Date(Date.now() - 20 * 3600000).toISOString();
    const now30ago = new Date(Date.now() - 30 * 3600000).toISOString();
    gameState.triangles = {
        activeCount: 1,
        triangles: [
            {
                triangleId: 'tri_demo1',
                status: 'active',
                points: [
                    { lat: 32.3792, lon: -86.3077 },
                    { lat: 32.3730, lon: -86.2990 },
                    { lat: 32.3685, lon: -86.3060 }
                ],
                sides: [0.68, 0.55, 0.73],
                createdAt: now24ago,
                lastActiveAt: now24ago,
                expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
                wipesAt: new Date(Date.now() + 28 * 3600000).toISOString()
            },
            {
                triangleId: 'tri_demo2',
                status: 'expired',
                points: [
                    { lat: 32.3850, lon: -86.3150 },
                    { lat: 32.3810, lon: -86.3070 },
                    { lat: 32.3770, lon: -86.3180 }
                ],
                sides: [0.61, 0.72, 0.58],
                createdAt: now30ago,
                lastActiveAt: now30ago,
                expiresAt: new Date(Date.now() - 6 * 3600000).toISOString(),
                wipesAt: new Date(Date.now() + 18 * 3600000).toISOString()
            }
        ]
    };

    // Demo who-list (live presence)
    const now = new Date();
    whoList = [
        { userId: 'demo_jeff', handle: 'MightyJeff', tier: 'scout', enteredAt: new Date(now - 42 * 60000).toISOString(), lastHeartbeat: new Date(now - 42 * 60000).toISOString(), idleMinutes: 42, level: { level: 3 }, characterTitle: '' },
        { userId: 'demo_pirates', handle: 'Pirates17', tier: 'scout', enteredAt: new Date(now - 3 * 60000).toISOString(), lastHeartbeat: new Date(now - 3 * 60000).toISOString(), idleMinutes: 3, level: { level: 7 }, characterTitle: 'Pirates the Relentless' },
        { userId: 'demo_jejones', handle: 'jejones', tier: 'hunter', enteredAt: new Date(now - 18 * 60000).toISOString(), lastHeartbeat: new Date(now - 18 * 60000).toISOString(), idleMinutes: 18, level: { level: 12 }, characterTitle: '' }
    ];

    // Demo Hall feed (global events — no personal XP)
    hallFeed = [
        {
            icon: 'campfire',
            type: 'campfire_message',
            emoji: '🔥',
            text: 'anyone hitting the east side today?',
            handle: 'Pirates17',
            senderTier: 'scout',
            senderLevel: 7,
            timestamp: new Date(now - 1 * 60000).toISOString()
        },
        {
            icon: 'realm',
            type: 'realm_enter',
            emoji: '🌿',
            text: 'Pirates17 entered the realm',
            timestamp: new Date(now - 3 * 60000).toISOString()
        },
        {
            icon: 'campfire',
            type: 'campfire_message',
            emoji: '🔥',
            text: 'just wrapped a collection run on Fairview — way worse than my rating predicted',
            handle: 'jejones',
            senderTier: 'hunter',
            senderLevel: 12,
            timestamp: new Date(now - 15 * 60000).toISOString()
        },
        {
            icon: 'realm',
            type: 'realm_enter',
            emoji: '🌿',
            text: 'jejones entered the realm',
            timestamp: new Date(now - 18 * 60000).toISOString()
        },
        {
            icon: 'streak',
            type: 'streak_milestone',
            emoji: '🔥',
            text: 'MightyJeff hit a 14-day scout streak!',
            timestamp: new Date(now - 35 * 60000).toISOString()
        },
        {
            icon: 'campfire',
            type: 'campfire_message',
            emoji: '🔥',
            text: 'morning crew checking in',
            handle: 'MightyJeff',
            senderTier: 'scout',
            senderLevel: 3,
            timestamp: new Date(now - 40 * 60000).toISOString()
        },
        {
            icon: 'realm',
            type: 'realm_enter',
            emoji: '🌿',
            text: 'MightyJeff entered the realm',
            timestamp: new Date(now - 42 * 60000).toISOString()
        },
        {
            icon: 'validated',
            type: 'first_validated',
            emoji: '✓',
            text: 'Pirates17 had a scout rating validated',
            timestamp: new Date(now - 2 * 3600000).toISOString()
        },
        {
            icon: 'realm-exit',
            type: 'realm_exit',
            emoji: '🚪',
            text: 'CLTcollector departed the realm',
            timestamp: new Date(now - 3 * 3600000).toISOString()
        },
        {
            icon: 'tier',
            type: 'tier_unlock',
            emoji: '⚔️',
            text: 'MightyJeff has proven their territory — Hunter unlocked!',
            timestamp: new Date(now - 5 * 3600000).toISOString()
        },
        {
            icon: 'event',
            type: 'event_start',
            emoji: '📯',
            text: 'Cleanup event started: Fairview Ave Saturday Sweep',
            timestamp: new Date(now - 24 * 3600000).toISOString()
        },
        {
            icon: 'realm',
            type: 'realm_enter',
            emoji: '🌿',
            text: 'CLTcollector entered the realm',
            timestamp: new Date(now - 26 * 3600000).toISOString()
        }
    ];

    // Demo ledger (personal XP)
    const ledgerHTML = `
        <div class="ledger-entry">
            <div class="ledger-entry-top">
                <span class="ledger-entry-source">Scout Validated Bonus</span>
                <span class="ledger-entry-xp">+45 XP</span>
            </div>
            <div class="ledger-entry-detail">Oak Park • Rating accuracy: 0.8 divergence</div>
            <div class="ledger-entry-breakdown">
                Base bonus: 50 XP<br>
                Accuracy band (0.5–1.5): 40 XP<br>
                Calibration ×1.10: 45 XP
            </div>
        </div>
        <div class="ledger-entry">
            <div class="ledger-entry-top">
                <span class="ledger-entry-source">Scout Streak Day 7</span>
                <span class="ledger-entry-xp">+24 XP</span>
            </div>
            <div class="ledger-entry-detail">Daily streak • Base 10 + escalation 12</div>
            <div class="ledger-entry-breakdown">
                Base XP: 10<br>
                Escalation (+2/day × 6): +12<br>
                Calibration ×1.10: 24.2 → 24 XP
            </div>
        </div>
        <div class="ledger-entry">
            <div class="ledger-entry-top">
                <span class="ledger-entry-source">Scout Streak Day 6</span>
                <span class="ledger-entry-xp">+22 XP</span>
            </div>
            <div class="ledger-entry-detail">Daily streak • Base 10 + escalation 10</div>
            <div class="ledger-entry-breakdown">
                Base XP: 10<br>
                Escalation (+2/day × 5): +10<br>
                Calibration ×1.10: 22 XP
            </div>
        </div>
    `;
    document.getElementById('ledgerEntries').innerHTML = ledgerHTML;
    document.getElementById('ledgerTotal').textContent = '342 XP';

    // Demo leaderboard
    const ranksHTML = `
        <div class="rank-entry">
            <span class="rank-position gold">1</span>
            <div class="rank-user">
                <div class="rank-handle">MightyJeff</div>
                <div class="rank-tier">🔍 Scout</div>
            </div>
            <span class="rank-xp">1,247 XP</span>
        </div>
        <div class="rank-entry self">
            <span class="rank-position silver">2</span>
            <div class="rank-user">
                <div class="rank-handle">Pirates17</div>
                <div class="rank-tier">🔍 Scout</div>
            </div>
            <span class="rank-xp">342 XP</span>
        </div>
        <div class="rank-entry">
            <span class="rank-position bronze">3</span>
            <div class="rank-user">
                <div class="rank-handle">jejones</div>
                <div class="rank-tier">🔍 Scout</div>
            </div>
            <span class="rank-xp">189 XP</span>
        </div>
    `;
    document.getElementById('ranksList').innerHTML = ranksHTML;

    // Progress bar
    document.getElementById('hallProgressText').textContent = '342 / 500 XP';
    document.getElementById('hallProgressPct').textContent = '68%';
    document.getElementById('hallProgressFill').style.width = '68%';
}

// ==========================================
// INIT
// ==========================================
window.addEventListener('load', () => {
    // Init all modules
    initTabs();
    initHall();
    initLedger();
    initRanks();
    initTerritory();
    initWhoList();
    initCampfire();
    initProfile();

    // Back to CHIMERA
    document.getElementById('backToChimera').addEventListener('click', () => {
        exitRealm();
    });

    const hasAuth = loadAuth();
    const params = new URLSearchParams(window.location.search);

    // Check if returning from CHIMERA action
    if (params.get('completed')) {
        const action = params.get('completed');
        const sessionId = params.get('sessionId');
        console.log(`🎯 Returned from CHIMERA: ${action} (session: ${sessionId})`);
        // Clean URL before firing sync
        window.history.replaceState({}, '', window.location.pathname);
    }

    if (hasAuth && CONFIG.huntScriptUrl) {
        // Fire real API
        fireEnterTheHunt();
    } else if (params.get('demo') !== null) {
        // Demo mode (explicit only via ?demo)
        console.warn('Demo mode: loading sample data.');
        loadDemoData();
        renderHall();
        renderWhoList();
        renderHallFeed();
        renderTracker();
    } else {
        // No auth — show gate
        document.querySelector('.content').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 70vh; text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                <div style="font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px;">Enter Through CHIMERA</div>
                <div style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; max-width: 280px;">
                    The Hunt requires an active CHIMERA session. Log in to CHIMERA first, then enter the Hunt from there.
                </div>
                <a href="${CONFIG.chimeraUrl}" style="padding: 12px 28px; background: var(--success); color: var(--bg-deep); border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">Go to CHIMERA</a>
            </div>
        `;
        return;
    }

    startHeartbeat();
});
