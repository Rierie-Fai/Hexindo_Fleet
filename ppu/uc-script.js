// --- SNOW ENGINE ---
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

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
    update() { this.y += this.speed; this.x += this.wind; if (this.y > canvas.height || this.x > canvas.width) this.reset(); }
    draw() { ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
}

function initSnow() { particles = []; for (let i = 0; i < 60; i++) particles.push(new Particle()); }
function animateSnow() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animateSnow); }

// --- AUTO SCALE (720px) ---
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
window.addEventListener('resize', () => { resizeCanvas(); runAutoScale(); });

// --- DATABASE ---
const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sb = supabase.createClient(SB_URL, SB_KEY);

const items = [
    { name: "Track Shoe Tooth Length", std: 0, limit: 35 },
    { name: "Track Shoe Tread", std: 21.5, limit: 31.5 },
    { name: "Track Shoe Grouser Height", std: 30, limit: 0 },
    { name: "Track Shoe Pitch", std: 1491, limit: 1530 },
    { name: "Front Idler Tread Dia.", std: 203, limit: 188 },
    { name: "Drive Tumbler Tread Dia", std: 144, limit: 129 },
    { name: "Drive Tumbler Tooth", std: 0, limit: 35 },
    { name: "Upper Roller 1 Tread Dia", std: 380, limit: 350 },
    { name: "Upper Roller 2 Tread Dia", std: 380, limit: 350 },
    { name: "Upper Roller 3 Tread Dia", std: 380, limit: 350 },
    { name: "Lower Roller 1 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 2 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 3 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 4 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 5 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 6 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 7 Tread Dia", std: 490, limit: 460 },
    { name: "Lower Roller 8 Tread Dia", std: 490, limit: 460 }
];

async function init() {
    const nrp = localStorage.getItem('userNIK') || localStorage.getItem('userNRP');
    if(!nrp) return window.location.replace('login.html');
    
    try {
        const { data: user } = await sb.from('users').select('*').eq('nik', nrp).single();
        document.getElementById('techName').value = user.full_name;
        document.getElementById('techNik').value = user.nik;
        document.body.style.visibility = 'visible';
        document.getElementById('authLoader').style.display = 'none';
        resizeCanvas(); initSnow(); animateSnow();
        renderTable();
        fetchHistory();
        setTimeout(runAutoScale, 100);
    } catch (err) { window.location.replace('login.html'); }
}

function renderTable() {
    const tbody = document.getElementById('inspectionBody');
    tbody.innerHTML = items.map((item, idx) => `
        <tr class="hover:bg-white/5 transition-colors">
            <td class="pr-1 italic text-blue-100">${item.name}</td>
            <td class="text-center text-blue-300/50 font-mono text-[9px]">${item.std}</td>
            <td><input type="number" step="0.1" class="input-glacial" id="lh_${idx}" oninput="calcWorn(this, ${item.std}, ${item.limit}, 'wL_${idx}')"></td>
            <td><input type="number" step="0.1" class="input-glacial" id="rh_${idx}" oninput="calcWorn(this, ${item.std}, ${item.limit}, 'wR_${idx}')"></td>
            <td id="wL_${idx}" class="worn-output">-</td>
            <td id="wR_${idx}" class="worn-output">-</td>
        </tr>`).join('');
}

function calcWorn(el, std, limit, targetId) {
    const val = parseFloat(el.value);
    const target = document.getElementById(targetId);
    if(isNaN(val)) { target.innerText = "-"; target.classList.remove('worn-danger'); return; }
    let worn = std > limit ? ((std - val) / (std - limit)) * 100 : (val / limit) * 100;
    let final = Math.max(0, Math.round(worn));
    target.innerText = final + "%";
    if(final >= 100) target.classList.add('worn-danger'); else target.classList.remove('worn-danger');
}

async function syncToCloud() {
    const btn = document.getElementById('btnSync');
    btn.innerText = "⏳"; btn.disabled = true;
    const payload = {
        nik: document.getElementById('techNik').value,
        customer_name: document.getElementById('custName').value.toUpperCase(),
        unit_no: document.getElementById('unitSN').value.toUpperCase(),
        inspection_date: document.getElementById('inspDate').value,
        report_data: {
            header: { HM: document.getElementById('unitHM').value, loc: document.getElementById('locInp').value },
            measurements: items.map((_, i) => ({ lh: document.getElementById(`lh_${i}`).value, rh: document.getElementById(`rh_${i}`).value })),
            comments: document.getElementById('commentInp').value
        }
    };
    await sb.from('uc_reports').insert([payload]);
    alert("Data NIK Secured!"); fetchHistory();
    btn.innerText = "☁️ Save"; btn.disabled = false;
}

async function fetchHistory() {
    const { data } = await sb.from('uc_reports').select('*').order('id', { ascending: false }).limit(5);
    const container = document.getElementById('historyBody');
    container.innerHTML = data.map(row => `
        <div class="glass-glacial p-4 border-l-4 border-blue-500 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-all">
            <div>
                <div class="font-black text-white text-xs">${row.unit_no}</div>
                <div class="text-[9px] text-blue-300 font-bold">${row.inspection_date} | NIK: ${row.nik}</div>
            </div>
            <button onclick='editData(${JSON.stringify(row)})' class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">EDIT</button>
        </div>`).join('');
}

function editData(row) {
    document.getElementById('unitSN').value = row.unit_no;
    document.getElementById('unitHM').value = row.report_data.header.HM;
    document.getElementById('inspDate').value = row.inspection_date;
    document.getElementById('commentInp').value = row.report_data.comments;
    row.report_data.measurements.forEach((m, i) => {
        const elL = document.getElementById(`lh_${i}`);
        const elR = document.getElementById(`rh_${i}`);
        if(elL) { elL.value = m.lh; calcWorn(elL, items[i].std, items[i].limit, `wL_${i}`); }
        if(elR) { elR.value = m.rh; calcWorn(elR, items[i].std, items[i].limit, `wR_${i}`); }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onload = init;
