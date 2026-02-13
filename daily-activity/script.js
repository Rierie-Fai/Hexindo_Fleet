// --- CONFIGURATIONS ---
const SUPABASE_URL = 'https://corpgiuxyhfxdnqwwmlv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEY = 'techLogs_v4_snow';
let isEditMode = false;
const userNik = localStorage.getItem('userNIK') || localStorage.getItem('userNRP');
const userName = localStorage.getItem('userName');

// --- SNOW ENGINE ---
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

// --- UI SCALING ---
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

// --- EVENT LISTENERS & INIT ---
window.addEventListener('resize', () => { 
    resizeCanvas(); 
    runAutoScale(); 
});

window.onload = async () => {
    resizeCanvas(); 
    initSnow(); 
    animateSnow();
    
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('fade-out');
    }, 1200);

    document.getElementById('nameInp').value = userName;
    document.getElementById('nikInp').value = userNik;
    document.getElementById('dateInp').valueAsDate = new Date();

    if(!document.getElementById('detailRowsContainer').children.length) {
        addDetailRow();
    }
    
    refreshTable();
    pullFromCloud();
    setTimeout(runAutoScale, 100);
};

// --- CORE LOGIC ---
function formatBullet(text) {
    if (!text) return "";
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line !== "")
        .map(line => line.startsWith('•') ? line : `• ${line}`)
        .join('\n');
}

function addDetailRow(timeF = '', timeT = '', desc = '') {
    const container = document.getElementById('detailRowsContainer');
    const div = document.createElement('div');
    div.className = "flex gap-3 items-start bg-black/20 p-4 rounded-[1.5rem] border border-white/5 shadow-sm";
    div.innerHTML = `
        <div class="w-24 flex-shrink-0 flex flex-col gap-2">
            <input type="time" class="header-val text-center !p-1 text-[11px]" value="${timeF}">
            <input type="time" class="header-val text-center !p-1 text-[11px]" value="${timeT}">
        </div>
        <div class="flex-1">
            <textarea class="header-val !p-3 min-h-[60px] text-[11px]" placeholder="Input Detail...">${desc}</textarea>
        </div>
        <button onclick="this.parentElement.remove()" class="text-red-400 font-black p-1 text-xl">&times;</button>
    `;
    container.appendChild(div);
    runAutoScale();
}

function smartAddTask() {
    const rows = document.querySelectorAll('#detailRowsContainer > div');
    let lastTime = rows.length > 0 ? rows[rows.length - 1].querySelectorAll('input[type="time"]')[1].value : "";
    addDetailRow(lastTime, "");
}

