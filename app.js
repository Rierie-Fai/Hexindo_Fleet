// --- DATABASE CONFIG ---
const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sb = supabase.createClient(SB_URL, SB_KEY);

// --- CONNECTION MONITOR ---
function updateConnectionStatus() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (navigator.onLine) {
        dot.className = 'w-2 h-2 rounded-full bg-green-500 status-pulse';
        text.innerText = 'Online';
        text.className = 'text-[9px] font-black text-white uppercase tracking-wider';
    } else {
        dot.className = 'w-2 h-2 rounded-full bg-red-500';
        text.innerText = 'Offline';
        text.className = 'text-[9px] font-black text-red-400 uppercase tracking-wider';
    }
}

// --- SNOWSTORM ENGINE ---
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 3 + 2;
        this.wind = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.6 + 0.2;
    }
    update() {
        this.y += this.speed;
        this.x += this.wind;
        if (this.y > canvas.height || this.x > canvas.width) this.reset();
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initSnow() {
    particles = [];
    for (let i = 0; i < 120; i++) particles.push(new Particle());
}

function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateSnow);
}

// --- CORE SYSTEM FUNCTIONS ---
function runAutoScale() {
    const scaler = document.getElementById('scaler-context');
    const targetWidth = 720;
    const windowWidth = window.innerWidth;
    const scaleRatio = windowWidth / targetWidth;
    if (windowWidth < targetWidth) {
        scaler.style.transform = `scale(${scaleRatio})`;
        scaler.style.marginBottom = `-${(1 - scaleRatio) * scaler.offsetHeight}px`;
    } else {
        scaler.style.transform = `scale(1)`;
        scaler.style.marginBottom = `0px`;
    }
}

async function initSession() {
    const userNik = localStorage.getItem('userNIK') || localStorage.getItem('userNRP');
    if (!userNik) return handleLogout();
    
    try {
        const { data: user, error } = await sb.from('users').select('*').eq('nik', userNik).single();
        if (error || !user) throw new Error("Invalid Session");
        
        document.getElementById('userNameDisplay').innerText = user.full_name;
        document.getElementById('userNikDisplay').innerText = `NIK: ${user.nik}`;
        document.getElementById('fullNameMarquee').innerText = user.full_name;
        
        if(user.role === 'admin') {
            document.getElementById('adminSection').classList.remove('hidden');
            document.getElementById('roleBadge').innerText = '🛡️ SYSTEM ADMINISTRATOR';
        } else {
            document.getElementById('roleBadge').innerText = '🔧 FIELD TECHNICIAN';
        }
        
        // Show page and hide loader
        document.body.style.visibility = 'visible';
        document.getElementById('loadingOverlay').style.display = 'none';
        runAutoScale();
    } catch (err) { 
        console.error(err);
        handleLogout(); 
    }
}

function updateTime() {
    const now = new Date();
    document.getElementById('liveTime').innerText = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
    document.getElementById('liveDate').innerText = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

function handleLogout() { 
    localStorage.clear(); 
    window.location.replace('login.html'); 
}

// --- EVENT LISTENERS ---
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
window.addEventListener('resize', () => { 
    resizeCanvas(); 
    runAutoScale(); 
});

window.onload = () => { 
    resizeCanvas(); 
    initSnow(); 
    animateSnow(); 
    initSession(); 
    updateConnectionStatus();
    setInterval(updateTime, 1000); 
    updateTime(); 
    // Delay scale to ensure DOM is ready
    setTimeout(runAutoScale, 300); 
};
