const TOTAL_SOAL = 10;
const MIN_VAL = -15;
const MAX_VAL = 15;

let skor = 0;
let indexSoal = 0;
let posisiSekarang = 0;
let targetAnimatePos = 0;
let currentVisualPos = 0;
let soalList = [];
let stepArrows = [];
let sedangAnimasi = false;

// Array global penyimpanan rekap nilai siswa
let dataRekapSiswa = JSON.parse(localStorage.getItem("dataRekapNilai")) || [];

const canvas = document.getElementById('canvasGaris');
const ctx = canvas.getContext('2d');

// Bank Soal Kontekstual Beragam
function buatDaftarSoal() {
    const pembuatSoal = [
        // Suhu (Termometer)
        () => {
            const awal = Math.floor(Math.random() * 6) - 3;
            const turun = Math.floor(Math.random() * 5) + 2;
            const naik = Math.floor(Math.random() * 6) + 1;
            return {
                kategori: "Suhu & Termometer",
                teks: `🌡️️ Suhu ruangan pembeku mula-mula ${awal}°C. Suhu diturunkan ${turun}°C, lalu dinaikkan ${naik}°C. Berapa suhu akhir ruangan tersebut?`,
                awal: awal,
                ops: [[-1, turun], [1, naik]],
                target: awal - turun + naik,
                maskot: "🌡️",
                tipeLayout: "horizontal"
            };
        },
        // Kedalaman Laut (Kapal Selam)
        () => {
            const kedalaman = Math.floor(Math.random() * 5) + 3;
            const naik = Math.floor(Math.random() * 4) + 2;
            return {
                kategori: "Kedalaman Laut",
                teks: `🤿 Seorang penyelam berada ${kedalaman} meter di bawah permukaan laut (-${kedalaman}). Ia kemudian naik sejauh ${naik} meter. Di manakah posisi penyelam sekarang?`,
                awal: -kedalaman,
                ops: [[1, naik]],
                target: -kedalaman + naik,
                maskot: "🤿",
                tipeLayout: "horizontal"
            };
        },
        // Elevator & Basement
        () => {
            const lantaiAwal = Math.floor(Math.random() * 5) - 2;
            const naik = Math.floor(Math.random() * 5) + 2;
            const turun = Math.floor(Math.random() * 3) + 1;
            return {
                kategori: "Aktivitas Gedung",
                teks: `🏢 Lift berada di lantai ${lantaiAwal}. Lift naik ${naik} lantai, lalu turun ${turun} lantai. Di lantai berapa lift berhenti?`,
                awal: lantaiAwal,
                ops: [[1, naik], [-1, turun]],
                target: lantaiAwal + naik - turun,
                maskot: "🛗",
                tipeLayout: "horizontal"
            };
        },
        // Keuangan / Tanggung Jawab
        () => {
            const tabungan = Math.floor(Math.random() * 6) + 2;
            const belanja = Math.floor(Math.random() * 7) + 3;
            return {
                kategori: "Sisa Saldo",
                teks: `💳 Budi memiliki saldo tabungan Rp${tabungan} ribu (+${tabungan}). Ia membeli buku seharga Rp${belanja} ribu (-${belanja}). Berapa sisa saldo/hutang Budi?`,
                awal: tabungan,
                ops: [[-1, belanja]],
                target: tabungan - belanja,
                maskot: "🪙",
                tipeLayout: "horizontal"
            };
        },
        // Operasi Matematika Murni
        () => {
            const awal = Math.floor(Math.random() * 8) - 4;
            const delta = Math.floor(Math.random() * 5) + 1;
            const tanda = Math.random() < 0.5 ? 1 : -1;
            return {
                kategori: "Matematika",
                teks: `❓ Hitunglah nilai dari: ${awal} ${tanda > 0 ? '+' : '-'} ${delta} = ...`,
                awal: awal,
                ops: [[tanda, delta]],
                target: awal + (tanda * delta),
                maskot: "🚀",
                tipeLayout: "horizontal"
            };
        }
    ];

    let list = [];
    for (let i = 0; i < TOTAL_SOAL; i++) {
        const fn = pembuatSoal[i % pembuatSoal.length];
        let s = fn();
        while (s.target < MIN_VAL + 1 || s.target > MAX_VAL - 1) {
            s = fn();
        }
        list.push(s);
    }
    return list;
}

