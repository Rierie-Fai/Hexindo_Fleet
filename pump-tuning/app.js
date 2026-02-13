/**
 * NIK TERMINAL - PUMP TUNING SYSTEM
 * Unified Script: Loading + Tech Sync + Pump Logic
 */

// // --- CONFIGURATION ---
const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sb = supabase.createClient(SB_URL, SB_KEY);

// --- STATE MANAGEMENT ---
let currentNik = localStorage.getItem('userNIK');
let currentRecordId = null;
let currentPump = "1";
let nikChart;
let masterStore = JSON.parse(localStorage.getItem('nik_master_store')) || {};

const pumpFlowStd = [
    { label: 'P50', p: '50 ± 2', ne: 1900, i: 1.02, np: 1838, min: 524, max: 535, std: '502 ± 5' },
    { label: 'P137', p: '137 ± 5', ne: 1900, i: 1.02, np: 1838, min: 512, max: 523, std: '491 ± 5' },
    { label: 'P170', p: '170', ne: 1900, i: 1.02, np: 1838, min: 422, max: 453, std: '415 ± 15' },
    { label: 'P250', p: '250 ± 5', ne: 1900, i: 1.02, np: 1838, min: 284, max: 315, std: '284 ± 15' },
    { label: 'P300', p: '300 ± 2', ne: 1900, i: 1.02, np: 1838, min: 234, max: 245, std: '227 ± 5' }
];

// --- INITIALIZATION (WITH LOADING & TECH SYNC) ---
window.addEventListener('load', async () => {
    console.log("NIK Terminal Initializing...");
    
    // 1. Jalankan Inisialisasi Form & UI
    initGeneralForms();
    runAutoScale();
    
    // 2. Sinkronisasi Data Teknisi agar tidak "Unknown"
    await syncTechnicianProfile();

    // 3. Load Data Pendukung
    fetchHistory();
    
    // Set default values
    const dispNik = document.getElementById('display-nik');
    const valNik = document.getElementById('nik');
    const dateInp = document.getElementById('test_date');
    
    if(dispNik) dispNik.innerText = currentNik || 'GUEST';
    if(valNik) valNik.value = currentNik || 'GUEST';
    if(dateInp) dateInp.valueAsDate = new Date();

    // 4. Sembunyikan Splash Screen
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            setTimeout(() => loader.remove(), 600);
        }, 1200); // Delay sedikit untuk branding NIK
    }
});

/**
 * Fitur: Sync Technician Profile
 * Menarik nama asli dari database berdasarkan NIK
 */
async function syncTechnicianProfile() {
    const nameInput = document.getElementById('nama_pic');
    if (!currentNik || !nameInput) return;

    try {
        const { data, error } = await sb
            .from('users')
            .select('full_name')
            .eq('nik', currentNik)
            .single();

        if (data && data.full_name) {
            const formattedName = data.full_name.toUpperCase();
            nameInput.value = formattedName;
            localStorage.setItem('userName', formattedName);
        } else {
            // Gunakan nama lama dari storage jika DB gagal
            nameInput.value = localStorage.getItem('userName') || "Unknown";
        }
    } catch (err) {
        console.error("Profile Sync Error:", err);
        nameInput.value = localStorage.getItem('userName') || "Unknown";
    }
}

// --- UI UTILITIES ---
function runAutoScale() {
    const scaler = document.getElementById('scaler-context');
    if (!scaler) return;
    const windowWidth = window.innerWidth;
    const scaleRatio = Math.min(windowWidth / 720, 1);
    if (windowWidth < 720) {
        scaler.style.transform = `scale(${scaleRatio})`;
        scaler.style.marginBottom = `-${(1 - scaleRatio) * scaler.offsetHeight}px`;
    } else {
        scaler.style.transform = `scale(1)`;
        scaler.style.marginBottom = `0px`;
    }
}

function handleKeyNavigation(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        const focusable = Array.from(document.querySelectorAll('input:not([readonly]), textarea, select'));
        const index = focusable.indexOf(e.target);
        if (index > -1 && index < focusable.length - 1) focusable[index + 1].focus();
    }
}

// --- HISTORY LOGIC ---
function toggleHistory(event) {
    if (event) event.stopPropagation();
    const p = document.getElementById('history-panel');
    const trigger = document.getElementById('history-trigger');
    const isMinimized = p.classList.toggle('minimized');
    if (trigger) trigger.style.opacity = isMinimized ? "1" : "0";
    if(!isMinimized) fetchHistory();
}

