// Ambil elemen select
const selectKecamatan = document.getElementById("select-kecamatan");

let kecamatan = [];
fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/3526.json`)
  .then((response) => response.json())
  .then((districts) => {
    // Mengurutkan kecamatan berdasarkan nama
    districts.sort((a, b) => a.name.localeCompare(b.name));
    // Isi option dengan data kecamatan yang sudah diurutkan
    districts.forEach((kecamatan) => {
      const option = document.createElement("option");
      let namaKecamatan = kecamatan.name;
      option.text = capitalizeFirstLetter(namaKecamatan.toLowerCase());
      selectKecamatan.add(option);
    });
  });

// -------------------------------------------------------------------------------------------------

let selectedFile;
let jsonData = [];
let sheetDuaJson = [];
let kolomZona = [];
let ket;
let DKPZ = [];

// Date
let currentDate = new Date();
let formattedDate =
  currentDate.getFullYear() +
  ("0" + (currentDate.getMonth() + 1)).slice(-2) +
  ("0" + currentDate.getDate()).slice(-2);

// inisialisasi firebase
const app = firebase.initializeApp(firebaseConfig);

// Fungsi untuk menampilkan loading
const loadingOverlay = document.getElementById("loading-overlay");

const showLoading = () => (loadingOverlay.style.display = "flex");

// Fungsi untuk menyembunyikan loading
const hideLoading = () => (loadingOverlay.style.display = "none");

firebase
  .database()
  .ref("data")
  .once("value")
  .then((snapshot) => {
    // Mendapatkan nilai data dari snapshot
    const data = snapshot.val();

    // Memasukkan data ke dalam objek mapping
    // ket = '{"I": "Diizinkan", "T1": "Pembatasan waktu operasional sesuai aturan yang berlaku", "T2": "Pembatasan intensitas ruang, baik KDB, KLB, KDH, jarak bebas, maupun ketinggian bangunan, dengan menurunkan nilai maksimum dan meninggikan nilai minimum dari angka intensitas ruang yang ditetapkan dalam peraturan zonasi", "T3": "Pembatasan jumlah pemanfaatan yang tidak sesuai dengan zona/sub zona peruntukan tidak lebih dari 20%", "T4": "Pembatasan luasan kavling suatu kegiatan di dalam zona dengan mempertimbangkan persetujuan dan rekomendasi teknis dari instansi terkait", "B1": "Wajib menyusun dokumen analisis dampak lingkungan dan analisis dampak lalu lintas", "B2": "Wajib menyediakan parkir yang memenuhi standar serta menyediakan prasarana pendukung kegiatan sesuai ketentuan peraturan perundang-undangan yang berlaku", "B3": "Wajib memiliki ijin pemanfaatan lahan pertanian tanaman pangan serta lahan hutan dari lembaga teknis terkait menurut peraturan yang berlaku", "X": "Tidak diizinkan"}'
    ket = "{" + data.dataKeterangan.replace(/\n/g, "") + "}";

    // Sekarang Anda dapat menggunakan objek mapping sesuai kebutuhan
    console.log("'{\n", data.dataKeterangan, "\n}'");
    console.log(ket);
    // console.log(data && data.dataKeterangan);
  })
  .catch((error) => {
    console.error("Gagal mengambil data:", error);
  });

// mengambil file excel yang diupload user
document.getElementById("input").addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
});

document.getElementById("btn-convert").addEventListener("click", () => {
  // Tampilkan alert gagal apabila user belum upload file
  if (selectedFile == null) {
    Swal.fire({
      title: "Konversi Gagal",
      text: "Mohon upload file Excel terlebih dahulu!",
      icon: "error",
      customClass: "swal-sm",
    });
    return;
  }

  showLoading();
  // Menghapus data array sebelumnya
  jsonData = [];
  sheetDuaJson = [];
  let bgnDataArray = {};

  const mapping = JSON.parse(ket);
  console.log(mapping);

  if (selectedFile) {
    let arrayJalan = [
      "Jalan Arteri Primer",
      "Jalan Kolektor Primer",
      "Jalan Lokal Primer",
      "Jalan Lingkungan Primer",
    ];

    let fileReader = new FileReader();
    fileReader.readAsBinaryString(selectedFile);

    fileReader.onload = (event) => {
      let data = event.target.result;
      let workbook = XLSX.read(data, {
        type: "binary",
      });

      workbook.SheetNames.forEach((sheet, key) => {
        // Ambil data sebagai rowObject
        let rowObject = XLSX.utils.sheet_to_row_object_array(
          workbook.Sheets[sheet]
        );

        if (key === 0) {
          let data1 = ["iznktg", "tbtktg", "bsttkg", "tbsktg"];
          // Ambil nama kolom dari baris pertama
          kolomZona = Object.keys(rowObject[0]);

          // Iterasi untuk setiap kolom, dimulai dari kolom kedua (indeks 1)
          for (let i = 5; i < kolomZona.length; i++) {
            let kolomNama = kolomZona[i];

            // Buat struktur JSON yang diinginkan
            let jsonStructure = {};
            jsonStructure[kolomNama] = {};

            bgnDataArray[kolomNama] = {
              bgnizn: {
                data: [],
              },
              bgntbt: {
                data: [],
              },
              bgntbs: {
                data: [],
              },
              bgnbst: {
                data: [],
              },
            };

            console.log(kolomNama);

            data1.forEach(function (prop) {
              jsonStructure[kolomNama][prop] = {
                data: [],
              };
            });

            // Ulangi rowObject dan isi jsonStructure
            rowObject.forEach((row) => {
              let no = row[kolomZona[0]]; // Menggunakan nilai dari kolom pertama (indeks 0)
              let ba = row[kolomNama];

              // Menambahkan leading zeros untuk membuat nomor menjadi 3 digit
              const paddedNo = String(no).padStart(3, "0");

              if (ba) {
                // Hapus angka dan koma, dan gabungkan menjadi satu string tanpa spasi
                const cleanedString = ba
                  .replace(/[0-9,]/g, "")
                  .replace(/\s/g, "");

                // Pisahkan string menjadi array karakter
                const characters = cleanedString.split("");

                // Cek pola huruf 'B' dan 'T'
                const hasB = characters.includes("B");
                const hasT = characters.includes("T");
                const hasI = characters.includes("I");

                // Pecah nilai jika terdapat koma
                const values = ba.split(",").map((val) => val.trim());

                const convertedValues = values.map(
                  (val) => mapping[val] || val
                );

                if (hasI) {
                  jsonStructure[kolomNama]["iznktg"]["data"].push({
                    [paddedNo || "-"]: convertedValues,
                  });
                  bgnDataArray[kolomNama].bgnizn.data.push(paddedNo);
                } else if (hasB && !hasT) {
                  jsonStructure[kolomNama]["bsttkg"]["data"].push({
                    [paddedNo || "-"]: convertedValues,
                  });
                  bgnDataArray[kolomNama].bgnbst.data.push(paddedNo);
                } else if (hasT && !hasB) {
                  jsonStructure[kolomNama]["tbtktg"]["data"].push({
                    [paddedNo || "-"]: convertedValues,
                  });
                  bgnDataArray[kolomNama].bgntbt.data.push(paddedNo);
                } else if (hasB && hasT) {
                  jsonStructure[kolomNama]["tbsktg"]["data"].push({
                    [paddedNo || "-"]: convertedValues,
                  });
                  bgnDataArray[kolomNama].bgntbs.data.push(paddedNo);
                }
                // console.log(bgnDataArray[kolomNama].bgnizn);
              }
            });
            jsonData.push(jsonStructure);
          }

          // DKPZ
          rowObject.forEach((row) => {
            const obj = {
              id_kegiatan: String(row[kolomZona[0]]) || "-",
              kegiatan: String(row[kolomZona[1]]) || "-",
              "KBLI 3 Digit":
                row[kolomZona[2]] !== undefined
                  ? String(row[kolomZona[2]])
                  : "-",
              "KBLI 4 Digit":
                row[kolomZona[3]] !== undefined
                  ? String(row[kolomZona[3]])
                  : "-",
              "KBLI 5 Digit":
                row[kolomZona[4]] !== undefined
                  ? String(row[kolomZona[4]])
                  : "-",
              nilai_kbli: {
                data: {
                  tiga_digit:
                    row[kolomZona[2]] !== undefined
                      ? String(row[kolomZona[2]])
                      : "-",
                  empat_digit:
                    row[kolomZona[3]] !== undefined
                      ? String(row[kolomZona[3]])
                      : "-",
                  lima_digit:
                    row[kolomZona[4]] !== undefined
                      ? String(row[kolomZona[4]])
                      : "-",
                },
              },
            };
            DKPZ.push(obj);
          });
          // console.log(bgnDataArray);
        } else if (key === 1) {
          // Ubah data Excel menjadi format JSON yang diinginkan
          kolomZona = kolomZona.filter(
            (column) =>
              !column.toLowerCase().includes("kode") &&
              !column.toLowerCase().includes("kegiatan") &&
              !column.toLowerCase().includes("3 digit") &&
              !column.toLowerCase().includes("4 digit") &&
              !column.toLowerCase().includes("5 digit")
          );

          kolomZona.forEach((kolom) => {
            const obj = {
              nilai_kolom_unik: kolom,
              kdb: {
                data: {},
              },
              klb: {
                data: {},
              },
              kdh: {
                data: {},
              },
              ktb: {
                data: {},
              },
            };

            rowObject.forEach((row, i) => {
              let values = row[kolom];
              // values = values === "-" ? 0 : values;
              let indexJalan = i % arrayJalan.length;
              if (i < 4) {
                obj.kdb.data[arrayJalan[indexJalan]] = values;
              } else if (i >= 4 && i < 8) {
                obj.klb.data[arrayJalan[indexJalan]] = values;
              } else if (i >= 8 && i < 12) {
                obj.kdh.data[arrayJalan[indexJalan]] = values;
              } else if (i >= 12 && i < 16) {
                obj.ktb.data[arrayJalan[indexJalan]] = values;
              }
              indexJalan++;
            });
            sheetDuaJson.push(obj);
          });
        } else if (key === 2) {
          kolomZona.forEach((kolom, i) => {
            index = i;
            const fields = ["bgnizn", "bgntbt", "bgntbs", "bgnbst"];

            fields.forEach((field) => {
              sheetDuaJson[i][field] = bgnDataArray[kolom][field];

              if (sheetDuaJson[i][field].data === "") {
                sheetDuaJson[i][field].data = "-";
              }
            });

            sheetDuaJson[i].ktgbgn = {
              data: {
                "Ketinggian Bangunan": {},
              },
            };

            sheetDuaJson[i].gsb = {
              data: {},
            };

            rowObject.forEach((row, i) => {
              let values = row[kolom];
              // values = values === "-" ? 0 : values;
              let indexJalan = i % arrayJalan.length;
              if (i < 4) {
                sheetDuaJson[index].ktgbgn.data["Ketinggian Bangunan"][
                  arrayJalan[indexJalan]
                ] = values;
              } else if (i >= 4 && i < 8) {
                sheetDuaJson[index].gsb.data[arrayJalan[indexJalan]] = values;
              }
              indexJalan++;
            });
          });
          console.log(sheetDuaJson);
        }
      });

      setTimeout(function () {
        // Tampilkan JSON yang dihasilkan
        document.getElementById("jsondata").innerHTML = JSON.stringify(
          jsonData,
          undefined,
          4
        );
        hideLoading(); // Menyembunyikan loading setelah selesai konversi
      }, 500);
    };
  }
});

document.getElementById("btn-download-json").addEventListener("click", () => {
  // Tampilkan alert gagal apabila user mengklik download sebelum melakukan konversi
  if (jsonData.length == 0) {
    Swal.fire({
      title: "Download Gagal",
      text: "Mohon lakukan konversi JSON terlebih dahulu!",
      icon: "error",
      customClass: "swal-sm",
    });
    return;
  }

  // Ubah objek JSON menjadi string
  const jsonString = JSON.stringify(jsonData, undefined, 4);

  // Buat blob dari string JSON
  const blob = new Blob([jsonString], {
    type: "application/json",
  });

  // Buat elemen <a> untuk tautan unduhan
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);

  // Menyusun nama file dengan menambahkan tanggal yang sudah diformat
  a.download =
    "DBPZ_WP" + selectKecamatan.value + "_" + formattedDate + "_update.json";

  // Simulasikan klik pada elemen <a>
  a.click();
});

document.getElementById("btn-download-excel").addEventListener("click", () => {
  if (sheetDuaJson.length == 0 && jsonData.length != 0) {
    Swal.fire({
      title: "Download Gagal",
      text: "Sheet 2 tidak ditemukan, mohon cek kembali file excelnya!",
      icon: "error",
      customClass: "swal-sm",
    });
    return;
  }

  // Tampilkan alert gagal apabila user mengklik download sebelum melakukan konversi
  if (jsonData.length == 0) {
    Swal.fire({
      title: "Download Gagal",
      text: "Mohon lakukan konversi JSON terlebih dahulu!",
      icon: "error",
      customClass: "swal-sm",
    });
    return;
  }

  // Membuat array dari objek untuk memperoleh nama kolom
  const columns = Object.keys(sheetDuaJson[0]);

  // Membuat array 2D dari data objek
  const rows = sheetDuaJson.map((item) =>
    columns.map((column) => {
      if (typeof item[column] === "object") {
        // Jika nilai kolom adalah objek, konversi menjadi string JSON
        return JSON.stringify(item[column]);
      } else {
        return item[column];
      }
    })
  );

  // Membuat workbook dan worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);

  // Menambahkan worksheet ke dalam workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Mengonversi workbook ke dalam format blob
  XLSX.writeFile(
    workbook,
    "DBPZ_WP" + selectKecamatan.value + "_" + formattedDate + "_update.xlsx",
    {
      bookType: "xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );
});

// DKPZ
document
  .getElementById("btn-download-excel-DK")
  .addEventListener("click", () => {
    // Tampilkan alert gagal apabila user mengklik download sebelum melakukan konversi
    if (DKPZ.length == 0) {
      Swal.fire({
        title: "Download Gagal",
        text: "Mohon lakukan konversi JSON terlebih dahulu!",
        icon: "error",
        customClass: "swal-sm",
      });
      return;
    }

    // Membuat array dari objek untuk memperoleh nama kolom
    const columns = Object.keys(DKPZ[0]);

    // Membuat array 2D dari data objek
    const rows = DKPZ.map((item) =>
      columns.map((column) => {
        if (typeof item[column] === "object") {
          // Jika nilai kolom adalah objek, konversi menjadi string JSON
          return JSON.stringify(item[column]);
        } else {
          return item[column];
        }
      })
    );

    // Membuat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);

    // Menambahkan worksheet ke dalam workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Mengonversi workbook ke dalam format blob
    XLSX.writeFile(
      workbook,
      "DKPZ_WP" + selectKecamatan.value + "_" + formattedDate + "_update.xlsx",
      {
        bookType: "xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );
  });