function submitLog() {
    const dateVal = document.getElementById('dateInp').value;
    const details = Array.from(document.querySelectorAll('#detailRowsContainer > div')).map(row => {
        const t = row.querySelectorAll('input[type="time"]');
        const rawDesc = row.querySelector('textarea').value;
        return { 
            f: t[0].value, 
            t: t[1].value, 
            d: formatBullet(rawDesc)
        };
    }).filter(item => item.d !== "");

    if(!dateVal || details.length === 0) return alert("Required: Date & Progress!");

    const logEntry = {
        id: isEditMode ? parseInt(document.getElementById('editId').value) : Date.now(),
        date: dateVal, name: userName, nik: userNik,
        customer: document.getElementById('customerInp').value.toUpperCase(),
        location: document.getElementById('locationInp').value.toUpperCase(),
        model: document.getElementById('modelInp').value.toUpperCase(), 
        sn: document.getElementById('snInp').value.toUpperCase(),
        hm: document.getElementById('hmInp').value, 
        job: document.getElementById('jobDescInp').value.toUpperCase(),
        isSynced: false, 
        detailData: details
    };

    let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    isEditMode ? logs = logs.map(l => l.id === logEntry.id ? logEntry : l) : logs.push(logEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
    clearForm(); 
    refreshTable(); 
    alert("✅ Recorded Locally");
}

function refreshTable() {
    const masterList = document.getElementById('masterList');
    masterList.innerHTML = '';
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    logs.sort((a,b) => b.id - a.id).forEach(obj => {
        let chronoRows = (obj.detailData || []).map(item => `
            <tr>
                <td class="cell-time">${item.f}-${item.t}</td>
                <td class="description-text">${item.d}</td>
            </tr>`).join('');

        const section = document.createElement('div');
        section.className = "glass-ice rounded-[2rem] overflow-hidden mb-6";
        section.innerHTML = `
            <div class="bg-white/10 p-3 flex justify-between items-center border-b border-white/5">
                <span class="text-[8px] font-black text-blue-200 uppercase italic ml-2">${obj.isSynced ? '❄️ SYNCED' : '☁️ LOCAL'}</span>
                <div class="flex gap-4 mr-2">
                    <button onclick="editLog(${obj.id})" class="text-blue-300 text-[9px] font-black">EDIT</button>
                    <button onclick="deleteLog(${obj.id})" class="text-red-400 text-[9px] font-black">DELETE</button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse table-fixed">
                    <thead>
                        <tr>
                            <th style="width: 85px">Date</th>
                            <th style="width: 130px">Tech & Client</th>
                            <th style="width: 130px">Unit Info</th>
                            <th style="width: auto">Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="td-main font-black text-white text-center text-[10px]">${obj.date}</td>
                            <td class="td-main">
                                <b class="text-blue-200">${obj.name}</b><br><span class="text-[9px] opacity-60">NIK: ${obj.nik}</span>
                                <hr class="my-1 border-white/5">
                                <b class="text-white">${obj.customer}</b><br><span class="text-[9px] text-blue-300 font-bold">${obj.location}</span>
                            </td>
                            <td class="td-main">
                                <span class="text-[9px] font-bold text-slate-300 uppercase block mb-1">${obj.job || '-'}</span>
                                <hr class="my-1 border-white/5">
                                <b class="text-blue-200 text-[10px]">${obj.model}</b><br>
                                <span class="text-[9px] opacity-60">SN: ${obj.sn}</span><br>
                                <span class="text-[9px] opacity-60">HM: ${obj.hm}</span>
                            </td>
                            <td class="p-0">
                                <table class="w-full border-none">${chronoRows}</table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
        masterList.appendChild(section);
    });
    runAutoScale();
}

async function syncToCloud() {
    const btn = document.getElementById('btnSync');
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    btn.innerText = "..."; 
    btn.disabled = true;
    try {
        const payload = logs.map(l => ({ 
            id: l.id, 
            nik: l.nik, 
            log_data: { ...l, isSynced: true } 
        }));
        await sb.from('tech_logs').upsert(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.map(l => ({ ...l, isSynced: true }))));
        refreshTable(); 
        alert("❄️ Sync Success!");
    } catch (err) { 
        alert(err.message); 
    } finally { 
        btn.innerText = "❄️ Sync"; 
        btn.disabled = false; 
    }
}

async function pullFromCloud() {
    try {
        const { data } = await sb.from('tech_logs')
            .select('log_data')
            .eq('nik', userNik)
            .order('id', { ascending: false });
        if(data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.map(item => item.log_data)));
            refreshTable();
        }
    } catch (err) { 
        console.error(err); 
    }
}

function editLog(id) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const log = logs.find(l => l.id === id);
    isEditMode = true;
    document.getElementById('editId').value = log.id;
    document.getElementById('customerInp').value = log.customer;
    document.getElementById('locationInp').value = log.location;
    document.getElementById('dateInp').value = log.date;
    document.getElementById('modelInp').value = log.model;
    document.getElementById('snInp').value = log.sn;
    document.getElementById('hmInp').value = log.hm;
    document.getElementById('jobDescInp').value = log.job;
    document.getElementById('detailRowsContainer').innerHTML = '';
    log.detailData.forEach(d => addDetailRow(d.f, d.t, d.d));
    document.getElementById('submitBtn').innerText = "Authorize & Update";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteLog(id) {
    if(confirm("Delete record?")) {
        let logs = JSON.parse(localStorage.getItem(STORAGE_KEY)).filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        refreshTable();
    }
}

function clearForm() {
    isEditMode = false;
    ['customerInp','locationInp','modelInp','snInp','hmInp','jobDescInp'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('detailRowsContainer').innerHTML = '';
    addDetailRow();
    document.getElementById('submitBtn').innerText = "Authorize & Submit";
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let flatData = [];
    logs.forEach(l => {
        l.detailData.forEach((d, i) => {
            flatData.push([
                i === 0 ? l.date : '', 
                i === 0 ? l.name : '', 
                i === 0 ? l.customer : '', 
                i === 0 ? l.model : '', 
                i === 0 ? l.job : '', 
                `${d.f}-${d.t}`, 
                d.d
            ]);
        });
    });
    doc.autoTable({ 
        head: [['DATE', 'TECH', 'CLIENT', 'UNIT', 'JOB', 'TIME', 'DETAIL']], 
        body: flatData, 
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 8 }
    });
    doc.save("Activity_Report.pdf");
}

function exportToExcel() {
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let flat = logs.flatMap(l => l.detailData.map(d => ({ 
        Tgl: l.date, 
        Tech: l.name, 
        NIK: l.nik, 
        Client: l.customer,
        Unit: l.model, 
        Job: l.job, 
        Jam: `${d.f}-${d.t}`, 
        Detail: d.d 
    })));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logs");
    XLSX.writeFile(wb, "Activity_Report.xlsx");
}
