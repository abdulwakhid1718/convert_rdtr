// inisialisasi
const app = firebase.initializeApp(firebaseConfig);

// Ubah data
const dataKeterangan = document.querySelector('[data-input="dataKeterangan"]');
const simpan = document.querySelector('[data-button="simpan"]');

if (document.location.pathname.includes("rubah.html")) {
  firebase
    .database()
    .ref("data")
    .once("value")
    .then((snapshot) => {
      const data = snapshot.val();
      if (data && data.dataKeterangan) {
        dataKeterangan.value = data.dataKeterangan;
      }
    })
    .catch((error) => {
      Swal.fire({
        title: "Gagal menampilkan data!",
        text: error,
        icon: "error",
        customClass: "swal-sm",
      });
    });
}

simpan.onclick = () => {
  firebase
    .database()
    .ref("data")
    .update({
      dataKeterangan: dataKeterangan.value,
    })
    .then(() => {
      Swal.fire({
        title: "Berhasil",
        text: "Data berhasil tersimpan",
        icon: "success",
        customClass: "swal-sm",
      });
    })
    .catch((error) => {
      Swal.fire({
        title: "Gagal menyimpan data!",
        text: error,
        icon: "error",
        customClass: "swal-sm",
      });
    });
};
