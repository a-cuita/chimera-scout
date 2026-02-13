// ==========================================
// TERRITORY MAP (Leaflet + Triangle Selection)
// ==========================================
let territoryMap = null;
let scoutMarkers = [];
let selectedScouts = [];
let triangleLines = [];
let sideLabels = [];
let scoutHistory = [];
let mapOpenerContext = 'scout'; // 'scout' or 'hunter'

async function openTerritorySelectionMap() {
    console.log('📐 Opening territory map...');
    document.getElementById('territoryMapContainer').classList.add('active');
    document.getElementById('mapResult').style.display = 'none';

    // Load scout history if not cached
    if (scoutHistory.length === 0 && gameState.userId && CONFIG.huntScriptUrl) {
        try {
            const result = await huntGet('getUserScoutHistory', { userId: gameState.userId });
            if (result.status === 'success') {
                scoutHistory = result.scouts || [];
            }
        } catch (err) {
            console.error('Failed to load scout history:', err);
        }
    }

    if (scoutHistory.length === 0) {
        document.getElementById('mapResult').style.display = 'block';
        document.getElementById('mapResult').className = 'map-result fail';
        document.getElementById('mapResult').innerHTML = 'No scout locations found. Go rate some locations first!';
        return;
    }

    // Init map if not exists
    if (!territoryMap) {
        territoryMap = L.map('territoryMap', {
            zoomControl: true,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(territoryMap);
    }

    // Clear old markers
    scoutMarkers.forEach(m => territoryMap.removeLayer(m));
    scoutMarkers = [];
    selectedScouts = [];
    clearTriangleVisuals();
    updateSelectionUI();

    // Create markers
    const bounds = L.latLngBounds();

    scoutHistory.forEach((scout, i) => {
        const latlng = L.latLng(scout.lat, scout.lon);
        bounds.extend(latlng);

        const marker = L.circleMarker(latlng, {
            radius: 10,
            fillColor: '#4eca8b',
            fillOpacity: 0.8,
            color: '#1e3828',
            weight: 2
        }).addTo(territoryMap);

        // Rating tooltip
        const ratingText = scout.rating ? `Rating: ${scout.rating}` : 'Scout';
        const dateText = scout.timestamp ? new Date(scout.timestamp).toLocaleDateString() : '';
        marker.bindTooltip(`${ratingText}<br>${dateText}`, { 
            direction: 'top', 
            offset: [0, -8],
            className: '' 
        });

        marker.scoutData = scout;
        marker.scoutIndex = i;

        marker.on('click', () => toggleScoutSelection(marker));

        scoutMarkers.push(marker);
    });

    // Fit map to markers
    if (bounds.isValid()) {
        territoryMap.fitBounds(bounds.pad(0.3));
    }

    // Invalidate size after show (Leaflet needs this)
    setTimeout(() => territoryMap.invalidateSize(), 100);
}

function toggleScoutSelection(marker) {
    const idx = selectedScouts.indexOf(marker);

    if (idx >= 0) {
        // Deselect
        selectedScouts.splice(idx, 1);
        marker.setStyle({ fillColor: '#4eca8b', color: '#1e3828', radius: 10 });
    } else if (selectedScouts.length < 3) {
        // Select
        selectedScouts.push(marker);
        marker.setStyle({ fillColor: '#e8b634', color: '#c49a2b', radius: 13 });
    }
    // Ignore clicks if already 3 selected

    clearTriangleVisuals();
    if (selectedScouts.length >= 2) drawTrianglePreview();
    updateSelectionUI();
}

function clearTriangleVisuals() {
    triangleLines.forEach(l => territoryMap.removeLayer(l));
    sideLabels.forEach(l => territoryMap.removeLayer(l));
    triangleLines = [];
    sideLabels = [];
}

function drawTrianglePreview() {
    const pts = selectedScouts.map(m => m.getLatLng());
    const data = selectedScouts.map(m => m.scoutData);

    // Draw lines between all selected points
    const pairs = selectedScouts.length === 3
        ? [[0,1], [1,2], [2,0]]
        : [[0,1]];

    pairs.forEach(([a, b]) => {
        const dist = clientHaversine(data[a].lat, data[a].lon, data[b].lat, data[b].lon);
        const inRange = dist >= 0.5 && dist <= 1.0;

        // Line
        const line = L.polyline([pts[a], pts[b]], {
            color: inRange ? '#4eca8b' : '#ef4444',
            weight: 3,
            dashArray: inRange ? null : '8, 6',
            opacity: 0.8
        }).addTo(territoryMap);
        triangleLines.push(line);

        // Distance label at midpoint
        const midLat = (pts[a].lat + pts[b].lat) / 2;
        const midLng = (pts[a].lng + pts[b].lng) / 2;

        const label = L.marker([midLat, midLng], {
            icon: L.divIcon({
                className: '',
                html: `<span class="map-side-label ${inRange ? '' : 'fail'}">${dist.toFixed(2)} mi</span>`,
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            })
        }).addTo(territoryMap);
        sideLabels.push(label);
    });
}

function updateSelectionUI() {
    document.getElementById('mapSelCount').textContent = selectedScouts.length;
    const btn = document.getElementById('mapValidateBtn');
    if (selectedScouts.length === 3) {
        btn.classList.add('ready');
    } else {
        btn.classList.remove('ready');
    }
}

// ==========================================
// TERRITORY EVENT HANDLERS
// ==========================================
function initTerritory() {
    document.getElementById('startTriangleBtn').addEventListener('click', () => {
        mapOpenerContext = 'scout';
        document.getElementById('triangleIntro').style.display = 'none';
        openTerritorySelectionMap();
    });

    document.getElementById('mapNewTerritoryBtn').addEventListener('click', () => {
        mapOpenerContext = 'hunter';
        openTerritorySelectionMap();
    });

    // Back button
    document.getElementById('mapBackBtn').addEventListener('click', () => {
        document.getElementById('territoryMapContainer').classList.remove('active');
        document.getElementById('mapResult').style.display = 'none';
        if (mapOpenerContext === 'scout') {
            document.getElementById('triangleIntro').style.display = 'block';
        }
    });

    // Validate button
    document.getElementById('mapValidateBtn').addEventListener('click', async () => {
        if (selectedScouts.length !== 3) return;

        const btn = document.getElementById('mapValidateBtn');
        btn.textContent = 'Validating...';
        btn.classList.remove('ready');

        const points = selectedScouts.map(m => ({
            sessionId: m.scoutData.sessionId,
            lat: m.scoutData.lat,
            lon: m.scoutData.lon
        }));

        try {
            const result = await huntPost('validateTriangle', {
                userId: gameState.userId,
                points: points
            });

            const resultDiv = document.getElementById('mapResult');
            resultDiv.style.display = 'block';

            if (result.valid) {
                if (result.tierUnlocked) {
                    resultDiv.className = 'map-result success';
                    resultDiv.innerHTML = `<strong>⚔️ Territory Proven!</strong><br>
                        Sides: ${result.sides.map(s => s + ' mi').join(' • ')}<br>
                        You've unlocked <strong>Hunter</strong> class!`;
                    gameState.tier = 'hunter';
                } else {
                    resultDiv.className = 'map-result success';
                    resultDiv.innerHTML = `<strong>🗺️ Territory Mapped!</strong><br>
                        Sides: ${result.sides.map(s => s + ' mi').join(' • ')}<br>
                        ${result.activeCount}/3 active territories`;
                }

                // Close map selection after brief delay, refresh state
                setTimeout(() => {
                    document.getElementById('territoryMapContainer').classList.remove('active');
                    document.getElementById('mapResult').style.display = 'none';
                    if (mapOpenerContext === 'scout') {
                        document.getElementById('triangleIntro').style.display = 'block';
                    }
                    // Re-enter to get fresh state with new triangle data
                    if (CONFIG.huntScriptUrl) {
                        fireEnterTheHunt();
                    }
                }, 1500);
            } else {
                resultDiv.className = 'map-result fail';
                resultDiv.innerHTML = `<strong>Triangle invalid</strong><br>${(result.failReasons || []).join('<br>')}`;
            }
        } catch (err) {
            console.error('Triangle validation error:', err);
            document.getElementById('mapResult').style.display = 'block';
            document.getElementById('mapResult').className = 'map-result fail';
            document.getElementById('mapResult').innerHTML = 'Validation failed — check your connection.';
        }

        btn.textContent = 'Validate Triangle';
        if (selectedScouts.length === 3) btn.classList.add('ready');
    });
}
