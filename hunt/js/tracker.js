// ==========================================
// TRACKER: Render progression screen
// ==========================================
let trackerTerritoryMap = null;
let trackerTriangleLayers = [];

function renderTracker() {
    // Tier roadmap
    const tiers = ['scout', 'hunter', 'tamer', 'warden'];
    const currentIdx = tiers.indexOf(gameState.tier);
    const progressPct = (currentIdx / (tiers.length - 1)) * 76; // 76% = visual max of bar

    document.getElementById('roadmapProgress').style.width = progressPct + '%';

    ['Scout', 'Hunter', 'Tamer', 'Warden'].forEach((name, i) => {
        const node = document.getElementById('node' + name);
        node.className = 'tier-node';
        if (i < currentIdx) node.classList.add('completed');
        if (i === currentIdx) node.classList.add('current');
    });

    // Section visibility by tier
    document.getElementById('trackerScoutSection').classList.toggle('hidden', gameState.tier !== 'scout');
    // Show hunter section for hunter+ (anyone who's completed triangle)
    document.getElementById('trackerHunterSection').classList.toggle('hidden', gameState.tier === 'scout');
    document.getElementById('trackerTamerSection').classList.toggle('hidden', 
        gameState.tier === 'scout' || gameState.tier === 'hunter');

    // Calibration: hide until there's real data
    const cal = gameState.calibration;
    const hasCalData = cal.divergence !== null || cal.bias !== null || cal.multiplier !== 1.0;
    document.getElementById('trackerCalibrationSection').classList.toggle('hidden', !hasCalData);

    // Calibration values (when visible)
    document.getElementById('calDivergence').textContent = cal.divergence !== null ? cal.divergence.toFixed(1) : '—';
    document.getElementById('calBias').textContent = cal.bias !== null ? (cal.bias > 0 ? 'Over +' : 'Under ') + cal.bias.toFixed(1) : '—';
    document.getElementById('calMultiplier').textContent = cal.multiplier.toFixed(2) + '×';

    // Render territory map if triangle data exists
    renderTerritoryMap();
}

// ==========================================
// TERRITORY MAP (read-only, multi-triangle)
// ==========================================
function renderTerritoryMap() {
    const triData = gameState.triangles || { triangles: [], activeCount: 0 };
    const tris = triData.triangles.filter(t => t.points);
    const container = document.getElementById('trackerTerritoryMap');
    const listEl = document.getElementById('trackerTriangleList');
    const countEl = document.getElementById('trackerTriangleCount');
    const card = document.getElementById('trackerTerritoryCard');
    const newBtnCard = document.getElementById('trackerMapNewBtn');

    // Show/hide map new territory button
    if (newBtnCard) {
        const atLimit = triData.activeCount >= 3;
        newBtnCard.style.display = 'block';
        const btn = document.getElementById('mapNewTerritoryBtn');
        if (atLimit) {
            btn.textContent = 'Max Territories (3/3)';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } else {
            btn.textContent = 'Map New Territory';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }

    if (tris.length === 0) {
        if (card) card.style.display = 'none';
        return;
    }
    if (card) card.style.display = 'block';

    // Count display
    if (countEl) countEl.textContent = triData.activeCount + '/3 active';

    // Triangle list with status
    if (listEl) {
        listEl.innerHTML = tris.map((t, i) => {
            const isActive = t.status === 'active';
            const color = isActive ? '#e8b634' : '#6b7280';
            const label = isActive ? 'Active' : 'Expired';
            const sidesStr = t.sides.map(s => s.toFixed(2) + ' mi').join(' · ');
            const timeLeft = isActive ? getTimeLeft(t.expiresAt) : '';
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:11px;border-top:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
                    <span style="color:var(--text-faint);">${sidesStr}</span>
                </div>
                <span style="color:${color};font-size:10px;">${label}${timeLeft ? ' · ' + timeLeft : ''}</span>
            </div>`;
        }).join('');
    }

    // Check if Tracker tab is currently visible
    const trackerScreen = document.getElementById('screenTracker');
    const isVisible = trackerScreen && trackerScreen.classList.contains('active');
    if (!isVisible) return; // Don't init map while hidden — tab switch will handle it

    // Clear old triangle layers
    trackerTriangleLayers.forEach(layer => {
        if (trackerTerritoryMap) trackerTerritoryMap.removeLayer(layer);
    });
    trackerTriangleLayers = [];

    // Init map once
    if (!trackerTerritoryMap) {
        trackerTerritoryMap = L.map(container, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18
        }).addTo(trackerTerritoryMap);
    }

    const allBounds = [];

    for (const tri of tris) {
        const pts = tri.points.map(p => [p.lat, p.lon]);
        const isActive = tri.status === 'active';

        const polygon = L.polygon(pts, {
            color: isActive ? '#e8b634' : '#6b7280',
            weight: isActive ? 2 : 1,
            fillColor: isActive ? '#e8b634' : '#6b7280',
            fillOpacity: isActive ? 0.12 : 0.05,
            dashArray: isActive ? null : '4 4'
        }).addTo(trackerTerritoryMap);
        trackerTriangleLayers.push(polygon);

        pts.forEach(pt => {
            const marker = L.circleMarker(pt, {
                radius: isActive ? 6 : 4,
                fillColor: isActive ? '#e8b634' : '#6b7280',
                color: '#fff',
                weight: isActive ? 2 : 1,
                fillOpacity: isActive ? 1 : 0.5
            }).addTo(trackerTerritoryMap);
            trackerTriangleLayers.push(marker);
            allBounds.push(pt);
        });
    }

    if (allBounds.length > 0) {
        trackerTerritoryMap.fitBounds(L.latLngBounds(allBounds).pad(0.2));
    }

    setTimeout(() => {
        if (trackerTerritoryMap) trackerTerritoryMap.invalidateSize();
    }, 100);
}
