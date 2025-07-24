// ===== APPLICATION STATE =====
let jobs = {};
let currentCategory = 'all';
let currentJob = null;

// ===== DOM ELEMENTS =====
const jobDisplay = document.getElementById('jobDisplay');
const randomizeBtn = document.getElementById('randomizeBtn');
const actionButtons = document.getElementById('actionButtons');
const statusText = document.getElementById('statusText');
const filterBtns = document.querySelectorAll('.filter-btn');

// ===== INITIALIZATION =====
async function initApp() {
    try {
        // Load jobs data
        const response = await fetch('data/jobs.json');
        jobs = await response.json();
        
        // Initialize UI
        setupEventListeners();
        updateStatusText('Application prête - Échappons-nous d\'Excel !');
        
        console.log('ToutQuitterEt... v1.0 loaded successfully!');
    } catch (error) {
        console.error('Error loading jobs data:', error);
        updateStatusText('Erreur de chargement des données');
        showDialog('Impossible de charger les métiers. Vérifiez votre connexion.');
    }
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Main randomize button
    randomizeBtn.addEventListener('click', randomizeJob);

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setActiveFilter(e.target.dataset.category);
        });
    });

    // Action buttons
    document.getElementById('favoriteBtn')?.addEventListener('click', handleFavorite);
    document.getElementById('shareBtn')?.addEventListener('click', handleShare);
    document.getElementById('moreInfoBtn')?.addEventListener('click', handleMoreInfo);
}

// ===== CORE FUNCTIONALITY =====
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

    // Start animation
    randomizeBtn.classList.add('spinning');
    updateStatusText('Calcul de ton destin en cours...');
    
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * availableJobs.length);
        currentJob = availableJobs[randomIndex];
        
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

function setActiveFilter(category) {
    // Update button states
    filterBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
    
    // Update state
    currentCategory = category;
    actionButtons.style.display = 'none';
    
    // Update display
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

// ===== ACTION HANDLERS =====
function handleFavorite() {
    if (!currentJob) return;
    
    // In a real app, this would save to localStorage or a database
    showDialog(`"${currentJob.title}" ajouté à tes favoris Windows 98 ! ❤️`);
    updateStatusText('Métier ajouté aux favoris');
}

function handleShare() {
    if (!currentJob) return;
    
    const text = `Je vais tout quitter et devenir ${currentJob.title} ! Généré par ToutQuitterEt... v1.0`;
    
    // Try native sharing first, fallback to clipboard
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

// ===== UI UTILITIES =====
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
        alert(message); // Fallback
    }
}

function closeDialog() {
    const dialogBox = document.getElementById('dialogBox');
    if (dialogBox) {
        dialogBox.style.display = 'none';
    }
}

// ===== GLOBAL FUNCTIONS (for HTML onclick handlers) =====
window.showDialog = showDialog;
window.closeDialog = closeDialog;

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', initApp);