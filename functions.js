function copyToClipboard() {
  var copyText = document.getElementById("jsondata");
  if (copyText.value.trim() === "") {
    // Jika teks area kosong, tidak melakukan apa-apa
    return;
  } else {
    copyText.select();
    document.execCommand("copy");
    // Menampilkan pesan copied
    Swal.fire({
      title: "Berhasil",
      text: "text JSON berhasil disalin!",
      icon: "success",
      customClass: "swal-sm",
    });

    // Menghilangkan pesan setelah beberapa detik
    setTimeout(function () {
      copiedMessage.remove();
    }, 3000);
  }
}

function toggleFullscreen() {
  var textarea = document.getElementById("jsondata");
  if (!document.fullscreenElement) {
    textarea.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
