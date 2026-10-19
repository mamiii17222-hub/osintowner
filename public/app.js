let logs = [];
let activeFilter = 'all';
let autoRefreshTimer = null;

const tableBody = document.getElementById('logsTableBody');
const searchInput = document.getElementById('searchInput');
const authKeyInput = document.getElementById('authKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');

const totalLogsCount = document.getElementById('totalLogsCount');
const activePlayersCount = document.getElementById('activePlayersCount');
const lastCoordTime = document.getElementById('lastCoordTime');

// Init key
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
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="5" style="color: var(--danger)">Hata: Geçersiz API Key! Lütfen geçerli bir anahtar girin.</td></tr>`;
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
  const uniquePlayers = new Set(logs.map(l => l.player).filter(Boolean));
  activePlayersCount.textContent = uniquePlayers.size;

  const coordLogs = logs.filter(l => l.type === 'coordinate');
  if (coordLogs.length > 0) {
    const latest = new Date(coordLogs[0].timestamp);
    lastCoordTime.textContent = latest.toLocaleTimeString();
  } else {
    lastCoordTime.textContent = '-';
  }
}

function render() {
  const query = searchInput.value.toLowerCase().trim();
  
  const filtered = logs.filter(log => {
    // Filter by type
    if (activeFilter === 'coordinate' && log.type !== 'coordinate') return false;
    if (activeFilter === 'chat' && log.type !== 'chat') return false;

    // Search query
    if (query) {
      const matchPlayer = (log.player || '').toLowerCase().includes(query);
      const matchContent = (log.content || '').toLowerCase().includes(query);
      return matchPlayer || matchContent;
    }
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr class="empty-row"><td colspan="5">Kayıt bulunamadı.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(log => {
    const date = new Date(log.timestamp);
    const timeStr = isNaN(date.getTime()) ? '-' : date.toLocaleTimeString();
    const tagClass = log.type === 'coordinate' ? 'tag-coord' : 'tag-chat';
    const tagLabel = log.type === 'coordinate' ? 'KOORD' : 'MESAJ';

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.75rem;">${timeStr}</td>
        <td><strong>${escapeHtml(log.player || 'Unknown')}</strong></td>
        <td><span class="${tagClass}">${tagLabel}</span></td>
        <td style="word-break: break-word;">${escapeHtml(log.content)}</td>
        <td style="text-align: right;">
          <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(log.content)}'); this.textContent='Kopyalandı!'; setTimeout(() => this.textContent='Kopyala', 1500);">Kopyala</button>
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

// Initial fetch & auto refresh
fetchLogs();
startAutoRefresh();
