// --- CONFIGURATION & INITIALIZATION ---
const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sb = supabase.createClient(SB_URL, SB_KEY);

// --- AUTO-SCALING ENGINE ---
function runAutoScale() {
    const scaler = document.getElementById('scaler-context');
    const targetWidth = 720;
    const windowWidth = window.innerWidth;
    const scaleRatio = windowWidth / targetWidth;
    
    if (windowWidth < targetWidth) {
        scaler.style.transform = `scale(${scaleRatio})`;
    } else {
        scaler.style.transform = `scale(1)`;
    }
}

// --- SNOW EFFECT ---
function createSnow() {
    const container = document.getElementById('snow-container');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const flake = document.createElement('div');
        flake.className = 'snow-flake';
        flake.innerText = '❄';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = (Math.random() * 3 + 5) + 's';
        flake.style.fontSize = (Math.random() * 8 + 8) + 'px';
        flake.style.opacity = Math.random() * 0.5;
        container.appendChild(flake);
    }
}

// --- CONNECTION MONITOR ---
function updateStatus() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (!dot || !text) return;

    if (navigator.onLine) {
        dot.className = 'w-1.5 h-1.5 rounded-full bg-green-500 status-pulse';
        text.innerText = 'Online';
        text.classList.remove('text-red-400');
    } else {
        dot.className = 'w-1.5 h-1.5 rounded-full bg-red-500';
        text.innerText = 'Offline';
        text.classList.add('text-red-400');
    }
}

// --- EVENT LISTENERS ---
window.addEventListener('resize', runAutoScale);
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);

document.addEventListener('DOMContentLoaded', () => {
    runAutoScale();
    createSnow();
    updateStatus();

    // Toggle Password
    const togglePass = document.getElementById('togglePass');
    const passInput = document.getElementById('passInput');
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePass && passInput) {
        togglePass.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            if (type === 'text') {
                eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />`;
            } else {
                eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;
            }
        });
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnLogin');
            const alertBox = document.getElementById('loginAlert');
            
            btn.disabled = true; 
            btn.innerText = "AUTHENTICATING...";
            alertBox.classList.add('hidden');
            
            const nik = document.getElementById('nikInput').value;
            const pass = document.getElementById('passInput').value;

            try {
                const { data, error } = await sb.from('users').select('*').eq('nik', nik).single();
                
                if (error || !data || data.password !== pass) throw new Error("Invalid Credentials");

                // Berhasil Login
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userNIK', data.nik);
                localStorage.setItem('userName', data.full_name);
                localStorage.setItem('userRole', data.role);
                window.location.replace('index.html');
                
            } catch (err) {
                alertBox.classList.remove('hidden');
                btn.disabled = false; 
                btn.innerText = "INITIALIZE LOGIN";
            }
        });
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('NIK Service Worker: Active', reg.scope))
            .catch(err => console.error('NIK Service Worker: Failed', err));
    }
});
