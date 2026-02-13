// ==========================================
// TOAST
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✓' : '⚠';
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-message">${message}</div>`;
    container.appendChild(toast);
    container.classList.add('show');
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.classList.remove('show');
        }, 300);
    }, 3000);
}

// ==========================================
// LOADING OVERLAY
// ==========================================
function showHuntLoading(text, icon) {
    const overlay = document.getElementById('huntLoadingOverlay');
    document.getElementById('huntLoadingText').textContent = text || 'Entering the realm...';
    document.getElementById('huntLoadingIcon').textContent = icon || '🌿';
    overlay.classList.add('active');
}

function hideHuntLoading() {
    document.getElementById('huntLoadingOverlay').classList.remove('active');
}