document.addEventListener('click', (event) => {
    const panel = document.getElementById('history-panel');
    const trigger = document.getElementById('history-trigger');
    if (panel && !panel.classList.contains('minimized')) {
        if (!panel.contains(event.target) && !trigger.contains(event.target)) {
            panel.classList.add('minimized');
            if(trigger) trigger.style.opacity = "1";
        }
    }
});

// --- PUMP CALCULATION & RENDERING ---
function renderPumpAnalysis() {
    const container = document.getElementById('pump-tables-container');
    if(!container) return;
    const pumpData = masterStore[currentPump] || { valuesBefore: [], valuesAfter: [] };
    
    const buildTable = (title, type) => {
        const values = (type === 'after' ? pumpData.valuesAfter : pumpData.valuesBefore) || [];
        let allPass = true;
        if (type === 'after') {
            pumpFlowStd.forEach((item, i) => {
                const val = values[i];
                if (!val) { allPass = false; return; }
                const qc = Math.round((item.np * val) / (item.i * item.ne));
                const stdBase = parseInt(item.std.split('±')[0]);
                const stdTol = parseInt(item.std.split('±')[1]);
                if (qc < (stdBase - stdTol) || qc > (stdBase + stdTol)) allPass = false;
            });
        }

        return `
            <div class="glass-card mb-6 ${type === 'after' && values.filter(v => v).length === 5 ? (allPass ? 'border-green-500 shadow-lg' : 'border-red-400') : ''}">
                <div class="bg-slate-50 p-2 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="text-[9px] font-black text-blue-600 uppercase px-2">${title}</h3>
                    ${type === 'after' && values.filter(v => v).length === 5 ? 
                        `<span class="px-3 py-1 rounded-full text-[8px] font-black uppercase ${allPass ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600 animate-pulse'}">
                            ${allPass ? '<i class="fas fa-check-circle mr-1"></i> PASS' : '<i class="fas fa-exclamation-triangle mr-1"></i> OUT OF SPEC'}
                        </span>` : ''
                    }
                </div>
                <table class="table-custom">
                    <thead><tr><th>Point</th><th>Press</th><th class="text-blue-600">Measured Q</th><th>QC (Calc)</th><th>Standard (QC)</th><th class="opacity-40">Guidance (MQ)</th></tr></thead>
                    <tbody>
                        ${pumpFlowStd.map((item, i) => {
                            const val = values[i] || '';
                            const qc = val ? Math.round((item.np * val) / (item.i * item.ne)) : '-';
                            let statusColor = 'text-blue-600';
                            if (type === 'after' && val) {
                                const stdBase = parseInt(item.std.split('±')[0]);
                                const stdTol = parseInt(item.std.split('±')[1]);
                                statusColor = (qc >= (stdBase - stdTol) && qc <= (stdBase + stdTol)) ? 'text-green-600' : 'text-red-500 font-black';
                            }
                            return `<tr><td class="font-black">${item.label}</td><td class="text-slate-400 italic">${item.p}</td><td><input type="number" class="input-glacial !p-1 text-center w-20" data-type="${type}" data-idx="${i}" value="${val}" oninput="updatePumpValueRealtime(this)"></td><td class="qc-output ${statusColor}" id="qc-${type}-${i}">${qc}</td><td class="font-bold text-slate-500">${item.std}</td><td class="opacity-30 italic text-[8px] font-bold">${item.min} - ${item.max}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    };
    container.innerHTML = buildTable('1. BEFORE ADJUSTMENT', 'before') + buildTable('2. AFTER READJUSTMENT', 'after');
    updateChart();
}

function updatePumpValueRealtime(el) {
    const type = el.dataset.type;
    const idx = parseInt(el.dataset.idx);
    const val = el.value;
    if(!masterStore[currentPump]) masterStore[currentPump] = { valuesBefore: [], valuesAfter: [] };
    masterStore[currentPump][type === 'after' ? 'valuesAfter' : 'valuesBefore'][idx] = val;
    updateChart();
    localStorage.setItem('nik_master_store', JSON.stringify(masterStore));
}

// --- DATABASE & CLOUD SYNC ---
async function fetchHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    const { data } = await sb.from('pump_performance_reports').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) {
        list.innerHTML = data.map(rec => `
            <div class="history-item flex justify-between items-center p-2 mb-1 bg-slate-50 rounded-lg border">
                <div class="overflow-hidden">
                    <p class="text-[10px] font-black uppercase text-slate-800">${rec.unit_model || 'UNIT'}</p>
                    <p class="text-[8px] text-blue-500 font-bold uppercase">${new Date(rec.test_date).toLocaleDateString('id-ID')}</p>
                </div>
                <button onclick="loadRecord('${rec.id}')" class="w-7 h-7 bg-white text-blue-600 rounded-lg border flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><i class="fas fa-folder-open text-[9px]"></i></button>
            </div>`).join('');
    }
}

