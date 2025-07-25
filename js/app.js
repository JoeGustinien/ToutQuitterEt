// ===== APPLICATION STATE =====
let jobs = {};
let currentCategory = 'all';
let currentJob = null;
let favorites = [];

// ===== COOKIE CONSENT STATE ===== (NOUVEAU)
let cookieConsent = {
    essential: true,
    analytics: false
};

// ===== DOM ELEMENTS =====
const jobDisplay = document.getElementById('jobDisplay');
const randomizeBtn = document.getElementById('randomizeBtn');
const actionButtons = document.getElementById('actionButtons');
const statusText = document.getElementById('statusText');
const filterBtns = document.querySelectorAll('.filter-btn');
const favoritesPanel = document.getElementById('favoritesPanel');
const favoritesList = document.getElementById('favoritesList');

// ===== INITIALIZATION (MODIFIÉ) =====
async function initApp() {
    try {
        // Check cookie consent first (NOUVEAU)
        checkCookieConsent();
        
        const response = await fetch('data/jobs.json');
        jobs = await response.json();

        // Load favorites only if essential cookies accepted (MODIFIÉ)
        if (cookieConsent.essential) {
            loadFavorites();
        }
        
        setupEventListeners();
        updateStatusText('Application prête - Échappons-nous d\'Excel !');
    } catch (error) {
        console.error('Error loading jobs data:', error);
        updateStatusText('Erreur de chargement des données');
        showDialog('Impossible de charger les métiers. Vérifiez votre connexion.');
    }
}

// ===== COOKIE CONSENT FUNCTIONS (NOUVEAU) =====
function checkCookieConsent() {
    const consent = localStorage.getItem('toutquitteret_cookie_consent');
    
    if (consent) {
        cookieConsent = JSON.parse(consent);
        hideCookieBanner();
        
        // Load GTM only if analytics accepted
        if (cookieConsent.analytics) {
            loadGTM();
        }
    } else {
        showCookieBanner();
    }
}

function showCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.classList.remove('hidden');
    }
}

function hideCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

function acceptCookies() {
    cookieConsent = {
        essential: true,
        analytics: true
    };
    
    saveCookieConsent();
    hideCookieBanner();
    loadGTM();
    
    updateStatusText('Cookies acceptés - Merci ! 🍪');
}

function declineCookies() {
    cookieConsent = {
        essential: true,
        analytics: false
    };
    
    saveCookieConsent();
    hideCookieBanner();
    
    updateStatusText('Seuls les cookies essentiels sont activés');
}

function saveCookieConsent() {
    localStorage.setItem('toutquitteret_cookie_consent', JSON.stringify(cookieConsent));
    localStorage.setItem('toutquitteret_consent_date', new Date().toISOString());
}

function showCookieSettings() {
    const modal = document.getElementById('cookieSettingsModal');
    if (modal) {
        document.getElementById('analytics').checked = cookieConsent.analytics;
        modal.style.display = 'flex';
    }
}

function closeCookieSettings() {
    const modal = document.getElementById('cookieSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveCookieSettings() {
    const analyticsCheckbox = document.getElementById('analytics');
    
    const wasAnalyticsEnabled = cookieConsent.analytics;
    cookieConsent.analytics = analyticsCheckbox.checked;
    
    saveCookieConsent();
    closeCookieSettings();
    hideCookieBanner();
    
    if (cookieConsent.analytics && !wasAnalyticsEnabled) {
        loadGTM();
        updateStatusText('Analytics activés - Merci ! 📊');
    } else if (!cookieConsent.analytics && wasAnalyticsEnabled) {
        updateStatusText('Analytics désactivés');
    } else {
        updateStatusText('Paramètres sauvegardés');
    }
}

function loadGTM() {
    if (window.dataLayer && window.gtag) {
        return; // Already loaded
    }
    
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-TX8FNB8J';
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'GTM-TX8FNB8J');
    
    document.head.appendChild(script);
}

