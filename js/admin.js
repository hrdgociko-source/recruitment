/* ============================================================
   admin.js — Logic Dashboard Admin + Auth
   ============================================================ */

let allPelamar    = [];
let currentFilter = 'Semua';
let currentSearch = '';

// ── Session Key di sessionStorage ─────────────────────────
const SESSION_KEY = 'gociko_admin_auth';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

// ============================================================
// CEK SESSION — Sudah login atau belum
// ============================================================
function checkSession() {
  const isAuth = sessionStorage.getItem(SESSION_KEY);

  if (isAuth === 'true') {
    showAdminPage();
  } else {
    showLoginPage();
  }
}

// ============================================================
// SHOW LOGIN / ADMIN PAGE
// ============================================================
function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('adminPage').classList.add('hidden');
}

function showAdminPage() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('adminPage').classList.remove('hidden');
  loadStats();
  loadPelamar();
}

// ============================================================
// HANDLE LOGIN
// ============================================================
async function handleLogin(e) {
  e.preventDefault();

  const password = document.getElementById('passwordInput').value.trim();
  const btn      = document.getElementById('loginBtn');
  const errorEl  = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');

  if (!password) {
    showLoginError('Password tidak boleh kosong!');
    return;
  }

  // Loading
  btn.classList.add('btn-loading');
  btn.disabled = true;
  errorEl.classList.remove('show');

  try {
    const result = await apiGet({
      action  : 'checkPassword',
      password: password
    });

    if (result.status === 'success' && result.valid === true) {
      // Simpan session
      sessionStorage.setItem(SESSION_KEY, 'true');
      showToast('Login berhasil! Selamat datang 👋', 'success');
      showAdminPage();

    } else if (result.status === 'success' && result.valid === false) {
      showLoginError('Password salah! Coba lagi.');
      shakeLoginBox();

    } else {
      showLoginError(result.message || 'Terjadi kesalahan. Coba lagi.');
    }

  } catch (error) {
    showLoginError('Gagal terhubung ke server. Cek koneksi kamu.');
  }

  btn.classList.remove('btn-loading');
  btn.disabled = false;
}

// ============================================================
// SHOW LOGIN ERROR
// ============================================================
function showLoginError(msg) {
  const errorEl  = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');
  errorMsg.textContent = msg;
  errorEl.classList.add('show');

  // Auto hide setelah 4 detik
  setTimeout(() => errorEl.classList.remove('show'), 4000);
}

// ============================================================
// SHAKE ANIMATION — Login box goyang kalau salah
// ============================================================
function shakeLoginBox() {
  const box = document.querySelector('.login-box');
  box.style.animation = 'none';
  box.style.transition = 'transform 0.1s ease';

  const times = [0, 10, -10, 8, -8, 5, -5, 0];
  let i = 0;
  const interval = setInterval(() => {
    box.style.transform = `translateX(${times[i]}px)`;
    i++;
    if (i >= times.length) {
      clearInterval(interval);
      box.style.transform = '';
    }
  }, 60);
}

// ============================================================
// TOGGLE PASSWORD VISIBILITY
// ============================================================
function togglePassword() {
  const input = document.getElementById('passwordInput');
  const btn   = document.getElementById('togglePwBtn');

  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// ============================================================
// HANDLE LOGOUT
// ============================================================
function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginError').classList.remove('show');
  showLoginPage();
  showToast('Berhasil keluar dari sesi admin', 'warning');
}

