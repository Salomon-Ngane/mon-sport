// --- Configuration & Éléments du DOM ---
const EXERCISES = [
    { name: "Jumping Jacks", duration: 40, image: "mon-sport/jumping-jacks.jpg" },
    { name: "Squats", duration: 45, image: "mon-sport/squats.jpg" },
    { name: "Pompes", duration: 30, image: "mon-sport/pompes.jpg" },
    { name: "Fentes alternées", duration: 45, image: "mon-sport/fentes.jpg" },
    { name: "Gainage", duration: 60, image: "mon-sport/gainage.jpg" }
];

const REST_DURATION = 20; // Repos entre exercices en secondes

let currentExerciseIndex = 0;
let timer = null;
let timeLeft = 0;
let isPaused = false;
let isResting = false;

let wakeLock = null;
let audioCtx = null;

// Éléments HTML
const setupCard = document.getElementById('setup-card');
const exerciseCard = document.getElementById('exercise-card');
const restCard = document.getElementById('rest-card');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const skipBtn = document.getElementById('skip-btn');
const exerciseNameEl = document.getElementById('exercise-name');
const exerciseStepEl = document.getElementById('exercise-step');
const exerciseImageEl = document.getElementById('exercise-image');
const timerSecondsEl = document.getElementById('timer-seconds');
const restSecondsEl = document.getElementById('rest-seconds');
const streakCountEl = document.getElementById('streak-count');

// --- 1. Gestion Robuste de l'AudioContext (Bypass Autoplay Policy) ---
function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function beep(freq = 440, type = 'sine', duration = 0.15) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Erreur d'émission sonore :", e);
    }
}

// --- 2. Gestion Sécurisée et Continue du Wake Lock ---
async function requestWakeLock() {
    if ('wakeLock' in navigator && !wakeLock) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
            });
        } catch (err) {
            console.warn(`Erreur Wake Lock: ${err.name}, ${err.message}`);
        }
    }
}

// Réactivation automatique du Wake Lock lors du retour sur l'application
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && exerciseCard.classList.contains('active')) {
        await requestWakeLock();
    }
});

// --- 3. Calcul de Régularité (Streak) Assoupli (Fenêtre de 48h) ---
function computeStreak() {
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    if (history.length === 0) return 0;

    // Dates triées par ordre décroissant (plus récente en premier)
    const uniqueDates = [...new Set(history)].map(d => new Date(d)).sort((a, b) => b - a);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let streak = 0;
    let lastDate = today;

    for (let i = 0; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i].getFullYear(), uniqueDates[i].getMonth(), uniqueDates[i].getDate());
        const diffInDays = Math.round((lastDate - currentDate) / (1000 * 60 * 60 * 24));

        if (i === 0 && diffInDays > 1) {
            // Plus de 48h écoulées depuis le dernier entraînement : Série rompue
            break;
        }

        if (diffInDays <= 1) {
            streak++;
            lastDate = currentDate;
        } else {
            break; // Interruption dans la régularité
        }
    }
    
    return streak;
}

function updateStreakDisplay() {
    streakCountEl.textContent = computeStreak();
}

function saveWorkoutCompletion() {
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    history.push(new Date().toISOString());
    localStorage.setItem('workout_history', JSON.stringify(history));
    updateStreakDisplay();
}

// --- 4. Moteur de la Séance d'Entraînement ---
function startWorkout() {
    initAudio();
    requestWakeLock();
    
    currentExerciseIndex = 0;
    setupCard.classList.add('hidden');
    exerciseCard.classList.remove('hidden');
    exerciseCard.classList.add('active');
    
    runExercise();
}

function runExercise() {
    isResting = false;
    const current = EXERCISES[currentExerciseIndex];
    
    exerciseStepEl.textContent = `Exercice ${currentExerciseIndex + 1}/${EXERCISES.length}`;
    exerciseNameEl.textContent = current.name;
    
    // Chargement de l'image correspondante depuis le dossier mon-sport
    exerciseImageEl.src = current.image;
    exerciseImageEl.onerror = () => {
        // Image de secours si la photo n'est pas trouvée
        exerciseImageEl.src = 'mon-sport/default.jpg';
    };

    timeLeft = current.duration;
    timerSecondsEl.textContent = timeLeft;

    restCard.classList.add('hidden');
    exerciseCard.classList.remove('hidden');

    beep(600, 'sine', 0.2); // Signal de démarrage
    startTimer(nextStep);
}

function runRest() {
    isResting = true;
    timeLeft = REST_DURATION;
    restSecondsEl.textContent = timeLeft;

    exerciseCard.classList.add('hidden');
    restCard.classList.remove('hidden');

    beep(400, 'sine', 0.3); // Signal de repos / hydratation
    startTimer(runExercise);
}

function startTimer(onComplete) {
    clearInterval(timer);
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            if (isResting) {
                restSecondsEl.textContent = timeLeft;
            } else {
                timerSecondsEl.textContent = timeLeft;
            }

            // Décompte sonore des 3 dernières secondes
            if (timeLeft <= 3 && timeLeft > 0) {
                beep(800, 'square', 0.08);
            }

            if (timeLeft <= 0) {
                clearInterval(timer);
                onComplete();
            }
        }
    }, 1000);
}

function nextStep() {
    currentExerciseIndex++;
    if (currentExerciseIndex < EXERCISES.length) {
        runRest();
    } else {
        finishWorkout();
    }
}

function finishWorkout() {
    clearInterval(timer);
    saveWorkoutCompletion();
    beep(1000, 'sine', 0.5);
    
    alert("Bravo ! Séance terminée avec succès ! 🎉");
    
    if (wakeLock) {
        wakeLock.release().then(() => wakeLock = null);
    }

    exerciseCard.classList.remove('active');
    exerciseCard.classList.add('hidden');
    restCard.classList.add('hidden');
    setupCard.classList.remove('hidden');
}

// --- Événements ---
startBtn.addEventListener('click', startWorkout);

pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Reprendre" : "Pause";
});

skipBtn.addEventListener('click', () => {
    clearInterval(timer);
    nextStep();
});

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updateStreakDisplay();
    // Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker enregistré.'))
            .catch(err => console.error('Erreur Service Worker:', err));
    }
});