// ===== TRACKING FUNCTION (NOUVEAU) =====
function trackGTMEvent(eventName, parameters = {}) {
    if (!cookieConsent.analytics) {
        return;
    }
    
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push({
            'event': eventName,
            ...parameters
        });
    }
}

// ===== FAVORITES UTILS (MODIFIÉ) =====
function loadFavorites() {
    if (!cookieConsent.essential) {
        favorites = [];
        return;
    }
    
    const stored = localStorage.getItem('favorites');
    if (stored) {
        try {
            favorites = JSON.parse(stored);
        } catch (e) {
            favorites = [];
        }
    }
}

function saveFavorites() {
    if (!cookieConsent.essential) {
        showDialog('Les cookies essentiels sont requis pour sauvegarder les favoris');
        return;
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(title) {
    return favorites.includes(title);
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    randomizeBtn.addEventListener('click', randomizeJob);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setActiveFilter(e.target.dataset.category);
        });
    });
    document.getElementById('addToFavoritesBtn')?.addEventListener('click', handleFavorite);
    document.getElementById('viewFavoritesBtn')?.addEventListener('click', toggleFavoritesPanel);    
    document.getElementById('shareBtn')?.addEventListener('click', handleShare);
    document.getElementById('moreInfoBtn')?.addEventListener('click', handleMoreInfo);
}

// ===== CORE FUNCTIONALITY (AVEC TRACKING) =====
function getAllJobs() {
    if (currentCategory === 'all') {
        return Object.values(jobs).flat();
    }
    return jobs[currentCategory] || [];
}

function randomizeJob() {
    const availableJobs = getAllJobs();
    if (availableJobs.length === 0) {
        showDialog('Aucun métier disponible dans cette catégorie !');
        return;
    }

    // Track event (NOUVEAU)
    trackGTMEvent('job_randomized', {
        'category': currentCategory,
        'total_jobs': availableJobs.length
    });

    randomizeBtn.classList.add('spinning');
    updateStatusText('Calcul de ton destin en cours...');

    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * availableJobs.length);
        currentJob = availableJobs[randomIndex];

        // Track job generated (NOUVEAU)
        trackGTMEvent('job_generated', {
            'job_title': currentJob.title,
            'job_category': findJobCategory(currentJob),
            'job_salary': currentJob.salary
        });

        displayJob(currentJob);
        randomizeBtn.classList.remove('spinning');
        actionButtons.style.display = 'flex';
        updateStatusText('Nouveau métier généré avec succès !');
    }, 1000);
}

function displayJob(job) {
    jobDisplay.innerHTML = `
        <div class="job-title-display">${job.title}</div>
        <div class="job-description-display">${job.description}</div>
        <div class="job-stats">
            <div class="stat-item">💰 ${job.salary}</div>
            <div class="stat-item">🎓 ${job.formation}</div>
            <div class="stat-item">📊 ${job.difficulty}</div>
        </div>
    `;
}

// ===== FAVORITE BUTTON ACTION (AVEC TRACKING) =====
function handleFavorite() {
    if (!currentJob) return;

    const title = currentJob.title;

    if (isFavorite(title)) {
        showDialog(`"${title}" est déjà dans tes favoris Windows 98 ! ❤️`);
        updateStatusText('Déjà en favoris');
    } else {
        favorites.push(title);
        saveFavorites();
        
        // Track event (NOUVEAU)
        trackGTMEvent('job_favorited', {
            'job_title': currentJob.title,
            'total_favorites': favorites.length
        });
        
        showDialog(`"${title}" ajouté à tes favoris Windows 98 ! ❤️`);
        updateStatusText('Métier ajouté aux favoris');
    }
}

