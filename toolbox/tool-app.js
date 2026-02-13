// --- CONFIGURATION ---
const listAlat = [
    "Adjustable wrench L=12\"", "Adjustable wrench pipe L=10\"", "Allen key 12mm", "Allen key 14mm", 
    "Allen key 17mm", "Allen key set 2-10mm", "Brush steel W=30mm", "Catridge belt wrench 125mm", 
    "Chisel plate W=11 L=140mm", "Combination wrench 24mm", "Combination wrench 27mm", 
    "Combination wrench 30mm", "Combination wrench 32mm", "Combination wrench 36mm", 
    "Combination wrench 41mm", "Extention socket 1/2\" L=10\"", "Extention socket 1/2\" L=5\"", 
    "Extention socket 3/4\" L=18\"", "Extention socket 3/4\" L=8\"", "Extention socket 1/2\" U-joint", 
    "Feeler gauge set", "Files set (5 pcs) 150mm", "Files plate type 250mm", "Files round type 250mm", 
    "Haksaw iron & blade", "Half moon wrench 14x17", "Half moon wrench 19x22", "Hammer besi 0.5kg", 
    "Hammer karet 0.5kg", "Hammer plastik 0.5kg", "Handle socket T 1/2\"", "Handle socket T 3/4\"", 
    "Handle rachet 1/2\"", "Handle rachet 3/4\"", "Magnetic stick L=50cm", "Multitester CD 800", 
    "Open end 6x7", "Open end 8x9", "Open end 10x11", "Open end 12x13", "Open end 14x15", 
    "Open end 16x17", "Open end 18x19", "Open end 20x22", "Open end 24x26", "Open end 36x41", 
    "Paint brush", "Pliers combination 200mm", "Pliers side cutting 200mm", "Pliers water pump", 
    "Pliers viece grip", "Pliers snap ring (in)", "Pliers snap ring (out)", "Pry bar L=40cm", 
    "Punch drift 150mm", "Punch center 130mm", "Ring spanner 6x7", "Ring spanner 8x9", 
    "Ring spanner 10x11", "Ring spanner 12x13", "Ring spanner 14x15", "Ring spanner 16x17", 
    "Ring spanner 18x19", "Ring spanner 20x22", "Ring spanner 24x26", "Scale meter roll 2.5m", 
    "Scrape blade W=25mm", "Screw drive plus 75mm", "Screw drive plus 100mm", "Screw drive plus 125mm", 
    "Screw drive plus 150mm", "Screw drive plate 75mm", "Screw drive plate 100mm", 
    "Screw drive plate 150mm", "Screw drive plate 200mm", "Socket (12) 1/2\" 10mm", 
    "Socket (12) 1/2\" 11mm", "Socket (12) 1/2\" 12mm", "Socket (12) 1/2\" 13mm", 
    "Socket (12) 1/2\" 14mm", "Socket (12) 1/2\" 15mm", "Socket (12) 1/2\" 16mm", 
    "Socket (12) 1/2\" 17mm", "Socket (12) 1/2\" 18mm", "Socket (12) 1/2\" 19mm", 
    "Socket (12) 1/2\" 20mm", "Socket (12) 1/2\" 21mm", "Socket (12) 1/2\" 22mm", 
    "Socket (12) 3/4\" 22mm", "Socket (12) 3/4\" 23mm", "Socket (12) 3/4\" 24mm", 
    "Socket (12) 3/4\" 27mm", "Socket (12) 3/4\" 28mm", "Socket (12) 3/4\" 29mm", 
    "Socket (12) 3/4\" 30mm", "Socket (12) 3/4\" 32mm", "Socket (12) 3/4\" 36mm", 
    "Socket (12) 3/4\" 38mm", "Socket (12) 3/4\" 41mm", "Socket (12) 3/4\" 46mm", 
    "Stop watch digital", "Thermometer 0-200C", "Treeds gauge set", "Tools box 3 step", 
    "Test pen DC", "Vernier caliper 150mm"
];

const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sbClient = supabase.createClient(SB_URL, SB_KEY);

const userNik = localStorage.getItem('userNIK') || 'UNKNOWN';
const userName = localStorage.getItem('userName') || 'TECHNICIAN';

// --- TABLE LOGIC ---
function initTable() {
    const tbody = document.getElementById('toolTableBody');
    tbody.innerHTML = listAlat.map((name, i) => `
        <tr id="row-${i+1}" class="hover:bg-white/5 transition-all">
            <td class="text-center py-4 text-blue-300/50 font-mono text-[9px]">${i + 1}</td>
            <td class="pr-2 leading-tight text-white">${name}</td>
            <td class="text-center"><input type="radio" name="t-${i+1}" value="B" onclick="updateRowStyle(${i+1}, 'B')"></td>
            <td class="text-center"><input type="radio" name="t-${i+1}" value="R" onclick="updateRowStyle(${i+1}, 'R')"></td>
            <td class="text-center"><input type="radio" name="t-${i+1}" value="H" onclick="updateRowStyle(${i+1}, 'H')"></td>
        </tr>
    `).join('');
}

function updateRowStyle(idx, status) {
    const tr = document.getElementById(`row-${idx}`);
    tr.classList.remove('row-baik', 'row-rusak', 'row-hilang');
    if(status === 'B') tr.classList.add('row-baik');
    else if(status === 'R') tr.classList.add('row-rusak');
    else if(status === 'H') tr.classList.add('row-hilang');
    refreshSummary();
}

