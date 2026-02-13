// ==========================================
// LEADERBOARD: Load from API
// ==========================================
async function loadLeaderboard(period, scope) {
    console.log('🏆 Loading leaderboard:', period, scope);
    document.getElementById('ranksList').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🏆</div>
            <div class="empty-state-text">Loading...</div>
        </div>
    `;

    const result = await huntGet('getLeaderboard', {
        userId: gameState.userId,
        period: period,
        scope: scope
    });

    if (result.status !== 'success') {
        document.getElementById('ranksList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Could not load leaderboard</div>
            </div>
        `;
        return;
    }

    if (!result.rankings || result.rankings.length === 0) {
        document.getElementById('ranksList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <div class="empty-state-text">No rankings yet.<br>Be the first!</div>
            </div>
        `;
        return;
    }

    const tierIcons = { scout: '🔍', hunter: '🗡️', tamer: '🐉', warden: '🛡️' };

    document.getElementById('ranksList').innerHTML = result.rankings.map(r => {
        const posClass = r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : r.rank === 3 ? 'bronze' : '';
        const selfClass = r.isSelf ? ' self' : '';

        return `
            <div class="rank-entry${selfClass}">
                <span class="rank-position ${posClass}">${r.rank}</span>
                <div class="rank-user">
                    <div class="rank-handle">${r.handle}</div>
                    <div class="rank-tier">${tierIcons[r.tier] || '🔍'} ${(r.tier || 'scout').charAt(0).toUpperCase() + (r.tier || 'scout').slice(1)}</div>
                </div>
                <span class="rank-xp">${r.xp.toLocaleString()} XP</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// RANK FILTERS
// ==========================================
function initRanks() {
    document.querySelectorAll('.ledger-filter-btn[data-rank]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ledger-filter-btn[data-rank]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const activeScope = document.querySelector('.ledger-filter-btn[data-scope].active');
            if (gameState.userId && CONFIG.huntScriptUrl) {
                loadLeaderboard(btn.dataset.rank, activeScope ? activeScope.dataset.scope : 'everyone');
            }
        });
    });

    document.querySelectorAll('.ledger-filter-btn[data-scope]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ledger-filter-btn[data-scope]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const activeRank = document.querySelector('.ledger-filter-btn[data-rank].active');
            if (gameState.userId && CONFIG.huntScriptUrl) {
                loadLeaderboard(activeRank ? activeRank.dataset.rank : 'alltime', btn.dataset.scope);
            }
        });
    });
}