// ============================================================
// LOAD STATISTIK
// ============================================================
async function loadStats() {
  const result = await apiGet({ action: 'getDashboardStats' });
  if (result.status === 'success') {
    const s = result.data;
    setText('statTotal',    s.total);
    setText('statBaru',     s.baru);
    setText('statDiproses', s.diproses);
    setText('statDiterima', s.diterima);
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ============================================================
// LOAD DAFTAR PELAMAR
// ============================================================
async function loadPelamar() {
  renderLoading();
  interviewDataCache = {};   // reset cache saat list di-refresh
  const result = await apiGet({ action: 'getPelamar' });
  if (result.status === 'success') {
    allPelamar = result.data;
    renderPelamar();
  } else {
    renderError(result.message);
  }
}

// ============================================================
// RENDER PELAMAR
// ============================================================
function renderPelamar() {
  const list = document.getElementById('pelamarList');
  let data   = [...allPelamar];

  if (currentFilter !== 'Semua') {
    data = data.filter(p => p.statusLamaran === currentFilter);
  }

  if (currentSearch) {
    const kw = currentSearch.toLowerCase();
    data = data.filter(p =>
      p.namaPanggilan.toLowerCase().includes(kw) ||
      p.id.toLowerCase().includes(kw)
    );
  }

  if (data.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Tidak Ada Data</div>
        <div class="empty-subtitle">
          ${currentFilter !== 'Semua'
            ? `Belum ada pelamar dengan status "${currentFilter}"`
            : 'Belum ada pelamar yang mendaftar'}
        </div>
      </div>`;
    return;
  }

  list.innerHTML = data.map(p => `
    <div class="pelamar-card ${p.statusLamaran.toLowerCase()}"
         onclick="openDetail('${p.id}')">
      <div class="pelamar-card-top">
        <div>
          <div class="pelamar-id">${p.id}</div>
          <div class="pelamar-name">${p.namaPanggilan}</div>
        </div>
        ${getBadgeHtml(p.statusLamaran)}
      </div>
      <div class="pelamar-meta">
        🎂 ${p.usia} th &nbsp;•&nbsp;
        🎓 ${p.pendidikan} &nbsp;•&nbsp;
        💍 ${p.statusPernikahan}
      </div>
      <div class="pelamar-meta">📅 ${p.timestamp}</div>
    </div>
  `).join('');
}

function renderLoading() {
  const list = document.getElementById('pelamarList');
  if (list) list.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p style="color:var(--gray-400);font-size:13px;">
        Memuat data pelamar...
      </p>
    </div>`;
}

function renderError(msg) {
  const list = document.getElementById('pelamarList');
  if (list) list.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">❌</div>
      <div class="empty-title">Gagal Memuat Data</div>
      <div class="empty-subtitle">${msg}</div>
    </div>`;
}

// ============================================================
// FILTER & SEARCH
// ============================================================
function filterPelamar(status, el) {
  currentFilter = status;
  document.querySelectorAll('.filter-tab')
    .forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderPelamar();
}

function handleSearch(val) {
  currentSearch = val;
  renderPelamar();
}

// ── State untuk lazy load tab interview ───────────────────
let currentModalId     = null;
let interviewDataCache = {};   // { [id]: data | null }
let interviewTabLoaded = false;

// ============================================================
// OPEN DETAIL MODAL
// ============================================================
async function openDetail(id) {
  const modal = document.getElementById('modalDetail');
  const body  = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');

  // ── Reset state ────────────────────────────────────────
  currentModalId     = id;
  interviewTabLoaded = false;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // ── Data ringkasan dari memori (untuk header modal) ────
  const ringkasan = allPelamar.find(x => x.id === id);
  if (ringkasan) {
    title.textContent = ringkasan.namaPanggilan;
  }

  // ── Tampilkan skeleton langsung — modal tidak blank ────
  body.innerHTML = `
    <div class="pelamar-detail-header" id="detailHeader">
      ${ringkasan ? `
        <div class="pelamar-detail-id">${ringkasan.id}</div>
        <div class="pelamar-detail-name">${ringkasan.namaPanggilan}</div>
        ${getBadgeHtml(ringkasan.statusLamaran)}
        <div class="pelamar-detail-date">📅 Daftar: ${ringkasan.timestamp}</div>
      ` : ''}
    </div>

    <div class="tab-header">
      <button class="tab-btn active" onclick="switchTab('tabData',this)">
        📋 Data Diri
      </button>
      <button class="tab-btn" onclick="switchTab('tabInterview',this);loadInterviewTab('${id}')">
        📝 Hasil Interview
      </button>
    </div>

    <!-- TAB DATA DIRI: skeleton dulu -->
    <div id="tabData" class="tab-content active fade-in">
      <div class="loading-state">
        <div class="spinner"></div>
        <p style="color:var(--gray-400);font-size:13px;">Memuat data lengkap...</p>
      </div>
    </div>

    <!-- TAB HASIL INTERVIEW: lazy load -->
    <div id="tabInterview" class="tab-content fade-in">
      <div class="loading-state">
        <div class="spinner"></div>
        <p style="color:var(--gray-400);font-size:13px;">Memuat data interview...</p>
      </div>
    </div>
  `;

  // ── Fetch detail lengkap di background ────────────────
  const resPelamar = await apiGet({ action: 'getDetailPelamar', id });

  // Batalkan render jika modal sudah diganti (user klik pelamar lain)
  if (currentModalId !== id) return;

  if (resPelamar.status !== 'success') {
    document.getElementById('tabData').innerHTML = `
      <p style="color:var(--danger);padding:20px;text-align:center;">
        ❌ Gagal memuat data. Coba tutup dan buka lagi.
      </p>`;
    return;
  }

  const p = resPelamar.data;

  // ── Render tab Data Diri ───────────────────────────────
  document.getElementById('tabData').innerHTML = `

    <div class="info-section">
      <div class="info-section-title">Data Pribadi</div>
      ${infoRow('Usia', p.usia + ' tahun')}
      <div class="info-row">
        <span class="info-label">No. WhatsApp</span>
        <span class="info-value">
          <a href="https://wa.me/62${(p.noWhatsapp || '').replace(/^0/, '')}"
             target="_blank"
             style="color:#25D366;font-weight:600;">
            📱 ${p.noWhatsapp || '-'}
          </a>
        </span>
      </div>
      ${infoRow('Pendidikan',   p.pendidikan)}
      ${infoRow('Nama Sekolah', p.namaSekolah)}
      ${infoRow('Status Nikah', p.statusPernikahan)}
      ${infoRow('Alamat',       p.alamat)}
      ${infoRow('Luar Kota',
        p.bersediaLuarKota === 'Ya'
          ? '✅ Bersedia'
          : '❌ Tidak Bersedia')}
    </div>

    <div class="info-section">
      <div class="info-section-title">Pengalaman Kerja</div>
      <div style="font-size:13px;line-height:1.8;color:var(--dark);">
        ${p.pengalamanKerja || '-'}
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">📸 Foto Pelamar</div>
      <div class="foto-grid">
        <div>
          <div class="foto-label">🪪 Foto KTP</div>
          ${p.linkKTP
            ? `<a href="${p.linkKTP}" target="_blank" class="foto-link ktp">
                 🪪 Lihat KTP
               </a>`
            : `<div class="foto-kosong">Belum diupload</div>`}
        </div>
        <div>
          <div class="foto-label">🤳 Foto Selfie</div>
          ${p.linkSelfie
            ? `<a href="${p.linkSelfie}" target="_blank" class="foto-link selfie">
                 🤳 Lihat Selfie
               </a>`
            : `<div class="foto-kosong">Belum diupload</div>`}
        </div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">⚙️ Update Status</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        <button class="btn btn-sm btn-info"
                onclick="updateStatus('${p.id}','Diproses')">
          🔄 Diproses
        </button>
        <button class="btn btn-sm btn-success"
                onclick="updateStatus('${p.id}','Diterima')">
          ✅ Diterima
        </button>
        <button class="btn btn-sm btn-danger"
                onclick="updateStatus('${p.id}','Ditolak')">
          ❌ Ditolak
        </button>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Catatan Admin</label>
        <textarea class="form-control" id="adminCatatan"
                  rows="3"
                  placeholder="Tambahkan catatan..."
                  >${p.catatanAdmin || ''}</textarea>
      </div>
      <button class="btn btn-yellow btn-sm"
              onclick="simpanCatatan('${p.id}')"
              style="width:auto;">
        💾 Simpan Catatan
      </button>
    </div>

    <div style="margin-top:24px;padding-top:16px;
                border-top:2px solid var(--gray-200);">
      <button class="btn btn-primary" id="btnMulaiInterview"
              onclick="bukaInterview('${p.id}','${p.namaPanggilan}','${p.statusPernikahan}')">
        📝 Mulai Interview
      </button>
    </div>
  `;
}

// ============================================================
// RENDER DETAIL INTERVIEW
// ============================================================
function renderInterviewDetail(iv, p) {
  if (!iv) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">Belum Ada Data Interview</div>
        <div class="empty-subtitle">
          Klik tombol "Mulai Interview" di tab Data Diri
        </div>
        <button class="btn btn-primary"
                style="margin-top:20px;max-width:280px;"
                onclick="bukaInterview('${p.id}','${p.namaPanggilan}','${p.statusPernikahan}')">
          📝 Mulai Interview
        </button>
      </div>`;
  }

  const isLajangJanda = ['Lajang','Janda'].includes(p.statusPernikahan);
  const isMenikah     = p.statusPernikahan === 'Menikah';

  return `
    <div class="fade-in">

      <div class="info-section">
        <div class="info-section-title">🏪 Info Interview</div>
        ${infoRow('Outlet',      iv.outlet)}
        ${infoRow('Tanggal',     iv.tanggalInterview)}
        ${infoRow('Interviewer', iv.interviewer)}
      </div>

      ${isLajangJanda ? `
      <div class="info-section">
        <div class="info-section-title">
          👨‍👩‍👧 Data Keluarga (${p.statusPernikahan})
        </div>
        ${infoRow('Pekerjaan Ayah',     iv.pekerjaanAyah)}
        ${infoRow('Pekerjaan Ibu',      iv.pekerjaanIbu)}
        ${infoRow('Anak ke-',           iv.anakKe)}
        ${infoRow('Ijin Ortu',          iv.ijinOrtu)}
        ${infoRow('Rencana Kuliah/TKI', iv.rencanaKuliah)}
        ${infoRow('Rencana Nikah',      iv.rencaNikah)}
      </div>` : ''}

      ${isMenikah ? `
      <div class="info-section">
        <div class="info-section-title">💍 Data Keluarga (Menikah)</div>
        ${infoRow('Pekerjaan Suami',   iv.pekerjaanSuami)}
        ${infoRow('Jumlah Anak',       iv.jumlahAnak)}
        ${infoRow('Usia Anak Termuda', iv.usiaAnakTermuda)}
        ${infoRow('Rencana Kehamilan', iv.rencanaKehamilan)}
        ${infoRow('Ijin Suami',        iv.ijinSuami)}
      </div>` : ''}

      <div class="info-section">
        <div class="info-section-title">📊 Penilaian</div>
        ${infoRow('Kemampuan Berhitung', iv.kemampuanBerhitung)}
        ${infoRow('PMS',                 iv.pms)}
      </div>

      <div class="info-section">
        <div class="info-section-title">💼 Riwayat Pekerjaan</div>
        ${[1,2,3].map(i => {
          const t = iv['pengalamanKerja' + i];
          const l = iv['lamaKerja' + i];
          return t ? infoRow(i + '. ' + t, l || '-') : '';
        }).join('')}
        ${!iv.pengalamanKerja1
          ? '<p style="font-size:13px;color:var(--gray-400);">-</p>'
          : ''}
      </div>

      <div class="info-section">
        <div class="info-section-title">🏥 Kesehatan & Lainnya</div>
        ${infoRow('Keluhan Sakit', iv.keluhanSakit)}
        ${infoRow('Opname RS',     iv.opnameRS)}
        ${infoRow('Plecit',        iv.plecit)}
        ${infoRow('Pinjol',        iv.pinjol)}
        ${infoRow('Melamar Tempat Lain',
          iv.melamarTempatLain === 'Ya'
            ? `Ya (${iv.namaTempatLain || '-'})`
            : iv.melamarTempatLain)}
        ${infoRow('Ormas Agama',
          iv.ormasAgama === 'Ya'
            ? `Ya (${iv.namaOrmas || '-'})`
            : iv.ormasAgama)}
        ${infoRow('Kajian Rutin', iv.kajianRutin)}
      </div>

      <div class="info-section">
        <div class="info-section-title">📝 Catatan Interviewer</div>
        <div class="catatan-box">
          ${iv.catatanInterview || '-'}
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top:8px;"
              onclick="bukaInterview('${p.id}','${p.namaPanggilan}','${p.statusPernikahan}')">
        ✏️ Edit Hasil Interview
      </button>

    </div>`;
}

// Helper row
function infoRow(label, value) {
  return `
    <div class="info-row">
      <span class="info-label">${label}</span>
      <span class="info-value">${value || '-'}</span>
    </div>`;
}

// ============================================================
// SWITCH TAB
// ============================================================
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content')
    .forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn')
    .forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  btn.classList.add('active');
}

// ============================================================
// LAZY LOAD TAB INTERVIEW — fetch hanya saat tab diklik
// ============================================================
async function loadInterviewTab(id) {
  // Sudah pernah di-fetch untuk pelamar ini, skip
  if (interviewTabLoaded && currentModalId === id) return;

  const tabEl = document.getElementById('tabInterview');
  if (!tabEl) return;

  // Cek cache dulu sebelum fetch ke server
  if (interviewDataCache[id] !== undefined) {
    const p = allPelamar.find(x => x.id === id);
    tabEl.innerHTML = renderInterviewDetail(interviewDataCache[id], p);
    updateBtnInterview(interviewDataCache[id], p);
    interviewTabLoaded = true;
    return;
  }

  // Fetch ke GAS — hanya terjadi sekali per pelamar per sesi
  tabEl.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p style="color:var(--gray-400);font-size:13px;">Memuat data interview...</p>
    </div>`;

  const res = await apiGet({ action: 'getInterview', idPelamar: id });
  const iv  = res.status === 'success' ? res.data : null;

  // Simpan ke cache
  interviewDataCache[id] = iv;

  // Render hanya kalau modal ini masih terbuka untuk pelamar yang sama
  if (currentModalId !== id) return;

  const p = allPelamar.find(x => x.id === id);
  tabEl.innerHTML = renderInterviewDetail(iv, p);
  updateBtnInterview(iv, p);
  interviewTabLoaded = true;
}

// Update label tombol Mulai / Edit Interview di tab Data Diri
function updateBtnInterview(iv, p) {
  const btn = document.getElementById('btnMulaiInterview');
  if (!btn) return;
  btn.textContent = iv ? '✏️ Edit Hasil Interview' : '📝 Mulai Interview';
}

// ============================================================
// UPDATE STATUS
// ============================================================
async function updateStatus(id, status) {
  const catatan = document.getElementById('adminCatatan')?.value || '';
  const result  = await apiPost('updateStatusPelamar', { id, status, catatan });

  if (result.status === 'success') {
    showToast(`Status diubah ke: ${status}`, 'success');
    loadStats();
    loadPelamar();
    closeModal();
  } else {
    showToast('Gagal: ' + result.message, 'error');
  }
}

// ============================================================
// SIMPAN CATATAN
// ============================================================
async function simpanCatatan(id) {
  const catatan = document.getElementById('adminCatatan')?.value || '';
  const pelamar = allPelamar.find(p => p.id === id);
  const status  = pelamar?.statusLamaran || 'Baru';
  const result  = await apiPost('updateStatusPelamar', { id, status, catatan });

  if (result.status === 'success') {
    showToast('Catatan berhasil disimpan!', 'success');
  } else {
    showToast('Gagal: ' + result.message, 'error');
  }
}

// ============================================================
// BUKA INTERVIEW
// ============================================================
function bukaInterview(id, nama, statusNikah) {
  sessionStorage.setItem('interviewId',          id);
  sessionStorage.setItem('interviewNama',        nama);
  sessionStorage.setItem('interviewStatusNikah', statusNikah);
  window.location.href = `interview.html?id=${id}`;
}

// ============================================================
// CLOSE MODAL
// ============================================================
function closeModal() {
  document.getElementById('modalDetail')?.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalDetail')
    ?.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
});