async function saveToCloud() {
    const loader = document.getElementById('loadingOverlay');
    if(loader) loader.style.display = 'flex';
    
    const recId = document.getElementById('current_record_id').value;
    const record = {
        test_date: document.getElementById('test_date').value,
        nik: document.getElementById('nik').value,
        unit_model: document.getElementById('unit_model').value,
        serial_number: document.getElementById('serial_num').value,
        hour_meter: document.getElementById('hour_meter').value,
        component_history: Array.from(document.querySelectorAll('.data-comp')).map(i => i.value),
        pump_relief_values: Array.from(document.querySelectorAll('.data-pump')).map(i => i.value),
        engine_speed_values: Array.from(document.querySelectorAll('.data-eng')).map(i => i.value),
        cycle_time_values: Array.from(document.querySelectorAll('.data-cyc')).map(i => i.value),
        all_pumps_data: masterStore
    };
    
    let res = recId ? await sb.from('pump_performance_reports').update(record).eq('id', recId) : await sb.from('pump_performance_reports').insert([record]);
    
    if(loader) loader.style.display = 'none';
    if (res.error) alert("Sync Error!"); else { alert("✅ Synchronized!"); prepareNewEntry(); fetchHistory(); switchTab('general'); }
}

async function loadRecord(id) {
    const loader = document.getElementById('loadingOverlay');
    if(loader) loader.style.display = 'flex';
    
    const { data } = await sb.from('pump_performance_reports').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('current_record_id').value = data.id;
        setMode('edit', data.id);
        document.getElementById('unit_model').value = data.unit_model;
        document.getElementById('serial_num').value = data.serial_number;
        document.getElementById('test_date').value = data.test_date;
        document.getElementById('hour_meter').value = data.hour_meter;
        masterStore = data.all_pumps_data || {};
        localStorage.setItem('nik_master_store', JSON.stringify(masterStore));
        const setVal = (sel, vals) => document.querySelectorAll(sel).forEach((el, i) => el.value = vals[i] || '');
        setVal('.data-comp', data.component_history || []);
        setVal('.data-pump', data.pump_relief_values || []);
        setVal('.data-eng', data.engine_speed_values || []);
        setVal('.data-cyc', data.cycle_time_values || []);
        if(!document.getElementById('section-pump').classList.contains('hidden')) renderPumpAnalysis();
        const panel = document.getElementById('history-panel');
        if(panel) panel.classList.add('minimized');
        const trigger = document.getElementById('history-trigger');
        if(trigger) trigger.style.opacity = "1";
    }
    if(loader) loader.style.display = 'none';
}

// --- FORM & CHART INITIALIZATION ---
function initGeneralForms() {
    const compBody = document.getElementById('comp-history-body');
    const pumpGrid = document.getElementById('pump-relief-grid');
    const engBody = document.getElementById('engine-speed-body');
    const cycBody = document.getElementById('cycle-time-body');

    if(compBody) {
        const comps = ["ENGINE", "PUMP 1-2", "PUMP 3-4", "PUMP 5-6", "PUMP 7-8"];
        compBody.innerHTML = comps.map(c => `<tr><td class="p-2 font-black text-[9px] text-slate-700 pl-4 bg-slate-50/50">${c}</td><td><input type="text" class="input-glacial !p-1.5 border-0 data-comp"></td><td><input type="text" class="input-glacial !p-1.5 border-0 data-comp"></td><td><input type="number" class="input-glacial !p-1.5 border-0 data-comp"></td><td><input type="text" class="input-glacial !p-1.5 border-0 data-comp"></td></tr>`).join('');
    }
    if(pumpGrid) {
        pumpGrid.innerHTML = Array.from({length:8}, (_,i)=>`<div><label class="text-[9px] font-black text-slate-400 mb-1 block">P${i+1}</label><input type="number" class="input-glacial text-center data-pump"></div>`).join('');
    }
    if(engBody) {
        const engData = [{n: "Low Idle", s: "780-820"}, {n: "High Idle", s: "1850-1950"}, {n: "Auto Idle", s: "1350-1450"}, {n: "Relief Idle", s: "1770-1830"}];
        engBody.innerHTML = engData.map(e => `<tr><td class="p-3 font-bold text-slate-700 text-[10px] pl-4">${e.n}</td><td class="text-[10px] font-bold text-slate-400">${e.s}</td><td class="p-1"><input type="number" class="input-glacial data-eng text-center"></td><td class="p-1"><input type="number" class="input-glacial data-eng text-center"></td></tr>`).join('');
    }
    if(cycBody) {
        const actions = [{n: "Boom Raise", s: "8.2±0.5"},{n: "Arm Roll-in", s: "7.0±0.5"},{n: "Arm Roll-out", s: "7.0±0.5"},{n: "Bucket Roll-in", s: "4.7±0.5"},{n: "Bucket Roll-out", s: "4.2±0.5"},{n: "Swing RH", s: "57±3"},{n: "Swing LH", s: "57±3"}];
        cycBody.innerHTML = actions.map(a => `<tr><td class="text-[9px] text-left font-black p-2 pl-4 text-slate-700 bg-slate-50/30">${a.n}</td><td class="std-text">${a.s}</td><td class="p-1"><input type="number" step="0.1" class="input-glacial text-center data-cyc"></td><td class="p-1"><input type="number" step="0.1" class="input-glacial text-center data-cyc"></td></tr>`).join('');
    }
}

