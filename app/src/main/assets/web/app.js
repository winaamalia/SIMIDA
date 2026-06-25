// ==========================
// FIX GLOBAL CHART SAFETY
// ==========================
let chartBarang = null;

function addNotification(pesan) {
    let notif = JSON.parse(localStorage.getItem("notif")) || [];

    notif.unshift({
        id: Date.now(),
        pesan,
        waktu: new Date().toLocaleString(),
        read: false
    });

    localStorage.setItem("notif", JSON.stringify(notif));

    renderNotif();
}
function toggleNotifikasi() {
    const dropdown = document.getElementById("notifDropdown");
    dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";

    renderNotif();
}
function renderNotif() {
    const notif = JSON.parse(localStorage.getItem("notif")) || [];

    const list = document.getElementById("notifList");
    const badge = document.getElementById("notifBadge");

    if (!list || !badge) return;

    list.innerHTML = "";

    let unread = 0;

    notif.forEach(item => {
        if (!item.read) unread++;

        list.innerHTML += `
            <div style="padding:10px; border-bottom:1px solid #eee;">
                <div style="font-size:13px;">${item.pesan}</div>
                <small style="color:gray;">${item.waktu}</small>
            </div>
        `;
    });

    if (unread > 0) {
        badge.style.display = "flex";
        badge.textContent = unread;
    } else {
        badge.style.display = "none";
    }
}
window.addEventListener("DOMContentLoaded", () => {
    renderNotif();
});
// ==========================
// STORAGE WRAPPER (WAJIB)
// ==========================
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    triggerUpdate();
}
// ==========================
// 🔥 FIX: SINGLE UPDATE SYSTEM (HAPUS DUPLIKAT ERROR)
// ==========================
function triggerUpdate() {
    window.dispatchEvent(new Event("dataUpdated"));
}

// hanya 1 listener (biar tidak dobel render)
window.addEventListener("dataUpdated", () => {
    if (typeof renderDashboard === "function") renderDashboard();
    if (typeof renderDashboardTable === "function") renderDashboardTable();
    if (typeof renderLaporanTable === "function") renderLaporanTable();
    if (typeof renderTable === "function") renderTable();
    if (typeof updateBarangTersedia === "function") updateBarangTersedia();
    if (typeof initGrafikBarang === "function") initGrafikBarang();
    if (typeof renderPeminjamanTable === "function") renderPeminjamanTable();

});
// ==========================
// FIX TAMBAH BARANG (AUTO UPDATE DASHBOARD)
// ==========================
function tambahBarang(){
    const nama = document.getElementById("namaBarang").value.trim();
    const barcode = document.getElementById("barcodeBarang").value.trim();

    if(!nama || !barcode){
        alert("Isi data lengkap");
        return;
    }

    const barang = getData("barang");

    barang.push({
        nama,
        barcode,
        jumlah: Number(document.getElementById("stokBarang").value || 1),
        kondisi: document.getElementById("kondisiBarang").value,
        lokasi: document.getElementById("lokasiBarang").value,
        tahun: document.getElementById("tahunBarang").value,
        keterangan: document.getElementById("keteranganBarang").value
    });

    setData("barang", barang);
    renderTable();
    closeModal();
}
// ==========================
// FIX HAPUS BARANG
// ==========================
function hapusBarang(i) {
    const barang = getData("barang");
    barang.splice(i, 1);
    setData("barang", barang);
    renderTable();
    updateBarangTersedia?.();
    renderDashboard?.();
    initGrafikBarang?.();
}

