// --- CONFIG ---
const SB_URL = "https://corpgiuxyhfxdnqwwmlv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E";
const sb = supabase.createClient(SB_URL, SB_KEY);

// --- AUTO SCALE ENGINE ---
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

// --- INITIALIZE DATA ---
async function initDashboard() {
    try {
        const { count: ucCount } = await sb.from('uc_reports').select('*', { count: 'exact', head: true });
        const { count: toolCount } = await sb.from('toolbox_reports').select('*', { count: 'exact', head: true });
        const { count: userCount } = await sb.from('users').select('*', { count: 'exact', head: true });
        const { count: actCount } = await sb.from('tech_logs').select('*', { count: 'exact', head: true });
        
        document.getElementById('totalUC').innerText = ucCount || 0;
        document.getElementById('totalTool').innerText = toolCount || 0;
        document.getElementById('totalTech').innerText = userCount || 0;
        document.getElementById('totalAct').innerText = actCount || 0;

        const { data: recentUC } = await sb.from('uc_reports').select('customer_name, unit_no, nik, inspection_date').order('id', {ascending: false}).limit(10);
        renderFeed(recentUC);

        const { data: allUsers } = await sb.from('users').select('nik, full_name');
        const { data: allUC } = await sb.from('uc_reports').select('nik');
        const { data: allTools } = await sb.from('toolbox_reports').select('nik');
        renderRanking(allUsers, allUC, allTools);

        renderChart();
        setTimeout(runAutoScale, 300);
    } catch (err) { console.error(err); }
}

function renderFeed(data) {
    const feed = document.getElementById('liveFeed');
    feed.innerHTML = data.map(item => `
        <div class="bg-slate-50 p-3 rounded-xl border-l-4 border-teal-500 hover:bg-white transition-all shadow-sm">
            <p class="text-[9px] font-black text-teal-600 uppercase tracking-tighter">${item.unit_no} • ${item.customer_name}</p>
            <p class="text-[11px] text-slate-700 mt-1 font-semibold">Inspection by <span class="text-teal-600">${item.nik}</span></p>
            <p class="text-[8px] text-slate-400 mt-1 font-bold">${item.inspection_date}</p>
        </div>
    `).join('');
}

function renderRanking(users, ucData, toolData) {
    const tbody = document.getElementById('rankingTable');
    const ranking = users.map(user => ({
        name: user.full_name,
        nik: user.nik,
        uc: ucData.filter(u => u.nik === user.nik).length,
        tool: toolData.filter(t => t.nik === user.nik).length
    })).sort((a, b) => (b.uc + b.tool) - (a.uc + a.tool));

    tbody.innerHTML = ranking.map(r => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="py-3 font-bold uppercase italic text-slate-800 text-[10px]">${r.name}</td>
            <td class="font-mono text-teal-600 font-bold text-[9px]">${r.nik}</td>
            <td class="font-black text-slate-600 text-[10px]">${r.uc}</td>
            <td class="font-black text-slate-600 text-[10px]">${r.tool}</td>
            <td class="text-right"><span class="px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 text-[7px] font-black uppercase">Active</span></td>
        </tr>
    `).join('');
}

function renderChart() {
    const ctx = document.getElementById('prodChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Inspections',
                data: [15, 22, 19, 34, 45, 60],
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.05)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0d9488',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.02)' }, ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 } } }
            }
        }
    });
}

// --- LISTENERS ---
window.addEventListener('resize', runAutoScale);
window.onload = initDashboard;
