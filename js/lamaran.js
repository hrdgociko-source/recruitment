/* ============================================================
   lamaran.js — Logic Form Lamaran Pelamar
   ============================================================ */

let currentId        = null;
let selectedFileKTP    = null;
let selectedFileSelfie = null;
let nomorWA          = '6285774455679';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Ambil nomor WA dari konfigurasi
  try {
    const config = await apiGet({ action: 'getConfig' });
    if (config.status === 'success' && config.data.NOMOR_WA_REKRUTMEN) {
      nomorWA = config.data.NOMOR_WA_REKRUTMEN;
    }
  } catch (e) {
    console.log('Config tidak terbaca, pakai default WA.');
  }

  // Form submit
  const form = document.getElementById('lamaranForm');
  if (form) form.addEventListener('submit', handleSubmitLamaran);
});

// ============================================================
// SCROLL KE FORM
// ============================================================
function scrollToForm() {
  const el = document.getElementById('formSection');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// FILE HANDLING — KTP & SELFIE
// ============================================================
function handleFileSelect(event, type = 'ktp') {
  const file = event.target.files[0];
  if (file) validateAndPreview(file, type);
}

function handleDragOver(event, type = 'ktp') {
  event.preventDefault();
  const id = type === 'selfie' ? 'uploadAreaSelfie' : 'uploadAreaKTP';
  document.getElementById(id)?.classList.add('drag-over');
}

function handleDrop(event, type = 'ktp') {
  event.preventDefault();
  const id = type === 'selfie' ? 'uploadAreaSelfie' : 'uploadAreaKTP';
  document.getElementById(id)?.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) validateAndPreview(file, type);
}

function validateAndPreview(file, type) {
  // Validasi tipe file
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showToast('Format file harus JPG atau PNG!', 'error');
    return;
  }
  // Validasi ukuran (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('Ukuran file maksimal 2MB!', 'error');
    return;
  }

  const isSelfie  = type === 'selfie';
  const areaId    = isSelfie ? 'uploadAreaSelfie'   : 'uploadAreaKTP';
  const previewId = isSelfie ? 'uploadPreviewSelfie' : 'uploadPreviewKTP';
  const imgId     = isSelfie ? 'previewImgSelfie'    : 'previewImgKTP';
  const icon      = isSelfie ? '🤳' : '🪪';
  const label     = isSelfie ? 'Foto Selfie' : 'Foto KTP';

  if (isSelfie) selectedFileSelfie = file;
  else          selectedFileKTP    = file;

  // Preview gambar
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgEl = document.getElementById(imgId);
    if (imgEl) imgEl.src = e.target.result;

    const previewEl = document.getElementById(previewId);
    if (previewEl) previewEl.style.display = 'block';

    const areaEl = document.getElementById(areaId);
    if (areaEl) {
      areaEl.innerHTML = `
        <div class="upload-icon">✅</div>
        <div class="upload-text" style="font-weight:700;">${icon} ${file.name}</div>
        <div class="upload-hint">Klik untuk ganti ${label}</div>
      `;
    }
  };
  reader.readAsDataURL(file);
}

