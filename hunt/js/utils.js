// ==========================================
// TIME HELPERS
// ==========================================
function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
}

function getTimeLeft(isoDate) {
    const diff = new Date(isoDate) - new Date();
    if (diff <= 0) return '';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
}

// ==========================================
// HAVERSINE (client-side distance preview)
// ==========================================
function clientHaversine(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==========================================
// FEED EMOJI MAPPING
// ==========================================
function feedEmoji(iconType) {
    const map = {
        'realm': '🌿',
        'realm_enter': '🌿',
        'realm-exit': '🚪',
        'realm_exit': '🚪',
        'realm-idle': '💤',
        'realm_idle_exit': '💤',
        'realm-return': '🌅',
        'realm_return': '🌅',
        'streak': '🔥',
        'streak_milestone': '🔥',
        'validated': '✓',
        'first_validated': '✓',
        'tier': '⚔️',
        'tier_unlock': '⚔️',
        'event': '📯',
        'event_start': '📯',
        'event_end': '🏁',
        'material': '🧪',
        'material_trained': '🧪',
        'announcement': '📢',
        'admin_announcement': '📢',
        'campfire': '🔥',
        'campfire_message': '🔥',
        'level': '⬆️',
        'level_up': '⬆️'
    };
    return map[iconType] || '🌿';
}
