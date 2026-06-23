/* ============================================================
   interview.js — Logic Form Interview HR
   ============================================================ */

let pelamarData = null;
let isEditMode  = false;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // ── 1. Cek session admin dulu ────────────────────────────
  const isAuth = sessionStorage.getItem('gociko_admin_auth');
  if (isAuth !== 'true') {
    redirectWithMessage('Sesi admin tidak ditemukan. Silakan login terlebih dahulu.', 'admin.html');
    return;
  }

  // ── 2. Ambil ID dari URL atau sessionStorage ─────────────
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || sessionStorage.getItem('interviewId');

  if (!id) {
    redirectWithMessage('Halaman ini hanya bisa dibuka melalui panel admin.', 'admin.html');
    return;
  }

  // ── 3. Set tanggal default hari ini ─────────────────────
  const todayEl = document.getElementById('tanggalInterview');
  if (todayEl) todayEl.value = new Date().toISOString().split('T')[0];

  // ── 4. Load data pelamar ─────────────────────────────────
  await loadData(id);

  // ── 5. Setup form submit ─────────────────────────────────
  document.getElementById('interviewForm')
    ?.addEventListener('submit', handleSubmitInterview);
});

// ============================================================
// REDIRECT DENGAN PESAN — Tampilkan pesan dulu, baru redirect
// ============================================================
function redirectWithMessage(pesan, tujuan) {
  // Render halaman pengarah sederhana agar pesan terbaca
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: 'Poppins', sans-serif;
      background: var(--gray-50, #f9f9f9);
      text-align: center;
    ">
      <div style="
        background: #fff;
        border-radius: 16px;
        padding: 32px 28px;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      ">
        <div style="font-size: 40px; margin-bottom: 16px;">🔒</div>
        <div style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">
          Akses Tidak Valid
        </div>
        <div style="font-size: 13px; color: #888; margin-bottom: 24px; line-height: 1.6;">
          ${pesan}
        </div>
        <div style="font-size: 12px; color: #bbb;">
          Mengalihkan ke halaman login...
        </div>
        <div style="
          margin-top: 16px;
          height: 4px;
          background: #f0f0f0;
          border-radius: 2px;
          overflow: hidden;
        ">
          <div id="redirectBar" style="
            height: 100%;
            width: 0%;
            background: #4f46e5;
            border-radius: 2px;
            transition: width 3s linear;
          "></div>
        </div>
      </div>
    </div>
  `;

  // Animasi progress bar
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = document.getElementById('redirectBar');
      if (bar) bar.style.width = '100%';
    });
  });

  setTimeout(() => { window.location.href = tujuan; }, 3000);
}

// ============================================================
// LOAD DATA PELAMAR & INTERVIEW
// ============================================================
async function loadData(id) {
  const [resPelamar, resInterview] = await Promise.all([
    apiGet({ action: 'getDetailPelamar', id }),
    apiGet({ action: 'getInterview', idPelamar: id })
  ]);

  if (resPelamar.status !== 'success') {
    showToast('Gagal memuat data pelamar!', 'error');
    return;
  }

  pelamarData = resPelamar.data;

  // Isi header info
  setText('interviewNama', pelamarData.namaPanggilan);
  setText('interviewId',   `${pelamarData.id} • ${pelamarData.statusPernikahan}`);

  const badgeEl = document.getElementById('interviewBadge');
  if (badgeEl) badgeEl.innerHTML = getBadgeHtml(pelamarData.statusLamaran);

  // Tampilkan section sesuai status pernikahan
  showSections(pelamarData.statusPernikahan);

  // Edit mode jika sudah ada data interview
  if (resInterview.status === 'success' && resInterview.data) {
    isEditMode = true;
    fillForm(resInterview.data);
    const btn = document.getElementById('submitInterviewBtn');
    if (btn) btn.textContent = '✏️ Update Hasil Interview';
    showToast('Mode edit — data interview sebelumnya dimuat', 'warning');
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ============================================================
// TAMPILKAN SECTION SESUAI STATUS NIKAH
// ============================================================
function showSections(status) {
  const lj = document.getElementById('sectionLajangJanda');
  const mk = document.getElementById('sectionMenikah');

  if (status === 'Lajang' || status === 'Janda') {
    lj?.classList.remove('hidden');
    mk?.classList.add('hidden');
  } else if (status === 'Menikah') {
    mk?.classList.remove('hidden');
    lj?.classList.add('hidden');
  }
}

// ============================================================
// ISI FORM DENGAN DATA EXISTING
// ============================================================
function fillForm(iv) {
  setValue('outlet',           iv.outlet);
  setValue('tanggalInterview', iv.tanggalInterview);

  // Lajang / Janda
  setValue('pekerjaanAyah',  iv.pekerjaanAyah);
  setValue('pekerjaanIbu',   iv.pekerjaanIbu);
  setValue('anakKe',         iv.anakKe);
  setRadioValue('ijinOrtu',       iv.ijinOrtu);
  setRadioValue('rencanaKuliah',  iv.rencanaKuliah);
  setValue('rencaNikah',     iv.rencaNikah);

  // Menikah
  setValue('pekerjaanSuami',   iv.pekerjaanSuami);
  setValue('jumlahAnak',       iv.jumlahAnak);
  setValue('usiaAnakTermuda',  iv.usiaAnakTermuda);
  setRadioValue('rencanaKehamilan', iv.rencanaKehamilan);
  setRadioValue('ijinSuami',        iv.ijinSuami);

  // Umum
  setRadioValue('kemampuanBerhitung', iv.kemampuanBerhitung);
  setRadioValue('pms',                iv.pms);

  // Pengalaman
  setValue('pengalamanKerja1', iv.pengalamanKerja1);
  setValue('lamaKerja1',       iv.lamaKerja1);
  setValue('pengalamanKerja2', iv.pengalamanKerja2);
  setValue('lamaKerja2',       iv.lamaKerja2);
  setValue('pengalamanKerja3', iv.pengalamanKerja3);
  setValue('lamaKerja3',       iv.lamaKerja3);

  // Kesehatan
  setValue('keluhanSakit', iv.keluhanSakit);
  setRadioValue('opnameRS', iv.opnameRS);
  setRadioValue('plecit',   iv.plecit);
  setRadioValue('pinjol',   iv.pinjol);

  // Melamar tempat lain
  setRadioValue('melamarTempatLain', iv.melamarTempatLain);
  if (iv.melamarTempatLain === 'Ya') {
    toggleField('fieldTempatLain', true);
    setValue('namaTempatLain', iv.namaTempatLain);
  }

  // Ormas
  setRadioValue('ormasAgama', iv.ormasAgama);
  if (iv.ormasAgama === 'Ya') {
    toggleField('fieldOrmas', true);
    setRadioValue('namaOrmas', iv.namaOrmas);
  }

  setRadioValue('kajianRutin', iv.kajianRutin);

  // Catatan
  setValue('catatanInterview', iv.catatanInterview);
  setValue('interviewer',      iv.interviewer);
}

// ============================================================
// HANDLE SUBMIT INTERVIEW
// ============================================================
async function handleSubmitInterview(e) {
  e.preventDefault();

  if (!pelamarData) {
    showToast('Data pelamar tidak ditemukan!', 'error');
    return;
  }

  const outlet           = document.getElementById('outlet')?.value.trim();
  const tanggalInterview = document.getElementById('tanggalInterview')?.value;
  const interviewer      = document.getElementById('interviewer')?.value.trim();

  // Validasi wajib
  if (!outlet) {
    showToast('Nama outlet wajib diisi!', 'error'); return;
  }
  if (!tanggalInterview) {
    showToast('Tanggal interview wajib diisi!', 'error'); return;
  }
  if (!interviewer) {
    showToast('Nama interviewer wajib diisi!', 'error'); return;
  }

  // Loading
  const btn = document.getElementById('submitInterviewBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  const data = {
    idPelamar        : pelamarData.id,
    outlet,
    tanggalInterview,
    // Lajang / Janda
    pekerjaanAyah    : gv('pekerjaanAyah'),
    pekerjaanIbu     : gv('pekerjaanIbu'),
    anakKe           : gv('anakKe'),
    ijinOrtu         : getRadioValue('ijinOrtu'),
    rencanaKuliah    : getRadioValue('rencanaKuliah'),
    rencaNikah       : gv('rencaNikah'),
    // Menikah
    pekerjaanSuami   : gv('pekerjaanSuami'),
    jumlahAnak       : gv('jumlahAnak'),
    usiaAnakTermuda  : gv('usiaAnakTermuda'),
    rencanaKehamilan : getRadioValue('rencanaKehamilan'),
    ijinSuami        : getRadioValue('ijinSuami'),
    // Umum
    kemampuanBerhitung: getRadioValue('kemampuanBerhitung'),
    pms              : getRadioValue('pms'),
    // Pengalaman
    pengalamanKerja1 : gv('pengalamanKerja1'),
    lamaKerja1       : gv('lamaKerja1'),
    pengalamanKerja2 : gv('pengalamanKerja2'),
    lamaKerja2       : gv('lamaKerja2'),
    pengalamanKerja3 : gv('pengalamanKerja3'),
    lamaKerja3       : gv('lamaKerja3'),
    // Kesehatan
    keluhanSakit     : gv('keluhanSakit'),
    opnameRS         : getRadioValue('opnameRS'),
    plecit           : getRadioValue('plecit'),
    pinjol           : getRadioValue('pinjol'),
    // Lainnya
    melamarTempatLain: getRadioValue('melamarTempatLain'),
    namaTempatLain   : gv('namaTempatLain'),
    ormasAgama       : getRadioValue('ormasAgama'),
    namaOrmas        : getRadioValue('namaOrmas'),
    kajianRutin      : getRadioValue('kajianRutin'),
    // Catatan
    catatanInterview : gv('catatanInterview'),
    interviewer
  };

  const action = isEditMode ? 'updateInterview' : 'submitInterview';
  const result = await apiPost(action, data);

  btn.classList.remove('btn-loading');
  btn.disabled = false;

  if (result.status === 'success') {
    showToast(
      isEditMode
        ? 'Data interview berhasil diupdate! ✅'
        : 'Data interview berhasil disimpan! ✅',
      'success'
    );
    setTimeout(() => { window.location.href = 'admin.html'; }, 1600);
  } else {
    showToast('Gagal: ' + result.message, 'error');
  }
}

// Helper: get value by id
function gv(id) {
  return document.getElementById(id)?.value || '';
}
