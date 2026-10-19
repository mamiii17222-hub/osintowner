let logs = [];
let activeFilter = 'all';
let autoRefreshTimer = null;

const tableBody = document.getElementById('logsTableBody');
const searchInput = document.getElementById('searchInput');
const authKeyInput = document.getElementById('authKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const totalLogsCount = document.getElementById('totalLogsCount');
const activePlayersCount = document.getElementById('activePlayersCount');
const lastCoordTime = document.getElementById('lastCoordTime');
const lastCoordCoords = document.getElementById('lastCoordCoords');

// 1. Theme Management (Purple <-> Red)
const savedTheme = localStorage.getItem('osint_theme') || 'purple';
document.documentElement.setAttribute('data-theme', savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'purple';
    const nextTheme = current === 'purple' ? 'red' : 'purple';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('osint_theme', nextTheme);
  });
}

// 2. Auth Key Persistence
const savedKey = localStorage.getItem('osint_key') || 'osint1337';
authKeyInput.value = savedKey;

saveKeyBtn.addEventListener('click', () => {
  localStorage.setItem('osint_key', authKeyInput.value.trim());
  fetchLogs();
});

refreshBtn.addEventListener('click', () => {
  fetchLogs();
});

autoRefreshCheckbox.addEventListener('change', () => {
  if (autoRefreshCheckbox.checked) {
    startAutoRefresh();
  } else {
    clearInterval(autoRefreshTimer);
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

searchInput.addEventListener('input', () => {
  render();
});

async function fetchLogs() {
  const key = authKeyInput.value.trim();
  try {
    const res = await fetch(`/api/log?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      if (res.status === 401) {
        tableBody.innerHTML = `
          <tr class="empty-row">
            <td colspan="5" style="color: #ff3366; text-align: center; padding: 40px;">
              ⚠️ GEÇERSİZ API KEY! Lütfen sağ üstten doğru anahtarı girin.
            </td>
          </tr>`;
      }
      return;
    }
    const data = await res.json();
    if (data && data.logs) {
      logs = data.logs;
      updateStats();
      render();
    }
  } catch (err) {
    console.error('Fetch logs error:', err);
  }
}

function updateStats() {
  totalLogsCount.textContent = logs.length;
  const uniquePlayers = new Set(logs.map(l => l.player).filter(p => p && p !== 'Unknown'));
  activePlayersCount.textContent = uniquePlayers.size;

  const coordLogs = logs.filter(l => l.type === 'coordinate' || (l.content && l.content.includes('HOME TRACKER')));
  if (coordLogs.length > 0) {
    const latest = new Date(coordLogs[0].timestamp);
    lastCoordTime.textContent = isNaN(latest.getTime()) ? 'YENİ' : latest.toLocaleTimeString();
    
    // Parse coordinates if available
    const match = coordLogs[0].content.match(/X:\s*([-\d.]+)\s*\|\s*Y:\s*([-\d.]+)\s*\|\s*Z:\s*([-\d.]+)/);
    if (match) {
      lastCoordCoords.textContent = `XYZ: ${match[1]}, ${match[2]}, ${match[3]}`;
    } else {
      lastCoordCoords.textContent = 'Son Konum Kaydedildi';
    }
  } else {
    lastCoordTime.textContent = '-';
    lastCoordCoords.textContent = 'GPS Takipçisi Beklemede';
  }
}

function render() {
  const query = searchInput.value.toLowerCase().trim();
  
  const filtered = logs.filter(log => {
    const isCoord = log.type === 'coordinate' || (log.content && log.content.includes('HOME TRACKER'));
    
    if (activeFilter === 'coordinate' && !isCoord) return false;
    if (activeFilter === 'chat' && isCoord) return false;

    if (query) {
      const matchPlayer = (log.player || '').toLowerCase().includes(query);
      const matchContent = (log.content || '').toLowerCase().includes(query);
      return matchPlayer || matchContent;
    }
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">
          <div class="radar-scan-box">
            <div class="radar-sweep"></div>
            <span>Eşleşen log bulunamadı veya henüz veri gelmedi.</span>
          </div>
        </td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(log => {
    const date = new Date(log.timestamp);
    const timeStr = isNaN(date.getTime()) ? '-' : date.toLocaleTimeString();
    const isCoord = log.type === 'coordinate' || (log.content && log.content.includes('HOME TRACKER'));
    const tagClass = isCoord ? 'tag-coord' : 'tag-chat';
    const tagLabel = isCoord ? '📍 KOORD' : '💬 MESAJ';

    // Format content nicely
    let cleanContent = log.content || '';
    
    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.78rem; font-family: var(--font-mono);">${timeStr}</td>
        <td><span class="player-badge">🎮 ${escapeHtml(log.player || 'Unknown')}</span></td>
        <td><span class="${tagClass}">${tagLabel}</span></td>
        <td style="word-break: break-word; color: #fff; font-size: 0.88rem;">${escapeHtml(cleanContent)}</td>
        <td style="text-align: right;">
          <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(cleanContent)}'); this.textContent='KOPYALANDI!'; setTimeout(() => this.textContent='KOPYALA', 1400);">KOPYALA</button>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function startAutoRefresh() {
  clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchLogs, 3000);
}

// Launch
fetchLogs();
startAutoRefresh();
