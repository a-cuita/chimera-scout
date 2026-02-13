// ==========================================
// PROFILE MODAL
// ==========================================
async function openProfile(userId) {
    const tierIcons = { scout: '🔍', hunter: '🗡️', tamer: '🐉', warden: '🛡️' };
    const tierNames = { scout: 'Scout', hunter: 'Hunter', tamer: 'Tamer', warden: 'Warden' };
    const isMe = userId === gameState.userId;

    const profileOverlay = document.getElementById('profileOverlay');
    const profileTitleInput = document.getElementById('profileTitleInput');
    const profileBioInput = document.getElementById('profileBioInput');

    // Show modal immediately with loading state
    document.getElementById('profileHandle').textContent = 'Loading...';
    document.getElementById('profileTitleDisplay').textContent = '';
    document.getElementById('profileTierIcon').textContent = '⏳';
    document.getElementById('profileTier').textContent = '—';
    document.getElementById('profileLevel').textContent = '—';
    document.getElementById('profileXP').textContent = '—';
    document.getElementById('profileViewMode').style.display = 'none';
    document.getElementById('profileEditMode').style.display = 'none';
    document.getElementById('profileEnrolled').textContent = '';
    profileOverlay.classList.add('active');

    try {
        const result = await huntGet('getProfile', { userId: userId });
        if (result.status !== 'success') {
            document.getElementById('profileHandle').textContent = 'Error loading profile';
            return;
        }

        const p = result.profile;
        const tier = p.tier || 'scout';
        const handle = p.handle || userId;
        const epithet = p.characterTitle || '';

        // Header — always show handle, epithet below if set
        document.getElementById('profileTierIcon').textContent = tierIcons[tier] || '🔍';
        document.getElementById('profileHandle').textContent = handle;
        document.getElementById('profileTitleDisplay').textContent = epithet ? `${handle} ${epithet}` : '';

        // Stats
        document.getElementById('profileTier').textContent = tierNames[tier] || 'Scout';
        document.getElementById('profileLevel').textContent = p.level ? p.level.level : '1';
        document.getElementById('profileXP').textContent = (p.totalXP || 0).toLocaleString();

        // Enrolled date
        if (p.enrolledAt) {
            const d = new Date(p.enrolledAt);
            document.getElementById('profileEnrolled').textContent = 'Joined ' + d.toLocaleDateString();
        }

        if (isMe) {
            // Edit mode
            document.getElementById('profileViewMode').style.display = 'none';
            document.getElementById('profileEditMode').style.display = 'block';
            document.getElementById('profileHandleLocked').textContent = handle;
            profileTitleInput.value = epithet;
            profileBioInput.value = p.characterBio || '';
            document.getElementById('profileTitleCount').textContent = profileTitleInput.value.length;
            document.getElementById('profileBioCount').textContent = profileBioInput.value.length;
        } else {
            // View mode
            document.getElementById('profileEditMode').style.display = 'none';
            document.getElementById('profileViewMode').style.display = 'block';
            const bioView = document.getElementById('profileBioView');
            bioView.textContent = p.characterBio || '';
            bioView.className = p.characterBio ? 'profile-bio-text' : 'profile-bio-empty';
            if (!p.characterBio) bioView.textContent = 'No bio written yet';
        }
    } catch (err) {
        console.error('Profile load error:', err);
        document.getElementById('profileHandle').textContent = 'Failed to load';
    }
}

function closeProfile() {
    document.getElementById('profileOverlay').classList.remove('active');
}

function initProfile() {
    const profileOverlay = document.getElementById('profileOverlay');
    const profileTitleInput = document.getElementById('profileTitleInput');
    const profileBioInput = document.getElementById('profileBioInput');
    const profileSaveBtn = document.getElementById('profileSaveBtn');

    // Close modal
    document.getElementById('profileClose').addEventListener('click', () => closeProfile());
    profileOverlay.addEventListener('click', (e) => {
        if (e.target === profileOverlay) closeProfile();
    });

    // Character counters
    profileTitleInput.addEventListener('input', () => {
        document.getElementById('profileTitleCount').textContent = profileTitleInput.value.length;
    });
    profileBioInput.addEventListener('input', () => {
        document.getElementById('profileBioCount').textContent = profileBioInput.value.length;
    });

    // Save profile
    profileSaveBtn.addEventListener('click', async () => {
        profileSaveBtn.textContent = 'Saving...';
        profileSaveBtn.disabled = true;
        try {
            const result = await huntPost('updateProfile', {
                userId: gameState.userId,
                characterTitle: profileTitleInput.value.trim(),
                characterBio: profileBioInput.value.trim()
            });
            if (result.status === 'success') {
                const newTitle = profileTitleInput.value.trim();
                // Update local gameState
                gameState.profile = {
                    characterTitle: newTitle,
                    characterBio: profileBioInput.value.trim()
                };
                // Update display title in modal
                const handle = gameState.handle || gameState.userId;
                document.getElementById('profileTitleDisplay').textContent = newTitle ? `${handle} ${newTitle}` : '';
                // Update who list to reflect new title
                const me = whoList.find(u => u.userId === gameState.userId);
                if (me) me.characterTitle = newTitle;
                renderWhoList();
                showToast('Profile saved!');
                closeProfile();
            } else {
                showToast('Save failed: ' + (result.message || 'unknown error'));
            }
        } catch (err) {
            console.error('Profile save error:', err);
            showToast('Save failed');
        } finally {
            profileSaveBtn.textContent = 'Save Profile';
            profileSaveBtn.disabled = false;
        }
    });
}