// ============================================================
// SUBMIT LAMARAN
// ============================================================
async function handleSubmitLamaran(e) {
  e.preventDefault();

  // Ambil nilai form
  const namaPanggilan    = document.getElementById('namaPanggilan').value.trim();
  const usia             = parseInt(document.getElementById('usia').value);
  const noWhatsapp       = document.getElementById('noWhatsapp').value.trim();
  const pendidikan       = document.getElementById('pendidikan').value;
  const namaSekolah      = document.getElementById('namaSekolah').value.trim();
  const statusPernikahan = getRadioValue('statusPernikahan');
  const alamat           = document.getElementById('alamat').value.trim();
  const pengalamanKerja  = document.getElementById('pengalamanKerja').value.trim();
  const bersediaLuarKota = getRadioValue('bersediaLuarKota');

  // ── Validasi ──────────────────────────────────────────────
  if (!namaPanggilan) {
    showToast('Nama panggilan wajib diisi!', 'error'); return;
  }
  if (!usia || usia < 20 || usia > 30) {
    showToast('Usia harus antara 20 – 30 tahun!', 'warning'); return;
  }
  if (!noWhatsapp) {
    showToast('No. WhatsApp wajib diisi!', 'error'); return;
  }
  if (!pendidikan) {
    showToast('Pendidikan terakhir wajib dipilih!', 'error'); return;
  }
  if (!namaSekolah) {
    showToast('Nama sekolah wajib diisi!', 'error'); return;
  }
  if (!statusPernikahan) {
    showToast('Status pernikahan wajib dipilih!', 'error'); return;
  }
  if (!alamat) {
    showToast('Alamat domisili wajib diisi!', 'error'); return;
  }
  if (!bersediaLuarKota) {
    showToast('Kesediaan luar kota wajib dipilih!', 'error'); return;
  }
  if (!selectedFileKTP) {
    showToast('Foto KTP wajib diupload!', 'error'); return;
  }
  if (!selectedFileSelfie) {
    showToast('Foto selfie wajib diupload!', 'error'); return;
  }

  // ── Loading ───────────────────────────────────────────────
  const btn = document.getElementById('submitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    // STEP 1: Submit data lamaran
    const result = await apiPost('submitLamaran', {
      namaPanggilan,
      usia,
      noWhatsapp,
      pendidikan,
      namaSekolah,
      statusPernikahan,
      alamat,
      pengalamanKerja : pengalamanKerja || 'Belum ada pengalaman kerja',
      bersediaLuarKota
    });

    if (result.status !== 'success') throw new Error(result.message);
    currentId = result.id;

    // STEP 2: Upload KTP
    setProgressText('ktp', '📤 Mengupload foto KTP...');
    toggleProgress('ktp', true);
    await uploadFile(currentId, selectedFileKTP, 'ktp');
    toggleProgress('ktp', false);

    // STEP 3: Upload Selfie
    setProgressText('selfie', '📤 Mengupload foto selfie...');
    toggleProgress('selfie', true);
    await uploadFile(currentId, selectedFileSelfie, 'selfie');
    toggleProgress('selfie', false);

    // ── Sukses! ───────────────────────────────────────────
    showSuccessPage(currentId);

  } catch (error) {
    showToast('Gagal: ' + error.message, 'error');
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

// ============================================================
// UPLOAD FILE KE GAS
// ============================================================
function uploadFile(id, file, type) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const action  = type === 'selfie' ? 'uploadSelfie' : 'uploadKTP';
        const fillId  = type === 'selfie' ? 'progressFillSelfie' : 'progressFillKTP';

        // Simulasi animasi progress
        let pct = 0;
        const iv = setInterval(() => {
          pct = Math.min(pct + 15, 85);
          const el = document.getElementById(fillId);
          if (el) el.style.width = pct + '%';
        }, 200);

        const result = await apiPost(action, {
          idPelamar: id,
          fileData : e.target.result,
          fileName : file.name,
          mimeType : file.type
        });

        clearInterval(iv);
        const fillEl = document.getElementById(fillId);
        if (fillEl) fillEl.style.width = '100%';

        if (result.status === 'success') resolve(result);
        else reject(new Error(result.message));

      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

// ============================================================
// HELPERS PROGRESS
// ============================================================
function toggleProgress(type, show) {
  const id = type === 'selfie' ? 'uploadProgressSelfie' : 'uploadProgressKTP';
  const el = document.getElementById(id);
  if (el) el.style.display = show ? 'block' : 'none';
}

function setProgressText(type, text) {
  const id = type === 'selfie' ? 'progressLabelSelfie' : 'progressLabelKTP';
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ============================================================
// SUCCESS PAGE
// ============================================================
function showSuccessPage(id) {
  document.getElementById('landingPage')?.classList.add('hidden');
  document.getElementById('successPage')?.classList.remove('hidden');
  const el = document.getElementById('successId');
  if (el) el.textContent = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// KIRIM KONFIRMASI WA
// ============================================================
function kirimWA() {
  const id           = document.getElementById('successId')?.textContent || '-';
  const nama         = document.getElementById('namaPanggilan')?.value || '-';
  const usia         = document.getElementById('usia')?.value || '-';
  const pendidikan   = document.getElementById('pendidikan')?.value || '-';
  const statusNikah  = getRadioValue('statusPernikahan') || '-';
  const alamat       = document.getElementById('alamat')?.value || '-';
  const luarKota     = getRadioValue('bersediaLuarKota') === 'Ya' ? 'Bersedia' : 'Tidak Bersedia';

  const pesan =
`Assalamu'alaikum, Kak 👋

Saya ingin mengkonfirmasi bahwa saya telah mengisi formulir lamaran kerja di *Gociko Snack*.

Berikut data saya:

📋 *DATA PELAMAR*
━━━━━━━━━━━━━━━━━━━━
🔖 ID Lamaran   : *${id}*
👤 Nama         : *${nama}*
🎂 Usia         : *${usia} Tahun*
🎓 Pendidikan   : *${pendidikan}*
💍 Sts. Nikah   : *${statusNikah}*
📍 Alamat       : *${alamat}*
🏙️ Luar Kota    : *${luarKota}*
━━━━━━━━━━━━━━━━━━━━

Saya siap untuk mengikuti proses seleksi selanjutnya. Terima kasih 🙏

_*Gociko Snack Job Application*_`;

  const url = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesan)}`;
  window.open(url, '_blank');
}

// ============================================================
// RESET FORM
// ============================================================
function resetForm() {
  document.getElementById('successPage')?.classList.add('hidden');
  document.getElementById('landingPage')?.classList.remove('hidden');
  document.getElementById('lamaranForm')?.reset();

  selectedFileKTP    = null;
  selectedFileSelfie = null;
  currentId          = null;

  // Reset semua radio visual
  document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));

  // Reset area KTP
  const areaKTP = document.getElementById('uploadAreaKTP');
  if (areaKTP) areaKTP.innerHTML = `
    <div class="upload-icon">📷</div>
    <div class="upload-text">Klik untuk upload foto KTP</div>
    <div class="upload-hint">Format JPG / PNG • Maks. 2MB</div>
  `;
  const prevKTP = document.getElementById('uploadPreviewKTP');
  if (prevKTP) prevKTP.style.display = 'none';

  // Reset area Selfie
  const areaSelfie = document.getElementById('uploadAreaSelfie');
  if (areaSelfie) areaSelfie.innerHTML = `
    <div class="upload-icon">🤳</div>
    <div class="upload-text">Klik untuk upload foto selfie</div>
    <div class="upload-hint">Format JPG / PNG • Maks. 2MB</div>
  `;
  const prevSelfie = document.getElementById('uploadPreviewSelfie');
  if (prevSelfie) prevSelfie.style.display = 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
