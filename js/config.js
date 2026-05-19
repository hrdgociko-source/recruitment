/* ============================================================
   config.js — Konfigurasi & Helper Global
   ============================================================ */

// ── Ganti URL ini setelah deploy GAS ──────────────────────
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxxpT8bvH7eXO7jbwIRBcg8Pfu4DM4ZdRbE565IbSzr8_LhWCGuUIf71pRQvfoktECl/exec';

// ============================================================
// API: POST
// ============================================================
async function apiPost(action, data) {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, data })
    });
    return await response.json();
  } catch (error) {
    console.error('API POST Error:', error);
    return { status: 'error', message: 'Gagal terhubung ke server. Coba lagi.' };
  }
}

// ============================================================
// API: GET
// ============================================================
async function apiGet(params) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${GAS_URL}?${query}`);
    return await response.json();
  } catch (error) {
    console.error('API GET Error:', error);
    return { status: 'error', message: 'Gagal terhubung ke server. Coba lagi.' };
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ============================================================
// RADIO SELECT VISUAL
// ============================================================
function selectRadio(element, name, value) {
  // Hapus semua selected dalam grup yang sama
  const group = element.closest('.radio-group');
  if (group) {
    group.querySelectorAll('.radio-option').forEach(opt => {
      opt.classList.remove('selected');
    });
  }
  element.classList.add('selected');

  const radio = element.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

// ============================================================
// GET RADIO VALUE
// ============================================================
function getRadioValue(name) {
  const radio = document.querySelector(`input[name="${name}"]:checked`);
  return radio ? radio.value : '';
}

// ============================================================
// TOGGLE FIELD VISIBILITY
// ============================================================
function toggleField(fieldId, show) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  show
    ? field.classList.remove('hidden')
    : field.classList.add('hidden');
}

// ============================================================
// BADGE HTML BY STATUS
// ============================================================
function getBadgeHtml(status) {
  const map = {
    'Baru'     : '<span class="badge badge-baru">🆕 Baru</span>',
    'Diproses' : '<span class="badge badge-diproses">🔄 Diproses</span>',
    'Diterima' : '<span class="badge badge-diterima">✅ Diterima</span>',
    'Ditolak'  : '<span class="badge badge-ditolak">❌ Ditolak</span>'
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

// ============================================================
// FORMAT TANGGAL
// ============================================================
function formatDate(str) {
  if (!str) return '-';
  try {
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return str; }
}

// ============================================================
// SET VALUE HELPER
// ============================================================
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) {
    el.value = value;
  }
}

// ============================================================
// SET RADIO VALUE & VISUAL
// ============================================================
function setRadioValue(name, value) {
  if (!value) return;
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) {
    radio.checked = true;
    const label = radio.closest('.radio-option');
    if (label) label.classList.add('selected');
  }
}