// ==========================
// TABLE BARANG (AMAN)
// ==========================
function renderTable(data = null) {
    const el = document.getElementById("tableBarang");
    if (!el) return;

    const barang = data || getData("barang");

    el.innerHTML = barang.map((b, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${b.nama}</td>
            <td>${b.barcode}</td>
            <td>${b.jumlah}</td>
            <td>${b.kondisi}</td>
        <td class="aksi-cell">
            <div class="aksi-group">
                <button class="btn-detail" onclick="showDetailBarang(${i})">
                    Detail
                </button>

                <button class="btn-hapus" onclick="hapusBarang(${i})">
                    Hapus
                </button>
            </div>
        </td>
        </tr>
    `).join("");
}
// ==========================
// DASHBOARD COUNT FIX (INI INTI PERBAIKAN)
// ==========================
function getTotalBarang() {
    return getData("barang").length;
}

function getDipinjamCount() {
    return getData("peminjaman").filter(x => x.status === "DISETUJUI").length;
}

function getTersedia() {
    const barang = getData("barang");
    const dipinjam = getDipinjamCount();
    return Math.max(0, barang.length - dipinjam);
}

// ==========================
// DASHBOARD CARD UPDATE
// ==========================
function renderDashboard() {
    const t = document.getElementById("totalBarang");
    const d = document.getElementById("totalDipinjam");
    const s = document.getElementById("totalTersedia");

    if (t) t.innerText = getTotalBarang();
    if (d) d.innerText = getDipinjamCount();
    if (s) s.innerText = getTersedia();

    renderDashboardTable();
}

// ==========================
// DASHBOARD TABLE
// ==========================
function renderDashboardTable() {
    const el = document.getElementById("tableDashboardPeminjaman");
    if (!el) return;

    const data = getData("peminjaman").slice(-5).reverse();

    el.innerHTML = data.map(d => `
        <tr>
            <td>${d.nama}</td>
            <td>${d.barang}</td>
            <td>${d.status}</td>
        </tr>
    `).join("");
}

// ==========================
// FIX BARANG TERSEDIA (INI YANG SEBELUMNYA ERROR)
// ==========================
function updateBarangTersedia() {
     const listEl = document.getElementById("listBarangTersedia");
     const totalEl = document.getElementById("totalBarangTersedia");
     const jenisEl = document.getElementById("totalJenisBarang");

     const barang = getData("barang");
     const laporan =getData("peminjaman")

     const dipinjamMap = {};

     laporan.forEach(l => {
         if (l.status === "DISETUJUI") {
             dipinjamMap[l.barang] = (dipinjamMap[l.barang] || 0) + 1;
         }
     });

     let tersediaCount = 0;

     const html = barang.map((b, i) => {
         const dipakai = dipinjamMap[b.barcode] || 0;
         const sisa = b.jumlah - dipakai;

         if (sisa > 0) {
             tersediaCount++;
return `
<div class="barang-card">
    <div class="card-title">${b.nama}</div>

    <div class="card-meta">
        Kode: ${b.barcode}
    </div>

    <span class="badge">${sisa} tersedia</span>

    <button class="btn-detail" onclick="showDetailBarang(${i})">
        Lihat Detail
    </button>
</div>
`;
         }
         return "";
     }).join("");

     if (listEl) listEl.innerHTML = html;
     if (totalEl) totalEl.innerText = tersediaCount;
     if (jenisEl) jenisEl.innerText = barang.length;
 }

// ==========================
// CHART FIX (NO RESET BUG)
// ==========================
function initGrafikBarang() {
    const ctx = document.getElementById("grafikBarang");
    if (!ctx) return;

    const data = [
        getTotalBarang(),
        getDipinjamCount(),
        getTersedia()
    ];

    if (chartBarang) {
        chartBarang.data.datasets[0].data = data;
        chartBarang.update();
        return;
    }

    chartBarang = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Total", "Dipinjam", "Tersedia"],
           datasets: [{
               label: "Jumlah Barang",
               data: [
                   getTotalBarang() || 0,
                   getDipinjamCount() || 0,
                   getTersedia() || 0
               ],
               backgroundColor: ["#8B0000", "#F1C40F", "#2ECC71"]
           }]
        }
    });
}

// ==========================
// AUTO INIT (FIX FINAL)
// ==========================
window.addEventListener("load", () => {

    renderTable();
    renderDashboard();
    updateBarangTersedia();
    initGrafikBarang();
});
window.addEventListener("DOMContentLoaded", () => {
    applyTheme();
});
function showDetailBarang(i){
    const b = getData("barang")[i];

    const html = `
    <div class="modal" onclick="this.remove()">
        <div class="modal-box" onclick="event.stopPropagation()">
            <h3>${b.nama}</h3>

            <div class="modal-body">
                <p><b>Kode Barcode:</b> ${b.barcode}</p>
                <p><b>Jumlah:</b> ${b.jumlah}</p>
                <p><b>Kondisi:</b> ${b.kondisi}</p>
                <p><b>Lokasi:</b> ${b.lokasi || '-'}</p>
                <p><b>Tahun:</b> ${b.tahun || '-'}</p>
                <p><b>Keterangan:</b> ${b.keterangan || '-'}</p>
            </div>

            <button onclick="this.closest('.modal').remove()">Tutup</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
}
function toggleDetail(i){
    const b = getData("barang")[i];

    const el = document.getElementById("detail-" + i);

    if(el){
        el.remove();
        return;
    }

    const html = `
    <div id="detail-${i}" class="detail-box">
        <p>Jumlah: ${b.jumlah}</p>
        <p>Lokasi: ${b.lokasi}</p>
        <p>Tahun: ${b.tahun}</p>
        <p>Keterangan: ${b.keterangan}</p>
    </div>
    `;

    document.querySelectorAll(".barang-card")[i]
        .insertAdjacentHTML("beforeend", html);
}
function exportPDF() {
    window.print();
}

function toggleFormInput() {
    const form = document.getElementById("formTambahBarang");
    if (!form) return;

    form.style.display =
        form.style.display === "block" ? "none" : "block";
}
function toggleFormLaporan() {
    const form = document.getElementById("formTambahLaporan");
    if (!form) return;

    form.style.display =
        form.style.display === "block" ? "none" : "block";
}
function openModal() {
    document.getElementById("modalBarang").style.display = "flex";
}

function closeModal() {
    document.getElementById("modalBarang").style.display = "none";
}

function badge(status){
    if(status === "DISETUJUI")
        return `<span class="badge success">✓ Disetujui</span>`;

    if(status === "DITOLAK")
        return `<span class="badge danger">✕ Ditolak</span>`;

    return `<span class="badge warning">⏳ Menunggu</span>`;
}
function renderPeminjamanTable() {
    const el = document.getElementById("tablePeminjaman");
    if (!el) return;

    const data = getData("peminjaman") || [];

    if (!data.length) {
        el.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;">Belum ada data</td>
            </tr>
        `;
        return;
    }

    el.innerHTML = data.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${d.nama}</td>
            <td>${d.barang}</td>
            <td>${d.tglPinjam || "-"}</td>
            <td>${d.tglKembali || "-"}</td>
            <td>${d.keterlambatan || "-"}</td>
            <td>${badge(d.status)}</td>
            <td>
                <button onclick="setujui(${i})">Setujui</button>
                <button onclick="tolak(${i})">Tolak</button>
            </td>
            <td>${d.jadwalAdmin || "-"}</td>
        </tr>
    `).join("");
}
function setujui(i) {
    let data = getData("peminjaman") || [];

    data[i].status = "DISETUJUI";

    // 🔥 UPDATE STOK
    let barang = getData("barang");

    let item = barang.find(b => b.nama === data[i].barang);
    if (item && item.jumlah > 0) {
        item.jumlah -= 1;
    }

    setData("barang", barang);
    setData("peminjaman", data);

    addNotification("Pengajuan peminjaman disetujui admin");

    renderPeminjamanTable();
    renderDashboard();
}

function tolak(i) {
    const peminjaman = getData("peminjaman");

    if (!peminjaman[i].log) {
        peminjaman[i].log = [];
    }

    peminjaman[i].status = "DITOLAK";

    peminjaman[i].log.push({
        aksi: "REJECT",
        waktu: new Date().toLocaleString()
    });

    setData("peminjaman", peminjaman);

    addNotification("Pengajuan peminjaman ditolak admin");
    toast("Pengajuan ditolak", "error");
    renderPeminjamanTable();
    renderDashboard();
}
function tambahPeminjaman(){
    const data = getData("peminjaman");

    const baru = {
        nama: document.getElementById("nama").value,
        barang: document.getElementById("barang").value,
        barcode: document.getElementById("barcode").value,
       tglPinjam: document.getElementById("tglPinjam")?.value || "-",
        tglKembali: document.getElementById("tglKembali").value,


        status: "MENUNGGU",
        log: []
    };

    data.push(baru);

    setData("peminjaman", data);

    renderPeminjamanTable();
}
function toast(message, type="success") {
    Swal.fire({
        toast: true,
        position: "top-end",
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });
}
function renderLaporanTable() {
    const el = document.getElementById("tableLaporan");
    if (!el) return;

    const data = getData("laporan");

    el.innerHTML = data.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${d.nama}</td>
            <td>${d.barang}</td>
            <td>${d.tglAmbil || "-"}</td>
            <td>${d.tglKembali || "-"}</td>
            <td>${d.status}</td>
            <td>
                <button onclick="hapusLaporan(${i})">Hapus</button>
            </td>
        </tr>
    `).join("");
}
function hapusLaporan(i){
    let data = getData("laporan");
    data.splice(i, 1);
    setData("laporan", data);
    renderLaporanTable();
}
function tambahLaporanManual() {
    let data = getData("laporan");

    const baru = {
        nama: document.getElementById("namaLaporan").value,
        barang: document.getElementById("barangLaporan").value,
        tglAmbil: document.getElementById("tglAmbilLaporan").value,
        tglKembali: document.getElementById("tglKembaliLaporan").value,
        status: document.getElementById("statusLaporan").value
    };

    data.push(baru);

    setData("laporan", data);
    renderLaporanTable();
}
function logout() {
    localStorage.removeItem("sessionRole");
    localStorage.removeItem("username");

    toast("Logout berhasil", "success");

    setTimeout(() => {
        window.location.href = "LoginUser.html";
    }, 800);
}
function loginUser() {
    const username = document.getElementById("usernameUser")?.value.trim();
    const password = document.getElementById("passwordUser")?.value.trim();

    if (!username || !password) {
        Swal.fire("Isi username & password");
        return;
    }

    localStorage.setItem("sessionRole", "user");
    localStorage.setItem("username", username);

    window.location.href = "pengajuan_user.html";
}
function loginAdmin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "admin") {
        localStorage.setItem("sessionRole", "admin");

        window.location.href = "index.html"; // FIX INI
    } else {
        alert("login gagal");
    }
}
function toggleDarkMode() {
    const current = localStorage.getItem("theme") || "light";
    const next = current === "dark" ? "light" : "dark";

    localStorage.setItem("theme", next);
    applyTheme(next);
}
function markAllRead() {
    let notif = getData("notif");

    notif = notif.map(n => ({ ...n, read: true }));

    localStorage.setItem("notif", JSON.stringify(notif));

    renderNotif();
}
function applyTheme(theme = localStorage.getItem("theme") || "light") {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    const icon = document.getElementById("darkIcon");
    if (!icon) return;

    // RESET TOTAL (ini kunci fix)
    icon.className = "fa-solid " + (isDark ? "fa-sun" : "fa-moon");
}
window.addEventListener("DOMContentLoaded", () => {
    applyTheme();
});
function cekLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "admin") {
        localStorage.setItem("sessionRole", "admin");
        window.location.href = "index.html"; // FIX UTAMA
    } else {
        alert("Login gagal");
    }
}

window.cekLogin = cekLogin;
