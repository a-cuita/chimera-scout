// ==========================================
// CONFIG
// ==========================================
const HUNT_VERSION = 'V0.8.2-260212';
console.log('🎮 CHIMERA Hunt Version:', HUNT_VERSION);

const CONFIG = {
    chimeraScriptUrl: 'https://script.google.com/macros/s/AKfycbxh-jfsyL6fQP_bjFqd6zRk1sFOYdd_C-A8Ojb5bM-ddax9F3rn9UN_nbuRZ5D34ucjzA/exec',
    huntScriptUrl: 'https://script.google.com/macros/s/AKfycbxyx41vU7UtlsQtJ7M-3Jbb3a12TTbFKdlUQN9KzKFY3Ivigx37nCNQJNVTrtC5GmAt/exec',
    chimeraUrl: '../index.html'
};

// ==========================================
// GAME STATE
// ==========================================
let gameState = {
    userId: null,
    handle: null,
    tier: 'scout', // scout | hunter | tamer | warden
    totalXP: 0,
    level: { level: 0, xpIntoLevel: 0, xpForNextLevel: 100 },
    scoutStreak: { count: 0, status: 'active' },
    hunterStreak: { count: 0, status: 'locked' },
    calibration: { divergence: null, bias: null, multiplier: 1.0 },
    triangleComplete: false,
    isAdmin: false
};

let whoList = [];
let hallFeed = [];
let heartbeatInterval = null;

// Shared tier lookup tables
const tierIcons = { scout: '🔍', hunter: '🗡️', tamer: '🐉', warden: '🛡️' };
const tierLetters = { scout: 'S', hunter: 'H', tamer: 'T', warden: 'W' };