function nilaiKeX(val) {
    const leftPad = 60;
    const rightPad = 60;
    const usable = canvas.width - leftPad - rightPad;
    const rasio = (val - MIN_VAL) / (MAX_VAL - MIN_VAL);
    return leftPad + rasio * usable;
}

function gambarGaris() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const y = canvas.height / 2 + 20;

    // Garis Utama
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 30, y);
    ctx.stroke();

    // Skala Angka
    for (let v = MIN_VAL; v <= MAX_VAL; v++) {
        const x = nilaiKeX(v);
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();

        ctx.fillStyle = (v === 0) ? "#f59e0b" : "#94a3b8";
        ctx.font = (v === 0) ? "bold 13px Inter" : "11px Inter";
        ctx.textAlign = "center";
        ctx.fillText(v.toString(), x, y + 26);
    }

    // Titik Acuan Nol
    const xNol = nilaiKeX(0);
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(xNol, y, 6, 0, Math.PI * 2);
    ctx.fill();
}

function gambarPanahLangkah(dari, ke, warna, lvl = 0) {
    const yBase = canvas.height / 2 + 20;
    const x0 = nilaiKeX(dari);
    const x1 = nilaiKeX(ke);
    const y = yBase - (30 + lvl * 16);

    ctx.strokeStyle = warna;
    ctx.fillStyle = warna;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();

    const headlen = 8;
    const angle = Math.atan2(0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x1 - headlen * Math.cos(angle + Math.PI / 6), y + headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();
}

function renderScene() {
    gambarGaris();
    const soal = soalList[indexSoal];

    // Gambar Jejak Panah
    stepArrows.forEach((arrow, index) => {
        gambarPanahLangkah(arrow.dari, arrow.ke, arrow.warna, index % 3);
    });

    // Gambar Maskot pada Posisi Animasi Saat Ini
    const xMaskot = nilaiKeX(currentVisualPos);
    const yMaskot = canvas.height / 2 - 30;
    ctx.font = "32px Inter";
    ctx.textAlign = "center";
    ctx.fillText(soal ? soal.maskot : "🚀", xMaskot, yMaskot);
}

// Loop Animasi Pergerakan Mulus
function updateAnimation() {
    const diff = targetAnimatePos - currentVisualPos;
    if (Math.abs(diff) > 0.02) {
        currentVisualPos += diff * 0.2;
        renderScene();
        requestAnimationFrame(updateAnimation);
    } else {
        currentVisualPos = targetAnimatePos;
        sedangAnimasi = false;
        renderScene();
    }
}

function muatSoal() {
    if (indexSoal >= TOTAL_SOAL) {
        tampilkanModalAkhir();
        return;
    }

    const soal = soalList[indexSoal];
    posisiSekarang = 0;
    targetAnimatePos = 0;
    currentVisualPos = 0;
    stepArrows = [];

    document.getElementById('lbl-soal-no').innerText = `${indexSoal + 1} / ${TOTAL_SOAL}`;
    document.getElementById('badge-kategori').innerText = soal.kategori;
    document.getElementById('lbl-pertanyaan').innerText = soal.teks;
    document.getElementById('header-icon').innerText = soal.maskot;
    document.getElementById('theme-subtitle').innerText = `Tema: ${soal.kategori}`;
    document.getElementById('lbl-posisi').innerText = `📍 Posisi Sekarang: ${posisiSekarang}`;
    document.getElementById('lbl-emoji').innerText = "🙂";
    document.getElementById('lbl-pesan').innerHTML = "Mulai dari titik 0, geser maskot sesuai operasi pada soal cerita, lalu tekan <strong>Kunci Jawaban</strong>!";

    // Reset Kontrol
    document.getElementById('control-panel').innerHTML = `
        <button class="btn btn-left" onclick="langkah(-1)">⬅️ Kiri / Turun (-1)</button>
        <button class="btn btn-right" onclick="langkah(1)">➡️ Kanan / Naik (+1)</button>
        <button class="btn btn-reset" onclick="ulangiLangkah()">🔄 Reset</button>
        <button class="btn btn-submit" onclick="kunciJawaban()">🎯 Kunci Jawaban</button>
    `;

    renderScene();
}

function langkah(arah) {
    if (sedangAnimasi) return;
    const baru = posisiSekarang + arah;
    if (baru < MIN_VAL + 1 || baru > MAX_VAL - 1) return;

    const warna = arah > 0 ? "#10b981" : "#ef4444";
    stepArrows.push({ dari: posisiSekarang, ke: baru, warna: warna });

    posisiSekarang = baru;
    targetAnimatePos = baru;
    sedangAnimasi = true;

    document.getElementById('lbl-posisi').innerText = `📍 Posisi Sekarang: ${posisiSekarang}`;
    updateAnimation();
}

function ulangiLangkah() {
    if (sedangAnimasi) return;
    posisiSekarang = 0;
    targetAnimatePos = 0;
    currentVisualPos = 0;
    stepArrows = [];
    document.getElementById('lbl-posisi').innerText = `📍 Posisi Sekarang: ${posisiSekarang}`;
    document.getElementById('lbl-emoji').innerText = "🙂";
    document.getElementById('lbl-pesan').innerText = "Posisi direset ke titik 0. Susun kembali langkahmu!";
    renderScene();
}

function kunciJawaban() {
    const soal = soalList[indexSoal];
    if (posisiSekarang === soal.target) {
        skor += 10;
        document.getElementById('lbl-skor').innerText = skor;
        document.getElementById('lbl-emoji').innerText = "🥳";
        document.getElementById('lbl-pesan').innerHTML = "<strong style='color:#10b981;'>HEBAT! Jawabanmu Tepat Sekali! (+10)</strong>";
    } else {
        skor -= 5;
        document.getElementById('lbl-skor').innerText = skor;
        document.getElementById('lbl-emoji').innerText = "🧐";
        document.getElementById('lbl-pesan').innerHTML = `<strong style='color:#ef4444;'>Jawaban Belum Tepat! (-5)</strong><br>Posisi Seharusnya: <strong>${soal.target}</strong>. Alur langkah yang benar digambarkan di atas.`;

        // Visualisasi Jawaban yang Benar
        stepArrows = [];
        if (soal.awal !== 0) {
            stepArrows.push({ dari: 0, ke: soal.awal, warna: soal.awal > 0 ? "#10b981" : "#ef4444" });
        }
        let curr = soal.awal;
        soal.ops.forEach(([tanda, delta]) => {
            let ke = curr + (tanda * delta);
            stepArrows.push({ dari: curr, ke: ke, warna: tanda > 0 ? "#10b981" : "#ef4444" });
            curr = ke;
        });
        posisiSekarang = soal.target;
        targetAnimatePos = soal.target;
        currentVisualPos = soal.target;
    }

    renderScene();

    // Tombol Lanjut
    document.getElementById('control-panel').innerHTML = `
        <button class="btn btn-next" onclick="lanjutSoal()">➡️ Soal Selanjutnya</button>
    `;
}

function lanjutSoal() {
    indexSoal++;
    muatSoal();
}

function tampilkanModalAkhir() {
    const modal = document.getElementById('modal-akhir');
    modal.style.display = 'flex';

    let bintang = "⭐⭐⭐";
    let evaluasi = "Sempurna! Kamu memahami konsep garis bilangan dengan sangat baik! 🏆";
    if (skor < 60) {
        bintang = "⭐☆☆";
        evaluasi = "Terus berlatih ya! Kamu pasti bisa lebih baik lagi.";
    } else if (skor < 90) {
        bintang = "⭐⭐☆";
        evaluasi = "Bagus sekali! Sedikit lagi mencapai nilai sempurna.";
    }

    document.getElementById('modal-bintang').innerText = bintang;
    document.getElementById('modal-skor').innerText = `Skor Akhir: ${skor} / ${TOTAL_SOAL * 10}`;
    document.getElementById('modal-evaluasi').innerText = evaluasi;

    // Simpan otomatis nilai siswa baru ke riwayat
    simpanRekapNilaiSiswa();
}

function mainLagi() {
    document.getElementById('modal-akhir').style.display = 'none';
    skor = 0;
    indexSoal = 0;
    document.getElementById('lbl-skor').innerText = "0";
    soalList = buatDaftarSoal();
    muatSoal();
}

// ---------------------------------------------------------------------
// FITUR REKAP NILAI, EKSPOR EXCEL/CSV & KHUSUS PENGHAPUSAN OLEH GURU (PIN)
// ---------------------------------------------------------------------

// 1. Simpan Rekap Nilai Siswa ke LocalStorage
function simpanRekapNilaiSiswa() {
    let nama = typeof namaSiswa !== 'undefined' && namaSiswa ? namaSiswa : (document.getElementById('txt-nama')?.value || "Siswa");
    let absen = typeof nomorAbsen !== 'undefined' && nomorAbsen ? nomorAbsen : (document.getElementById('txt-absen')?.value || "-");
    let skorBiasa = typeof skorKuisLangsung !== 'undefined' ? skorKuisLangsung : 0;
    let skorCerita = skor;

    let rekapBaru = {
        absen: absen,
        nama: nama,
        hitungBiasa: skorBiasa,
        soalCerita: skorCerita,
        nilaiAkhir: Math.round((Number(skorBiasa) + Number(skorCerita)) / 2),
        status: "Lengkap",
        waktu: new Date().toLocaleString('id-ID')
    };

    dataRekapSiswa.push(rekapBaru);
    localStorage.setItem("dataRekapNilai", JSON.stringify(dataRekapSiswa));
    localStorage.setItem("rekapNilaiSiswa", JSON.stringify(dataRekapSiswa));
}

// 2. Ekspor Semua Rekap Nilai ke File CSV / Excel
function unduhRekapExcel() {
    if (dataRekapSiswa.length === 0) {
        alert("Belum ada data rekap nilai tersimpan.");
        return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM agar rapi di Microsoft Excel
    csvContent += "No Absen;Nama Siswa;Hitung Biasa;Soal Cerita;Nilai Akhir;Status;Waktu Pengerjaan\n";

    dataRekapSiswa.forEach(item => {
        csvContent += `"${item.absen}";"${item.nama}";${item.hitungBiasa};${item.soalCerita};${item.nilaiAkhir};"${item.status}";"${item.waktu}"\n`;
    });

    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Nilai_Keseluruhan_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 3. Penghapusan Aman Khusus Guru Menggunakan PIN/Password
function hapusSeluruhRekap() {
    const PIN_GURU = "123456"; // Ganti PIN sesuai keinginan Anda

    let inputPIN = prompt("🔒 Masukkan PIN/Password Guru untuk menghapus rekap nilai:");

    if (inputPIN === null) return; // Batal jika tombol cancel ditekan

    if (inputPIN === PIN_GURU) {
        if (confirm("PIN Benar! Apakah Anda yakin ingin menghapus SELURUH data rekap nilai siswa? Data tidak bisa dikembalikan.")) {
            // Bersihkan semua kemungkinan key LocalStorage rekap nilai
            localStorage.removeItem("dataRekapNilai");
            localStorage.removeItem("rekapNilaiSiswa");
            localStorage.removeItem("rekapNilai");

            // Kosongkan memori variabel global
            dataRekapSiswa = [];

            // Kosongkan elemen tabel HTML jika ada
            let tabelRekap = document.getElementById("tabel-rekap");
            if (tabelRekap) {
                tabelRekap.innerHTML = "";
            }

            alert("✅ Seluruh data rekap nilai berhasil dihapus!");
            location.reload(); // Refresh halaman agar tampilan bersih kembali
        }
    } else {
        alert("❌ PIN Salah! Anda tidak memiliki hak akses untuk menghapus data rekap nilai.");
    }
}

window.onload = () => {
    soalList = buatDaftarSoal();
    muatSoal();
};