// ===== SHARE + INFO ACTIONS (AVEC TRACKING) =====
function handleShare() {
    if (!currentJob) return;

    // Track event (NOUVEAU)
    trackGTMEvent('job_shared', {
        'job_title': currentJob.title,
        'share_method': navigator.share ? 'native' : 'clipboard'
    });

    const text = `Je vais tout quitter et devenir ${currentJob.title} ! Généré par ToutQuitterEt... v1.0`;

    if (navigator.share) {
        navigator.share({
            title: 'ToutQuitterEt...',
            text: text,
            url: window.location.href
        }).then(() => {
            updateStatusText('Partagé avec succès !');
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showDialog('Texte copié dans le presse-papier Windows 98 ! 📋');
            updateStatusText('Texte copié avec succès');
        });
    } else {
        showDialog(`Copiez ce texte manuellement :\n\n${text}`);
    }
}

function handleMoreInfo() {
    if (!currentJob) return;
    showDialog(`Guide détaillé pour "${currentJob.title}" bientôt disponible dans ToutQuitterEt... v2.0 ! 📁`);
    updateStatusText('Infos détaillées à venir...');
}

// ===== CATEGORY FILTER =====
function setActiveFilter(category) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');

    currentCategory = category;
    actionButtons.style.display = 'none';

    const categoryNames = {
        'all': 'Toutes catégories',
        'creative': 'Créatif',
        'adventure': 'Aventure',
        'food': 'Gourmand',
        'wellness': 'Bien-être',
        'tech': 'Tech Alternative',
        'unusual': 'Insolite'
    };

    jobDisplay.innerHTML = `
        <div class="job-title-display">Catégorie sélectionnée</div>
        <div class="job-description-display">Tu as choisi "${categoryNames[category]}". Clique sur Randomiser pour découvrir ton nouveau métier de rêve dans cette catégorie !</div>
    `;

    updateStatusText(`Catégorie ${categoryNames[category]} sélectionnée`);
}

// ===== UTILITY FUNCTIONS =====
function findJobCategory(job) {
    for (const [category, jobList] of Object.entries(jobs)) {
        if (jobList.some(j => j.title === job.title)) {
            return category;
        }
    }
    return 'unknown';
}

function updateStatusText(message) {
    if (statusText) {
        statusText.textContent = message;
    }
}

function showDialog(message) {
    const dialogBox = document.getElementById('dialogBox');
    const dialogContent = document.getElementById('dialogContent');

    if (dialogBox && dialogContent) {
        dialogContent.textContent = message;
        dialogBox.style.display = 'block';
    } else {
        alert(message);
    }
}

function closeDialog() {
    const dialogBox = document.getElementById('dialogBox');
    if (dialogBox) {
        dialogBox.style.display = 'none';
    }
}

function toggleFavoritesPanel() {
    const panel = document.getElementById('favoritesPanel');
    if (!panel) return;

    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        updateStatusText('Favoris masqués');
    } else {
        displayFavorites();
        panel.style.display = 'block';
        updateStatusText('Affichage des favoris');
    }
}

function displayFavorites() {
    const list = document.getElementById('favoritesList');
    if (!list) return;

    list.innerHTML = '';

    if (favorites.length === 0) {
        list.innerHTML = '<li>Pas encore de métiers favoris 😢</li>';
        return;
    }

    favorites.forEach((title, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${title}
            <button class="remove-btn" onclick="removeFavorite(${index})">❌</button>
        `;
        list.appendChild(li);
    });
}

function removeFavorite(index) {
    const removed = favorites.splice(index, 1);
    saveFavorites();
    displayFavorites();
    updateStatusText(`"${removed}" supprimé des favoris`);
}

// ===== GLOBAL FUNCTIONS (NOUVEAU) =====
window.showDialog = showDialog;
window.closeDialog = closeDialog;
window.acceptCookies = acceptCookies;
window.declineCookies = declineCookies;
window.showCookieSettings = showCookieSettings;
window.closeCookieSettings = closeCookieSettings;
window.saveCookieSettings = saveCookieSettings;

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', initApp);