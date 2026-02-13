// ==========================================
// LEDGER: Load from API
// ==========================================
async function loadLedger(filter) {
    console.log('📒 Loading ledger:', filter);
    document.getElementById('ledgerEntries').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📒</div>
            <div class="empty-state-text">Loading...</div>
        </div>
    `;

    const result = await huntGet('getXPLedger', { userId: gameState.userId, filter: filter });

    if (result.status !== 'success') {
        document.getElementById('ledgerEntries').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Could not load ledger</div>
            </div>
        `;
        return;
    }

    document.getElementById('ledgerTotal').textContent = (result.totalXP || 0).toLocaleString() + ' XP';

    if (!result.entries || result.entries.length === 0) {
        document.getElementById('ledgerEntries').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📒</div>
                <div class="empty-state-text">No XP entries for this period.</div>
            </div>
        `;
        return;
    }

    document.getElementById('ledgerEntries').innerHTML = result.entries.map(e => {
        const details = e.details || {};
        let breakdownHTML = '';

        if (e.source === 'scout_streak') {
            breakdownHTML = `
                Base XP: ${details.base || '—'}<br>
                Escalation: +${details.escalation || 0}<br>
                Calibration ×${(details.calibrationMultiplier || 1).toFixed(2)}: ${e.finalXP} XP
            `;
        } else if (e.source === 'hunter_streak') {
            breakdownHTML = `
                Base XP: ${details.base || '—'}<br>
                Escalation: +${details.escalation || 0}<br>
                Calibration ×${(details.calibrationMultiplier || 1).toFixed(2)}: ${e.finalXP} XP
            `;
        } else if (e.source === 'scout_validated') {
            breakdownHTML = `
                Scout rating: ${details.scoutRating || '—'}<br>
                √CPUE: ${details.sqrtCpue || '—'}<br>
                Divergence: ${details.divergence !== undefined ? details.divergence.toFixed(1) : '—'}<br>
                Accuracy band: ${details.accuracyBand || '—'}<br>
                Calibration ×${(details.calibrationMultiplier || 1).toFixed(2)}: ${e.finalXP} XP
            `;
        } else if (e.source === 'multi_collection') {
            breakdownHTML = `Collection #${details.collectionNumber || '—'} this week`;
        } else if (e.source === 'tier_unlock') {
            breakdownHTML = `Territory proven! Triangle validated.`;
        } else {
            breakdownHTML = JSON.stringify(details);
        }

        const sourceLabels = {
            'scout_streak': '🔥 Scout Streak',
            'hunter_streak': '🗡️ Hunter Streak',
            'scout_validated': '✓ Scout Validated',
            'multi_collection': '📦 Multi-Collection',
            'tier_unlock': '⚔️ Tier Unlock',
            'event_bonus': '📯 Event Bonus'
        };

        return `
            <div class="ledger-entry">
                <div class="ledger-entry-top">
                    <span class="ledger-entry-source">${sourceLabels[e.source] || e.source}</span>
                    <span class="ledger-entry-xp">+${e.finalXP} XP</span>
                </div>
                <div class="ledger-entry-detail">${e.description}</div>
                <div class="ledger-entry-breakdown">${breakdownHTML}</div>
            </div>
        `;
    }).join('');
}

// ==========================================
// LEDGER FILTERS + EXPAND/COLLAPSE
// ==========================================
function initLedger() {
    document.querySelectorAll('.ledger-filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ledger-filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (gameState.userId && CONFIG.huntScriptUrl) {
                loadLedger(btn.dataset.filter);
            }
        });
    });

    // Ledger entry expand/collapse
    document.getElementById('ledgerEntries').addEventListener('click', (e) => {
        const entry = e.target.closest('.ledger-entry');
        if (entry) entry.classList.toggle('expanded');
    });
}
