let user = null;
let daftarBarang = [];
let keranjang = [];

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function rupiah(angka) {
    return "Rp" + Number(angka).toLocaleString("id-ID");
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const pesan = document.getElementById("pesanLogin");

    if (!email || !password) {
        pesan.textContent = "Email dan password harus diisi.";
        return;
    }

    pesan.textContent = "Menghubungkan...";

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error(error);
            pesan.textContent = "Login gagal: " + error.message;
            return;
        }

        user = data.user;

      await muatBarang();

        document.getElementById("halamanLogin")
            .classList.add("hidden");

        document.getElementById("aplikasi")
            .classList.remove("hidden");

        document.getElementById("emailUser").textContent =
            user.email;

        pesan.textContent = "";

    } catch (error) {
        console.error(error);

        pesan.textContent =
            "Terjadi kesalahan: " + error.message;
    }
}


async function daftar() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const pesan = document.getElementById("pesanLogin");

    if (!email || !password) {
        pesan.textContent = "Isi email dan password.";
        return;
    }

    if (password.length < 6) {
        pesan.textContent = "Password minimal 6 karakter.";
        return;
    }

    pesan.textContent = "Membuat akun...";

    try {
        const { data, error } =
            await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

        if (error) {
            pesan.textContent = error.message;
            return;
        }

        if (data.session) {
            user = data.user;

            document.getElementById("halamanLogin")
                .classList.add("hidden");

            document.getElementById("aplikasi")
                .classList.remove("hidden");
        } else {
            pesan.textContent =
                "Akun dibuat. Silakan cek email untuk verifikasi.";
        }

    } catch (error) {
        pesan.textContent =
            "Terjadi kesalahan: " + error.message;
    }
}


async function logout() {
    await supabaseClient.auth.signOut();

    user = null;

    document.getElementById("aplikasi")
        .classList.add("hidden");

    document.getElementById("halamanLogin")
        .classList.remove("hidden");
}


async function cekLogin() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    if (data.session) {
        user = data.session.user;

        document.getElementById("halamanLogin")
            .classList.add("hidden");

        document.getElementById("aplikasi")
            .classList.remove("hidden");

        document.getElementById("emailUser").textContent =
            user.email;
    }
}

