/* ============================================================
   admin.js — Logic Dashboard Admin
   ============================================================ */

let allPelamar     = [];
let currentFilter  = 'Semua';
let currentSearch  = '';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadPelamar();
});

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
    setText('statDitolak',  s.ditolak);
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
  const result = await apiGet({ action: 'getPelamar' });
  if (result.status === 'success') {
    allPelamar = result.data;
    renderPelamar();
  } else {
    renderError(result.message);
  }
}

// ============================================================
// RENDER PELAMAR LIST
// ============================================================
function renderPelamar() {
  const list = document.getElementById('pelamarList');

  let data = [...allPelamar];

  // Filter status
  if (currentFilter !== 'Semua') {
    data = data.filter(p => p.statusLamaran === currentFilter);
  }

  // Filter search
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
  document.getElementById('pelamarList').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p style="color:var(--gray-400);font-size:13px;">Memuat data pelamar...</p>
    </div>`;
}

function renderError(msg) {
  document.getElementById('pelamarList').innerHTML = `
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
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderPelamar();
}

function handleSearch(val) {
  currentSearch = val;
  renderPelamar();
}

// ============================================================
// OPEN DETAIL MODAL
// ============================================================
async function openDetail(id) {
  const modal = document.getElementById('modalDetail');
  const body  = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  body.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p style="color:var(--gray-400);font-size:13px;">Memuat detail...</p>
    </div>`;

  // Fetch data paralel
  const [resPelamar, resInterview] = await Promise.all([
    apiGet({ action: 'getDetailPelamar', id }),
    apiGet({ action: 'getInterview', idPelamar: id })
  ]);

  if (resPelamar.status !== 'success') {
    body.innerHTML = `<p style="color:var(--danger);padding:20px;">Gagal memuat data pelamar.</p>`;
    return;
  }

  const p  = resPelamar.data;
  const iv = resInterview.data;

  title.textContent = p.namaPanggilan;

  body.innerHTML = `

    <!-- Header Pelamar -->
    <div class="pelamar-detail-header">
      <div class="pelamar-detail-id">${p.id}</div>
      <div class="pelamar-detail-name">${p.namaPanggilan}</div>
      ${getBadgeHtml(p.statusLamaran)}
      <div class="pelamar-detail-date">📅 Daftar: ${p.timestamp}</div>
    </div>

    <!-- Tabs -->
    <div class="tab-header">
      <button class="tab-btn active" onclick="switchTab('tabData', this)">
        📋 Data Diri
      </button>
      <button class="tab-btn" onclick="switchTab('tabInterview', this)">
        📝 Hasil Interview
      </button>
    </div>

    <!-- TAB DATA DIRI -->
    <div id="tabData" class="tab-content active fade-in">

      <div class="info-section">
        <div class="info-section-title">Data Pribadi</div>
        <div class="info-row">
          <span class="info-label">Usia</span>
          <span class="info-value">${p.usia} tahun</span>
        </div>
        <div class="info-row">
          <span class="info-label">No. WhatsApp</span>
          <span class="info-value">
            <a href="https://wa.me/62${p.noWhatsapp.replace(/^0/, '')}"
               target="_blank"
               style="color:#25D366;font-weight:600;">
              📱 ${p.noWhatsapp}
            </a>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Pendidikan</span>
          <span class="info-value">${p.pendidikan}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Sekolah</span>
          <span class="info-value">${p.namaSekolah}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status Nikah</span>
          <span class="info-value">${p.statusPernikahan}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Alamat</span>
          <span class="info-value">${p.alamat}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Luar Kota</span>
          <span class="info-value">
            ${p.bersediaLuarKota === 'Ya' ? '✅ Bersedia' : '❌ Tidak Bersedia'}
          </span>
        </div>
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
              ? `<a href="${p.linkKTP}" target="_blank" class="foto-link ktp">🪪 Lihat KTP</a>`
              : `<div class="foto-kosong">Belum diupload</div>`}
          </div>
          <div>
            <div class="foto-label">🤳 Foto Selfie</div>
            ${p.linkSelfie
              ? `<a href="${p.linkSelfie}" target="_blank" class="foto-link selfie">🤳 Lihat Selfie</a>`
              : `<div class="foto-kosong">Belum diupload</div>`}
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-section-title">⚙️ Update Status</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          <button class="btn btn-sm btn-info"
                  onclick="updateStatus('${p.id}', 'Diproses')">
            🔄 Diproses
          </button>
          <button class="btn btn-sm btn-success"
                  onclick="updateStatus('${p.id}', 'Diterima')">
            ✅ Diterima
          </button>
          <button class="btn btn-sm btn-danger"
                  onclick="updateStatus('${p.id}', 'Ditolak')">
            ❌ Ditolak
          </button>
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">Catatan Admin</label>
          <textarea class="form-control" id="adminCatatan"
                    rows="3"
                    placeholder="Tambahkan catatan...">${p.catatanAdmin || ''}</textarea>
        </div>
        <button class="btn btn-yellow btn-sm"
                onclick="simpanCatatan('${p.id}')"
                style="width:auto;">
          💾 Simpan Catatan
        </button>
      </div>

      <div style="margin-top:24px;padding-top:16px;border-top:2px solid var(--gray-200);">
        <button class="btn btn-primary"
                onclick="bukaInterview('${p.id}','${p.namaPanggilan}','${p.statusPernikahan}')">
          📝 ${iv ? 'Edit Hasil Interview' : 'Mulai Interview'}
        </button>
      </div>
    </div>

    <!-- TAB HASIL INTERVIEW -->
    <div id="tabInterview" class="tab-content fade-in">
      ${renderInterviewDetail(iv, p)}
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

  const isLajangJanda = ['Lajang', 'Janda'].includes(p.statusPernikahan);
  const isMenikah     = p.statusPernikahan === 'Menikah';

  return `
    <div class="fade-in">

      <div class="info-section">
        <div class="info-section-title">🏪 Info Interview</div>
        ${infoRow('Outlet',       iv.outlet)}
        ${infoRow('Tanggal',      iv.tanggalInterview)}
        ${infoRow('Interviewer',  iv.interviewer)}
      </div>

      ${isLajangJanda ? `
      <div class="info-section">
        <div class="info-section-title">👨‍👩‍👧 Data Keluarga (${p.statusPernikahan})</div>
        ${infoRow('Pekerjaan Ayah',       iv.pekerjaanAyah)}
        ${infoRow('Pekerjaan Ibu',        iv.pekerjaanIbu)}
        ${infoRow('Anak ke-',             iv.anakKe)}
        ${infoRow('Ijin Ortu',            iv.ijinOrtu)}
        ${infoRow('Rencana Kuliah/TKI',   iv.rencanaKuliah)}
        ${infoRow('Rencana Nikah',        iv.rencaNikah)}
      </div>` : ''}

      ${isMenikah ? `
      <div class="info-section">
        <div class="info-section-title">💍 Data Keluarga (Menikah)</div>
        ${infoRow('Pekerjaan Suami',    iv.pekerjaanSuami)}
        ${infoRow('Jumlah Anak',        iv.jumlahAnak)}
        ${infoRow('Usia Anak Termuda',  iv.usiaAnakTermuda)}
        ${infoRow('Rencana Kehamilan',  iv.rencanaKehamilan)}
        ${infoRow('Ijin Suami',         iv.ijinSuami)}
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
          if (!t) return '';
          return infoRow(i + '. ' + t, l || '-');
        }).join('')}
        ${!iv.pengalamanKerja1
          ? '<p style="font-size:13px;color:var(--gray-400);">-</p>'
          : ''}
      </div>

      <div class="info-section">
        <div class="info-section-title">🏥 Kesehatan & Lainnya</div>
        ${infoRow('Keluhan Sakit',      iv.keluhanSakit)}
        ${infoRow('Opname RS',          iv.opnameRS)}
        ${infoRow('Plecit',             iv.plecit)}
        ${infoRow('Pinjol',             iv.pinjol)}
        ${infoRow('Melamar Tempat Lain',
          iv.melamarTempatLain === 'Ya'
            ? 'Ya (' + (iv.namaTempatLain || '-') + ')'
            : iv.melamarTempatLain)}
        ${infoRow('Ormas Agama',
          iv.ormasAgama === 'Ya'
            ? 'Ya (' + (iv.namaOrmas || '-') + ')'
            : iv.ormasAgama)}
        ${infoRow('Kajian Rutin',       iv.kajianRutin)}
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
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  btn.classList.add('active');
}

// ============================================================
// UPDATE STATUS
// ============================================================
async function updateStatus(id, status) {
  const catatan = document.getElementById('adminCatatan')?.value || '';
  const result  = await apiPost('updateStatusPelamar', { id, status, catatan });

  if (result.status === 'success') {
    showToast(`Status berhasil diubah ke: ${status}`, 'success');
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

  const result = await apiPost('updateStatusPelamar', { id, status, catatan });

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
  sessionStorage.setItem('interviewId',         id);
  sessionStorage.setItem('interviewNama',       nama);
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

// Tutup modal klik overlay
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalDetail')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
});
