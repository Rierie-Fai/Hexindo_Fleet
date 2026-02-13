// --- INITIAL CONFIG ---
const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sb = supabase.createClient(SB_URL, SB_KEY);

const currentNik = localStorage.getItem('userNIK') || localStorage.getItem('userNRP');
const userRole = localStorage.getItem('userRole');

// --- SNOW ENGINE ---
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() { 
    if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
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
        this.y += this.speed; this.x += this.wind; 
        if (this.y > canvas.height || this.x > canvas.width) this.reset(); 
    }
    draw() { 
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; 
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); 
    }
}

function initSnow() { 
    particles = []; 
    for (let i = 0; i < 100; i++) particles.push(new Particle()); 
}

function animateSnow() { 
    if(!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    particles.forEach(p => { p.update(); p.draw(); }); 
    requestAnimationFrame(animateSnow); 
}

// --- UTILS ---
function runAutoScale() {
    const scaler = document.getElementById('scaler-context');
    if(!scaler) return;
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

function togglePass(id) {
    const input = document.getElementById(id);
    const icon = document.getElementById('eye-icon-' + id);
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />`;
    } else {
        input.type = 'password';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;
    }
}

async function fetchUsers() {
    const { data } = await sb.from('users').select('*').order('full_name');
    const tbody = document.getElementById('userTableBody');
    if(!tbody) return;
    tbody.innerHTML = (data || []).map(u => `
        <tr class="hover:bg-white/10 transition-all">
            <td class="py-4 text-[12px] font-mono font-bold text-blue-300">${u.nik}</td>
            <td>
                <div class="text-[12px] font-black uppercase italic text-white">${u.full_name}</div>
                <div class="text-[8px] font-bold text-blue-300/50">${u.role.toUpperCase()}</div>
            </td>
            <td class="text-right">
                <button onclick="resetUserPass('${u.nik}')" class="bg-white/10 px-3 py-1.5 rounded-lg text-red-400 font-black text-[9px] border border-white/10 uppercase shadow-sm active:scale-90 transition-all">Reset</button>
            </td>
        </tr>`).join('');
    runAutoScale();
}

async function resetUserPass(targetNik) {
    const newPass = prompt("Set temporary password for NIK " + targetNik, "hexindo123");
    if (newPass) {
        const { error } = await sb.from('users').update({ password: newPass }).eq('nik', targetNik);
        if (!error) alert("NIK " + targetNik + " Reset Success.");
    }
}

// --- EVENTS ---
window.addEventListener('resize', () => { resizeCanvas(); runAutoScale(); });
window.onload = () => {
    resizeCanvas(); initSnow(); animateSnow();
    const roleBadge = document.getElementById('roleBadge');
    if(roleBadge) roleBadge.innerText = (userRole || 'TECH').toUpperCase() + " ACCESS";
    
    if (userRole === 'admin') {
        const adminPanel = document.getElementById('adminPanel');
        const userList = document.getElementById('userListPanel');
        if(adminPanel) adminPanel.classList.remove('hidden');
        if(userList) userList.classList.remove('hidden');
        fetchUsers();
    }
    setTimeout(runAutoScale, 300);
};

// --- FORM HANDLING ---
const changePassForm = document.getElementById('changePassForm');
if(changePassForm) {
    changePassForm.onsubmit = async (e) => {
        e.preventDefault();
        const nPass = document.getElementById('newPass').value;
        if (nPass !== document.getElementById('confirmPass').value) return alert("Password mismatch!");
        const { error } = await sb.from('users').update({ password: nPass }).eq('nik', currentNik);
        if (!error) { alert("✅ Success: Password Updated."); changePassForm.reset(); }
    };
}

const addUserForm = document.getElementById('addUserForm');
if(addUserForm) {
    addUserForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            nik: document.getElementById('regNik').value,
            full_name: document.getElementById('regName').value,
            password: 'hexindo123',
            role: 'technician'
        };
        const { error } = await sb.from('users').insert([payload]);
        if (!error) { 
            alert("🚀 NIK " + payload.nik + " Deployed!"); 
            addUserForm.reset(); fetchUsers(); 
        }
    };
}