cekLogin();
function bukaHalaman(namaHalaman) {
    const halaman = [
        "dashboard",
        "barang",
        "kasir",
        "laporan"
    ];

    halaman.forEach(function(id) {
        const element = document.getElementById(id);

        if (element) {
            element.classList.add("hidden");
        }
    });

    const target = document.getElementById(namaHalaman);

    if (target) {
        target.classList.remove("hidden");
    }
}
async function simpanBarang() {
    if (!user) {
        alert("Belum login!");
        return;
    }

    const nama = document.getElementById("namaBarang").value.trim();
    const hargaModal = Number(document.getElementById("hargaModal").value);
    const hargaJual = Number(document.getElementById("hargaJual").value);
    const stok = Number(document.getElementById("stok").value);
    const stokMinimum = Number(document.getElementById("stokMinimum").value);

    if (!nama || hargaModal < 0 || hargaJual < 0 || stok < 0) {
        alert("Lengkapi data barang terlebih dahulu!");
        return;
    }

    const dataBarang = {
        user_id: user.id,
        nama: nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        stok: stok,
        stok_minimum: stokMinimum
    };

    const { data, error } = await supabaseClient
        .from("barang")
        .insert(dataBarang)
        .select()
        .single();

    if (error) {
        console.error(error);
        alert("Gagal menyimpan barang:\n" + error.message);
        return;
    }

    console.log("Barang berhasil:", data);

    alert("Barang berhasil disimpan ke Supabase!\nID: " + data.id);

    resetFormBarang();

    // PENTING: muat ulang barang
    await muatBarang();
}
async function muatBarang() {
    if (!user) {
        console.log("User belum login");
        return;
    }

    const { data, error } = await supabaseClient
        .from("barang")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

    if (error) {
        console.error("Gagal mengambil barang:", error);
        alert("Gagal mengambil data barang:\n" + error.message);
        return;
    }

    console.log("Data barang:", data);

    daftarBarang = data || [];

    tampilkanBarang();
    tampilkanPilihanBarang();
}
function tampilkanBarang() {
    const tabel = document.getElementById("tabelBarang");

    if (!tabel) return;

    tabel.innerHTML = "";

    if (daftarBarang.length === 0) {
        tabel.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    Belum ada barang
                </td>
            </tr>
        `;
        return;
    }

    daftarBarang.forEach(function(barang, index) {

        const status = barang.stok <= barang.stok_minimum
            ? "Stok Menipis"
            : "Aman";

        tabel.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(barang.nama)}</td>
                <td>${rupiah(barang.harga_modal)}</td>
                <td>${rupiah(barang.harga_jual)}</td>
                <td>${barang.stok}</td>
                <td>${status}</td>
                <td>
                    <button onclick="EditBarang(${barang.id})">
                        Edit
                    </button>
                    <button onclick="hapusBarang(${barang.id})">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}
function tampilkanPilihanBarang() {
    const select = document.getElementById("pilihBarang");

    if (!select) return;

    select.innerHTML = `
        <option value="">Pilih barang</option>
    `;

    daftarBarang.forEach(function(barang) {

        if (barang.stok > 0) {
            select.innerHTML += `
                <option value="${barang.id}">
                    ${escapeHTML(barang.nama)}
                    - ${rupiah(barang.harga_jual)}
                    (Stok: ${barang.stok})
                </option>
            `;
        }

    });
}
// ==========================================
// 1. EDIT BARANG
// ==========================================
function editBarang(id) {
    const barang = daftarBarang.find(function(item) {
        return item.id == id;
    });

    if (!barang) {
        alert("Barang tidak ditemukan!");
        return;
    }

    document.getElementById("barangId").value = barang.id;
    document.getElementById("namaBarang").value = barang.nama;
    document.getElementById("hargaModal").value = barang.harga_modal;
    document.getElementById("hargaJual").value = barang.harga_jual;
    document.getElementById("stok").value = barang.stok;
    document.getElementById("stokMinimum").value = barang.stok_minimum;

    document.getElementById("judulFormBarang").textContent =
        "Edit Barang";

    document.getElementById("barang").scrollIntoView({
        behavior: "smooth"
    })
}



// ==========================================
// 3. HAPUS BARANG
// ==========================================
async function hapusBarang(id) {
    const barang = daftarBarang.find(function(item) {
        return item.id == id;
    });

    if (!barang) {
        alert("Barang tidak ditemukan!");
        return;
    }

    const yakin = confirm(
        'Hapus barang "' + barang.nama + '"?'
    );

    if (!yakin) {
        return;
    }

    const { error } = await supabaseClient
        .from("barang")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error(error);

        alert(
            "Gagal menghapus barang:\n" +
            error.message
        );

        return;
    }

    alert("Barang berhasil dihapus!");

    await muatBarang();
}


// ==========================================
// 4. TAMBAH KE KERANJANG
// ==========================================
function tambahKeranjang() {

    const id = document.getElementById(
        "pilihBarang"
    ).value;

    const jumlah = Number(
        document.getElementById(
            "jumlahBeli"
        ).value
    );

    if (!id) {
        alert("Pilih barang terlebih dahulu!");
        return;
    }

    if (jumlah <= 0) {
        alert("Jumlah harus lebih dari 0!");
        return;
    }

    const barang = daftarBarang.find(function(item) {
        return item.id == id;
    });

    if (!barang) {
        alert("Barang tidak ditemukan!");
        return;
    }

    // Cek apakah barang sudah ada di keranjang
    const sudahAda = keranjang.find(function(item) {
        return item.barang_id == barang.id;
    });

    const jumlahSekarang = sudahAda
        ? sudahAda.jumlah + jumlah
        : jumlah;

    // Cek stok
    if (jumlahSekarang > barang.stok) {
        alert(
            "Stok tidak cukup!\n\n" +
            "Stok tersedia: " +
            barang.stok
        );

        return;
    }

    // Jika sudah ada di keranjang
    if (sudahAda) {

        sudahAda.jumlah += jumlah;

        sudahAda.subtotal =
            sudahAda.jumlah *
            sudahAda.harga;

    }

    // Jika belum ada
    else {

        keranjang.push({
            barang_id: barang.id,
            nama: barang.nama,
            harga: Number(barang.harga_jual),
            modal: Number(barang.harga_modal),
            jumlah: jumlah,
            subtotal:
                Number(barang.harga_jual) *
                jumlah
        });

    }

    tampilkanKeranjang();

    document.getElementById(
        "jumlahBeli"
    ).value = 1;
}


// ==========================================
// 5. TAMPILKAN KERANJANG
// ==========================================
function tampilkanKeranjang() {

    const tabel = document.getElementById(
        "tabelKeranjang"
    );

    const totalElement = document.getElementById(
        "totalKasir"
    );

    if (!tabel) {
        return;
    }

    tabel.innerHTML = "";

    let total = 0;

    keranjang.forEach(function(item, index) {

        total += item.subtotal;

        tabel.innerHTML += `
            <tr>
                <td>
                    ${escapeHTML(item.nama)}
                </td>

                <td>
                    ${rupiah(item.harga)}
                </td>

                <td>
                    ${item.jumlah}
                </td>

                <td>
                    ${rupiah(item.subtotal)}
                </td>

                <td>
                    <button
                        onclick="hapusKeranjang(${index})"
                    >
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });

    if (keranjang.length === 0) {

        tabel.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="text-align:center;"
                >
                    Keranjang masih kosong
                </td>
            </tr>
        `;
    }

    totalElement.textContent = rupiah(total);

    hitungKembalian();
}


// ==========================================
// 6. HAPUS DARI KERANJANG
// ==========================================
function hapusKeranjang(index) {

    keranjang.splice(index, 1);

    tampilkanKeranjang();
}


// ==========================================
// 7. HITUNG KEMBALIAN
// ==========================================
function hitungKembalian() {

    let total = 0;

    keranjang.forEach(function(item) {

        total += item.subtotal;

    });

    const uang = Number(
        document.getElementById(
            "uangBayar"
        ).value
    ) || 0;

    const kembalian = uang - total;

    document.getElementById(
        "kembalian"
    ).textContent = rupiah(
        Math.max(0, kembalian)
    );
}
// ============================================
// EDIT BARANG
// ============================================
function editBarang(id) {
    const barang = daftarBarang.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!barang) {
        alert("Barang tidak ditemukan!");
        return;
    }

    bukaHalaman("barang");

    document.getElementById("barangId").value = barang.id;
    document.getElementById("namaBarang").value = barang.nama;
    document.getElementById("hargaModal").value = barang.harga_modal;
    document.getElementById("hargaJual").value = barang.harga_jual;
    document.getElementById("stok").value = barang.stok;
    document.getElementById("stokMinimum").value = barang.stok_minimum;

    document.getElementById("judulFormBarang").textContent =
        "Edit Barang";

    setTimeout(function() {
        document.getElementById("barang").scrollIntoView({
            behavior: "smooth"
        });
    }, 100);
}


// ============================================
// SIMPAN / UPDATE BARANG
// ============================================
async function simpanBarang() {
    if (!user) {
        alert("Belum login!");
        return;
    }

    const id = document.getElementById("barangId").value;
    const nama = document.getElementById("namaBarang").value.trim();
    const hargaModal = Number(
        document.getElementById("hargaModal").value
    );
    const hargaJual = Number(
        document.getElementById("hargaJual").value
    );
    const stok = Number(
        document.getElementById("stok").value
    );
    const stokMinimum = Number(
        document.getElementById("stokMinimum").value
    );

    if (!nama) {
        alert("Nama barang wajib diisi!");
        return;
    }

    if (
        hargaModal < 0 ||
        hargaJual < 0 ||
        stok < 0 ||
        stokMinimum < 0
    ) {
        alert("Data tidak boleh negatif!");
        return;
    }

    const dataBarang = {
        nama: nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        stok: stok,
        stok_minimum: stokMinimum
    };

    let hasil;

    if (id) {

        hasil = await supabaseClient
            .from("barang")
            .update(dataBarang)
            .eq("id", id)
            .eq("user_id", user.id);

    } else {

        dataBarang.user_id = user.id;

        hasil = await supabaseClient
            .from("barang")
            .insert(dataBarang);
    }

    if (hasil.error) {
        console.error(hasil.error);

        alert(
            "Gagal menyimpan:\n" +
            hasil.error.message
        );

        return;
    }

    alert(
        id
            ? "Barang berhasil diperbarui!"
            : "Barang berhasil ditambahkan!"
    );

    resetFormBarang();

    await muatBarang();
}


// ============================================
// HAPUS BARANG
// ============================================
async function hapusBarang(id) {
    const barang = daftarBarang.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!barang) {
        alert("Barang tidak ditemukan!");
        return;
    }

    const yakin = confirm(
        'Hapus barang "' + barang.nama + '"?'
    );

    if (!yakin) {
        return;
    }

    const { error } = await supabaseClient
        .from("barang")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error(error);

        alert(
            "Gagal menghapus barang:\n" +
            error.message
        );

        return;
    }

    alert("Barang berhasil dihapus!");

    await muatBarang();
}


// ============================================
// TAMBAH KE KERANJANG
// ============================================
function tambahKeranjang() {
    const id = document.getElementById("pilihBarang").value;

    const jumlah = Number(
        document.getElementById("jumlahBeli").value
    );

    if (!id) {
        alert("Pilih barang terlebih dahulu!");
        return;
    }

    if (jumlah <= 0) {
        alert("Jumlah harus lebih dari 0!");
        return;
    }

    const barang = daftarBarang.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!barang) {
        alert("Barang tidak ditemukan!");
        return;
    }

    const sudahAda = keranjang.find(function(item) {
        return String(item.barang_id) === String(barang.id);
    });

    const jumlahSekarang = sudahAda
        ? sudahAda.jumlah + jumlah
        : jumlah;

    if (jumlahSekarang > Number(barang.stok)) {
        alert(
            "Stok tidak cukup!\n\n" +
            "Stok tersedia: " + barang.stok
        );

        return;
    }

    if (sudahAda) {

        sudahAda.jumlah += jumlah;

        sudahAda.subtotal =
            sudahAda.jumlah * sudahAda.harga;

    } else {

        keranjang.push({
            barang_id: barang.id,
            nama: barang.nama,
            harga: Number(barang.harga_jual),
            modal: Number(barang.harga_modal),
            jumlah: jumlah,
            subtotal:
                Number(barang.harga_jual) * jumlah
        });
    }

    tampilkanKeranjang();

    document.getElementById("jumlahBeli").value = 1;
}


// ============================================
// TAMPILKAN KERANJANG
// ============================================
function tampilkanKeranjang() {
    const tabel = document.getElementById("tabelKeranjang");
    const totalElement = document.getElementById("totalKasir");

    if (!tabel) {
        return;
    }

    tabel.innerHTML = "";

    let total = 0;

    keranjang.forEach(function(item, index) {

        total += Number(item.subtotal);

        tabel.innerHTML += `
            <tr>
                <td>${escapeHTML(item.nama)}</td>
                <td>${rupiah(item.harga)}</td>
                <td>${item.jumlah}</td>
                <td>${rupiah(item.subtotal)}</td>
                <td>
                    <button onclick="hapusKeranjang(${index})">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });

    if (keranjang.length === 0) {
        tabel.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Keranjang masih kosong
                </td>
            </tr>
        `;
    }

    totalElement.textContent = rupiah(total);

    hitungKembalian();
}


// ============================================
// HAPUS DARI KERANJANG
// ============================================
function hapusKeranjang(index) {
    keranjang.splice(index, 1);

    tampilkanKeranjang();
}


// ============================================
// HITUNG KEMBALIAN
// ============================================
function hitungKembalian() {
    let total = 0;

    keranjang.forEach(function(item) {
        total += Number(item.subtotal);
    });

    const uang = Number(
        document.getElementById("uangBayar").value
    ) || 0;

    const kembalian = uang - total;

    document.getElementById("kembalian").textContent =
        rupiah(Math.max(0, kembalian));
}


// ============================================
// PROSES & SIMPAN TRANSAKSI
// ============================================
async function prosesTransaksi() {
    if (!user) {
        alert("Belum login!");
        return;
    }

    if (keranjang.length === 0) {
        alert("Keranjang masih kosong!");
        return;
    }

    let total = 0;
    let modal = 0;

    keranjang.forEach(function(item) {
        total += Number(item.subtotal);

        modal +=
            Number(item.modal) *
            Number(item.jumlah);
    });

    const uangBayar = Number(
        document.getElementById("uangBayar").value
    ) || 0;

    if (uangBayar < total) {
        alert(
            "Uang pembayaran kurang!\n\n" +
            "Total: " + rupiah(total) + "\n" +
            "Dibayar: " + rupiah(uangBayar)
        );

        return;
    }

    const keuntungan = total - modal;

    // SIMPAN TRANSAKSI
    const namaCustomer =
    document.getElementById("namaCustomer").value.trim() || "Umum";

const { data: transaksi, error: errorTransaksi } =
    await supabaseClient
        .from("transaksi")
        .insert({
            user_id: user.id,
            nama_customer: namaCustomer,
            total,
            modal,
            keuntungan
        })
        .select()
        .single();

    if (errorTransaksi) {
        console.error(errorTransaksi);

        alert(
            "Gagal menyimpan transaksi:\n" +
            errorTransaksi.message
        );

        return;
    }

    // SIMPAN DETAIL
    const detail = keranjang.map(function(item) {

        const modalItem =
            Number(item.modal) *
            Number(item.jumlah);

        return {
            transaksi_id: transaksi.id,
            user_id: user.id,
            barang_id: item.barang_id,
            nama_barang: item.nama,
            harga: item.harga,
            jumlah: item.jumlah,
            subtotal: item.subtotal,
            modal: modalItem,
            keuntungan:
                Number(item.subtotal) - modalItem
        };
    });

    const {
        error: errorDetail
    } = await supabaseClient
        .from("detail_transaksi")
        .insert(detail);

    if (errorDetail) {
        console.error(errorDetail);

        alert(
            "Transaksi tersimpan, tetapi detail gagal:\n" +
            errorDetail.message
        );

        return;
    }

    // KURANGI STOK
    for (const item of keranjang) {

        const barang = daftarBarang.find(function(b) {
            return String(b.id) === String(item.barang_id);
        });

        if (!barang) {
            continue;
        }

        const stokBaru =
            Number(barang.stok) -
            Number(item.jumlah);

        const {
            error: errorStok
        } = await supabaseClient
            .from("barang")
            .update({
                stok: stokBaru
            })
            .eq("id", item.barang_id)
            .eq("user_id", user.id);

        if (errorStok) {
            console.error(errorStok);

            alert(
                "Transaksi tersimpan, tetapi stok gagal diperbarui:\n" +
                errorStok.message
            );

            return;
        }
    }

    alert(
        "Transaksi berhasil!\n\n" +
        "Total: " + rupiah(total) + "\n" +
        "Bayar: " + rupiah(uangBayar) + "\n" +
        "Kembalian: " +
        rupiah(uangBayar - total) + "\n" +
        "Keuntungan: " + rupiah(keuntungan)
    );

    keranjang = [];

    document.getElementById("uangBayar").value = "";
  document.getElementById("namaCustomer").value = "";

    tampilkanKeranjang();

    await muatBarang();

    await muatTransaksi();
}


// ============================================
// AMBIL DATA TRANSAKSI
// ============================================
async function muatTransaksi() {
    if (!user) {
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("transaksi")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);

        alert(
            "Gagal mengambil laporan:\n" +
            error.message
        );

        return;
    }

    tampilkanLaporan(data || []);
}


// ============================================
// TAMPILKAN LAPORAN
// ============================================
function tampilkanLaporan(data) {
    let omzet = 0;
    let modal = 0;
    let keuntungan = 0;

    data.forEach(function(transaksi) {
        omzet += Number(transaksi.total) || 0;
        modal += Number(transaksi.modal) || 0;
        keuntungan += Number(transaksi.keuntungan) || 0;
    });

    document.getElementById("laporanOmzet").textContent = rupiah(omzet);
    document.getElementById("laporanModal").textContent = rupiah(modal);
    document.getElementById("laporanUntung").textContent = rupiah(keuntungan);
    document.getElementById("laporanTransaksi").textContent = data.length;

    const tabel = document.getElementById("tabelLaporan");

    if (!tabel) return;

    tabel.innerHTML = "";

    if (data.length === 0) {
        tabel.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Belum ada transaksi
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(function(transaksi, index) {

        const tanggal = new Date(
            transaksi.created_at
        ).toLocaleString("id-ID");

        const namaCustomer =
            transaksi.nama_customer || "Umum";

        tabel.innerHTML += `
            <tr>
                <td>${index + 1}</td>

                <td>
                    ${escapeHTML(namaCustomer)}
                </td>

                <td>
                    ${tanggal}
                </td>

                <td>
                    ${rupiah(transaksi.total)}
                </td>

                <td>
                    ${rupiah(transaksi.modal)}
                </td>

                <td>
                    ${rupiah(transaksi.keuntungan)}
                </td>
            </tr>
        `;
    });
}

// ============================================
// PINDAH HALAMAN
// ============================================
function bukaHalaman(namaHalaman) {

    const halaman = [
        "dashboard",
        "barang",
        "kasir",
        "laporan"
    ];

    halaman.forEach(function(id) {

        const el =
            document.getElementById(id);

        if (el) {
            el.classList.add("hidden");
        }
    });

    const target =
        document.getElementById(namaHalaman);

    if (target) {
        target.classList.remove("hidden");
    }

    // Refresh laporan
    if (namaHalaman === "laporan") {
        muatTransaksi();
    }

    // Refresh barang saat masuk kasir
    if (namaHalaman === "kasir") {
        muatBarang();
    }
}