function applyFilter(type) {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    const filterEl = document.getElementById(`f-${type}`);
    if (filterEl) filterEl.classList.add('active');
    
    let visible = 0;
    listAlat.forEach((_, i) => {
        const tr = document.getElementById(`row-${i+1}`);
        const sel = document.querySelector(`input[name="t-${i+1}"]:checked`)?.value;
        if(type === 'ALL' || sel === type) { 
            tr.classList.remove('hidden-row'); 
            visible++; 
        } else { 
            tr.classList.add('hidden-row'); 
        }
    });
    document.getElementById('itemCountDisplay').innerText = `SHOWING: ${visible} ITEMS`;
}

function refreshSummary() {
    let b=0, r=0, h=0;
    listAlat.forEach((_, i) => {
        const val = document.querySelector(`input[name="t-${i+1}"]:checked`)?.value;
        if(val === 'B') b++; else if(val === 'R') r++; else if(val === 'H') h++;
    });
    document.getElementById('countB').innerText = b;
    document.getElementById('countR').innerText = r;
    document.getElementById('countH').innerText = h;
}

function checkAllBaik() {
    listAlat.forEach((_, i) => {
        const rb = document.querySelector(`input[name="t-${i+1}"][value="B"]`);
        if(rb) { rb.checked = true; updateRowStyle(i+1, 'B'); }
    });
}

// --- DATABASE OPERATIONS ---
async function prosesSimpan() {
    const vals = listAlat.map((_, i) => document.querySelector(`input[name="t-${i+1}"]:checked`)?.value || null);
    if(vals.includes(null)) return alert("⚠️ Perhatian: Ada item yang belum diperiksa!");

    const hasIssue = vals.includes('R') || vals.includes('H');
    if (hasIssue) {
        if(confirm("Ditemukan item RUSAK/HILANG. Filter otomatis item bermasalah untuk review?")) {
            applyFilter('R'); return;
        }
    }

    const payload = {
        nik: document.getElementById('asset').value,
        pic_name: document.getElementById('pic').value,
        check_date: document.getElementById('tgl').value,
        branch: "ADARO PROJECT",
        items_data: vals
    };
    
    const id = document.getElementById('editingId').value;
    const res = id ? await sbClient.from('toolbox_reports').update(payload).eq('id', id) : await sbClient.from('toolbox_reports').insert([payload]);
    
    if(!res.error) { 
        alert("✅ Data NIK Cloud Synchronized!"); 
        resetForm(); 
        fetchHistory(); 
    } else { 
        alert("❌ Error: " + res.error.message); 
    }
}

async function fetchHistory() {
    document.getElementById('loader').classList.remove('hidden');
    const { data } = await sbClient.from('toolbox_reports')
        .select('*')
        .eq('nik', userNik)
        .order('check_date', {ascending: false})
        .limit(5);
    
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('histBody').innerHTML = (data || []).map(row => `
        <tr class="hover:bg-white/5 transition-all">
            <td class="py-3 font-black text-white">${row.check_date}<br><span class="text-[8px] text-blue-300 font-mono">${row.nik}</span></td>
            <td class="py-3 text-right">
                <button onclick='loadData(${JSON.stringify(row)})' class="bg-blue-500 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase">Edit</button>
            </td>
        </tr>`).join('');
}

function loadData(row) {
    document.getElementById('editingId').value = row.id;
    document.getElementById('tgl').value = row.check_date;
    row.items_data.forEach((val, i) => {
        const rad = document.querySelector(`input[name="t-${i+1}"][value="${val}"]`);
        if(rad) { rad.checked = true; updateRowStyle(i+1, val); }
    });
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    document.getElementById('editingId').value = "";
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('#toolTableBody tr').forEach(tr => tr.classList.remove('row-baik', 'row-rusak', 'row-hilang', 'hidden-row'));
    document.getElementById('tgl').valueAsDate = new Date();
    applyFilter('ALL'); 
    refreshSummary();
}

// --- UTILITIES ---
function updateMonthBadge() {
    const d = new Date(document.getElementById('tgl').value || new Date());
    const m = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
    document.getElementById('currentMonthBadge').innerText = `${m[d.getMonth()]} ${d.getFullYear()}`;
}

function handleAutoScale() {
    const s = document.getElementById('scaler-context');
    const r = window.innerWidth / 720;
    if(window.innerWidth < 720) { 
        s.style.transform = `scale(${r})`; 
        s.style.marginBottom = `-${(1-r)*s.offsetHeight}px`; 
    } else { 
        s.style.transform = `scale(1)`; 
        s.style.marginBottom = '0px'; 
    }
}

// --- INITIALIZATION ---
window.onload = () => {
    if (localStorage.getItem('isLoggedIn') !== 'true') window.location.href = 'login.html';
    
    document.documentElement.style.display = 'block';
    document.getElementById('roleText').innerText = `NIK: ${userNik} | ${userName}`;
    document.getElementById('asset').value = userNik;
    document.getElementById('pic').value = userName;
    document.getElementById('tgl').valueAsDate = new Date();
    
    initTable(); 
    fetchHistory(); 
    handleAutoScale();
    
    window.addEventListener('resize', handleAutoScale);
}
