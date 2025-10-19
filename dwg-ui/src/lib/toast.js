import Toastify from "toastify-js";

export function showToast(message, type = "success") {
  const colors = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#2563eb"
  };

  Toastify({
    text: message,
    duration: 2500,
    gravity: "top",
    position: "right",
    backgroundColor: colors[type] || colors.info,
    stopOnFocus: true,
  }).showToast();
}
