document.addEventListener('DOMContentLoaded', () => {
    // Quick Lanyard API test
    console.log('🚀 Fetching Lanyard...');
    fetch("https://api.lanyard.rest/v1/users/1135660695338352721")
        .then((res) => {
            console.log('Response status:', res.status);
            return res.json();
        })
        .then((data) => {
            console.log('📊 Lanyard data:', data);
            if (data.data) {
                console.log('Discord user:', data.data.discord_user.username);
                console.log('Status:', data.data.discord_status);
                console.log('Listening to Spotify:', data.data.listening_to_spotify);
            } else {
                console.warn('❌ No data in response');
            }
        })
        .catch((err) => console.error('❌ Fetch failed:', err));

    const copyBtn = document.getElementById('copy-discord');
    const toast = document.getElementById('toast');

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        toast.setAttribute('aria-hidden', 'false');
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toast.setAttribute('aria-hidden', 'true');
        }, 2600);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async() => {
            const el = document.getElementById('discord-name');
            if (!el) return showToast('No Discord set');
            const text = el.textContent.trim();
            try {
                await navigator.clipboard.writeText(text);
                showToast('Discord copied!');
            } catch (e) {
                showToast('Copy failed — select and copy manually');
            }
        });
    }

    // Create subtle floating orbs for background depth
    function createOrbs(count = 10) {
        for (let i = 0; i < count; i++) {
            const orb = document.createElement('div');
            orb.className = 'orb';
            const size = Math.round(30 + Math.random() * 160);
            orb.style.width = size + 'px';
            orb.style.height = size + 'px';
            orb.style.left = Math.random() * 100 + '%';
            orb.style.top = Math.random() * 100 + '%';
            orb.style.background = `radial-gradient(circle at 30% 30%, rgba(0,255,140,0.18), rgba(0,150,80,0.06) 40%, transparent 70%)`;
            orb.style.opacity = (0.06 + Math.random() * 0.12).toString();
            orb.style.zIndex = -1;
            document.body.appendChild(orb);

            const dist = 20 + Math.random() * 140;
            const dur = 7000 + Math.random() * 16000;
            orb.animate([
                { transform: 'translateY(0px) scale(1)' },
                { transform: `translateY(-${dist}px) scale(${1+Math.random()*0.18})` },
                { transform: 'translateY(0px) scale(1)' }
            ], { duration: dur, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: Math.random() * 3000 });
        }
    }

    createOrbs(12);

    // ---- Lanyard integration (polling) ----
    // Set your Discord numeric user ID here (snowflake). Replace the placeholder.
    const LANYARD_USER_ID = '1135660695338352721';
    const POLL_MS = 8000;

    function setOffline() {
        const nameEl = document.getElementById('discord-name');
        const statusEl = document.getElementById('discord-status');
        const activityEl = document.getElementById('discord-activity');
        const avatarEl = document.getElementById('discord-avatar');
        const spTitle = document.getElementById('spotify-title');
        const spArtist = document.getElementById('spotify-artist');
        const spArt = document.getElementById('spotify-art');
        const spBar = document.querySelector('#spotify-progress .progress-bar');

        if (nameEl) nameEl.textContent = 'Unknown#0000';
        if (statusEl) statusEl.textContent = 'offline';
        if (activityEl) activityEl.textContent = '';
        if (avatarEl) avatarEl.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        if (spTitle) spTitle.textContent = 'Not listening';
        if (spArtist) spArtist.textContent = '';
        if (spArt) spArt.src = '';
        if (spBar) spBar.style.width = '0%';
    }

    async function fetchLanyard() {
        if (!LANYARD_USER_ID) {
            console.warn('Lanyard: LANYARD_USER_ID not set');
            return;
        }
        try {
            const res = await fetch(`https://api.lanyard.rest/v1/users/${LANYARD_USER_ID}`);
            if (!res.ok) throw new Error('Fetch error');
            const json = await res.json();
            const d = json.data;
            if (!d) return setOffline();

            // Discord user
            const nameEl = document.getElementById('discord-name');
            const statusEl = document.getElementById('discord-status');
            const activityEl = document.getElementById('discord-activity');
            const avatarEl = document.getElementById('discord-avatar');
            if (nameEl) nameEl.textContent = `${d.discord_user.username}#${d.discord_user.discriminator}`;
            if (statusEl) statusEl.textContent = d.discord_status || 'offline';
            if (avatarEl && d.discord_user.avatar) avatarEl.src = `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.png?size=128`;

            // Activity (non-spotify) - render rich activity (icon, title, details, timer)
            if (activityEl) {
                const activity = Array.isArray(d.activities) && d.activities.length ? (d.activities.find(a => a.type !== 4 && a.type !== 2) || d.activities[0]) : null;
                const iconEl = document.getElementById('activity-icon');
                const titleEl = document.getElementById('activity-title');
                const detailsEl = document.getElementById('activity-details');
                const timerEl = document.getElementById('activity-timer');

                if (!activity) {
                    if (titleEl) titleEl.textContent = '';
                    if (detailsEl) detailsEl.textContent = '';
                    if (iconEl) iconEl.style.display = 'none';
                    if (timerEl) timerEl.textContent = '';
                } else {
                    const title = activity.name || '';
                    const details = activity.details || activity.state || '';
                    if (titleEl) titleEl.textContent = title;
                    if (detailsEl) detailsEl.textContent = details;

                    // Workspace extraction (often in activity.state like "Workspace: Personal website")
                    const workspaceEl = document.getElementById('activity-workspace');
                    if (workspaceEl) {
                        let workspaceText = '';
                        if (activity.state && activity.state.includes('Workspace')) {
                            const m = activity.state.match(/Workspace:\s*(.*)/i);
                            if (m && m[1]) workspaceText = m[1];
                        } else if (activity.details && activity.details.toLowerCase().includes('workspace')) {
                            const m = activity.details.match(/Workspace:\s*(.*)/i);
                            if (m && m[1]) workspaceText = m[1];
                        }
                        // fallback: if state is short and not equal to details, show it
                        if (!workspaceText && activity.state && activity.state.length < 60 && activity.state !== activity.details) {
                            workspaceText = activity.state;
                        }
                        workspaceEl.textContent = workspaceText ? `Workspace: ${workspaceText}` : '';
                    }

                    // Attempt to build an icon URL from activity assets
                    let iconUrl = '';
                    if (activity.assets && activity.assets.large_image) {
                        const li = activity.assets.large_image;
                        if (li.startsWith('http')) {
                            iconUrl = li;
                        } else if (li.startsWith('spotify:') || li.startsWith('mp:')) {
                            // ignore spotify-specific asset here
                        } else if (activity.application_id && li) {
                            iconUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${li}.png`;
                        }
                    }
                    if (iconEl) {
                        if (iconUrl) {
                            iconEl.src = iconUrl;
                            iconEl.style.display = 'block';
                        } else {
                            iconEl.style.display = 'none';
                        }
                    }

                    // Timer: use timestamps.start from activity if present
                    clearInterval(window._activityTimer);
                    if (timerEl) timerEl.textContent = '';
                    if (activity.timestamps && typeof activity.timestamps.start === 'number') {
                        const start = activity.timestamps.start;

                        function updateTimer() {
                            const elapsedMs = Date.now() - start;
                            if (elapsedMs < 0) return;
                            const sec = Math.floor(elapsedMs / 1000) % 60;
                            const min = Math.floor(elapsedMs / 60000);
                            if (timerEl) timerEl.textContent = `${min}:${sec.toString().padStart(2,'0')}`;
                        }
                        updateTimer();
                        window._activityTimer = setInterval(updateTimer, 1000);
                    }
                }
            }

            // Spotify
            const sp = d.listening_to_spotify ? d.spotify : null;
            const spTitle = document.getElementById('spotify-title');
            const spArtist = document.getElementById('spotify-artist');
            const spArt = document.getElementById('spotify-art');
            const spOpen = document.getElementById('spotify-open');
            const spBar = document.querySelector('#spotify-progress .progress-bar');

            if (sp) {
                if (spTitle) spTitle.textContent = sp.song;
                if (spArtist) spArtist.textContent = sp.artist;
                if (spArt) spArt.src = sp.album_art_url || '';
                if (spOpen) spOpen.href = `https://open.spotify.com/track/${sp.track_id}`;

                // progress
                try {
                    const elapsed = sp.timestamps ? (Date.now() - sp.timestamps.start) : 0;
                    const total = sp.duration_ms || 1;
                    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
                    if (spBar) spBar.style.width = pct + '%';
                } catch (e) { if (spBar) spBar.style.width = '0%'; }
            } else {
                if (spTitle) spTitle.textContent = 'Not listening';
                if (spArtist) spArtist.textContent = '';
                if (spArt) spArt.src = '';
                if (spOpen) spOpen.href = 'https://open.spotify.com/';
                if (spBar) spBar.style.width = '0%';
            }

        } catch (err) {
            console.error('Lanyard fetch error', err);
            setOffline();
        }
    }

    // initial fetch and poll
    fetchLanyard();
    setInterval(fetchLanyard, POLL_MS);

});