function initChart() {
    const chartEl = document.getElementById('nikChart');
    if (!chartEl) return;
    const ctx = chartEl.getContext('2d');
    if (nikChart) nikChart.destroy();
    nikChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: pumpFlowStd.map(d => d.label),
            datasets: [
                { label: 'Min Std', data: pumpFlowStd.map(item => parseInt(item.std.split('±')[0]) - parseInt(item.std.split('±')[1])), borderColor: '#facc15', borderDash: [5,5], pointRadius: 0, fill: false },
                { label: 'Max Std', data: pumpFlowStd.map(item => parseInt(item.std.split('±')[0]) + parseInt(item.std.split('±')[1])), borderColor: '#ef4444', borderDash: [5,5], pointRadius: 0, fill: false },
                { label: 'Before', data: [], borderColor: '#94a3b8', tension: 0.3, pointRadius: 4, fill: false },
                { label: 'After', data: [], borderColor: '#3b82f6', tension: 0.3, pointRadius: 4, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateChart() {
    if(!nikChart) return;
    const pumpData = masterStore[currentPump] || { valuesBefore: [], valuesAfter: [] };
    const calcQC = (v, i) => v ? Math.round((pumpFlowStd[i].np * v) / (pumpFlowStd[i].i * pumpFlowStd[i].ne)) : null;
    nikChart.data.datasets[2].data = (pumpData.valuesBefore || []).map((v, i) => calcQC(v, i));
    nikChart.data.datasets[3].data = (pumpData.valuesAfter || []).map((v, i) => calcQC(v, i));
    nikChart.update();
}

function switchTab(t) {
    const secGen = document.getElementById('section-general');
    const secPump = document.getElementById('section-pump');
    const btnGen = document.getElementById('tab-gen');
    const btnPump = document.getElementById('tab-pump');

    if(secGen) secGen.classList.toggle('hidden', t !== 'general');
    if(secPump) secPump.classList.toggle('hidden', t !== 'pump');
    if(btnGen) btnGen.classList.toggle('active', t === 'general');
    if(btnPump) btnPump.classList.toggle('active', t === 'pump');
    
    if(t === 'pump') { 
        if(!nikChart) initChart(); 
        renderPumpAnalysis(); 
    }
}

function changePump(v) { 
    currentPump = v; 
    const badge = document.getElementById('active-p-num');
    if(badge) badge.innerText = v; 
    renderPumpAnalysis(); 
}

function setMode(mode, id = '') {
    const badge = document.getElementById('accessBadge');
    const statusText = document.getElementById('sync-status');
    if (badge && statusText) {
        if (mode === 'edit') {
            badge.className = "status-badge-edit inline-block mt-2 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter";
            statusText.innerText = "Edit Mode: " + id.substring(0, 8);
        } else {
            badge.className = "status-badge-new inline-block mt-2 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter";
            statusText.innerText = "New Entry Mode";
        }
    }
}

function prepareNewEntry() {
    const recId = document.getElementById('current_record_id');
    if(recId) recId.value = "";
    setMode('new');
    document.querySelectorAll('.input-glacial:not(.input-readonly)').forEach(i => i.value = "");
    const dateInp = document.getElementById('test_date');
    if(dateInp) dateInp.valueAsDate = new Date();
    masterStore = {};
    localStorage.removeItem('nik_master_store');
    renderPumpAnalysis();
}

// Global Event Listeners
window.addEventListener('resize', runAutoScale);
document.addEventListener('keydown', (e) => { if(e.target.tagName === 'INPUT') handleKeyNavigation(e); });