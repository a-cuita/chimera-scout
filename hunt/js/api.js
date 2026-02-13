// ==========================================
// API CALLS
// ==========================================
async function huntPost(action, data = {}) {
    try {
        const response = await fetch(CONFIG.huntScriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action, token: sessionStorage.getItem('rh_token'), ...data })
        });
        return await response.json();
    } catch (err) {
        console.error('Hunt API error:', err);
        return { status: 'error', message: err.toString() };
    }
}

async function huntGet(action, params = {}) {
    const url = new URL(CONFIG.huntScriptUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('token', sessionStorage.getItem('rh_token'));
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }
    try {
        const response = await fetch(url.toString());
        return await response.json();
    } catch (err) {
        console.error('Hunt API error:', err);
        return { status: 'error', message: err.toString() };
    }
}
