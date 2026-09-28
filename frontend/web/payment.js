// Function to format number with thousand separators (Ví dụ: 50000 -> 50.000)
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("user_name");
  const amountInput = document.getElementById("amount");
  const methodSelect = document.getElementById("method");

  const qrBox = document.getElementById("qrBox");
  const qrImg = document.getElementById("qrImg");

  const sName = document.getElementById("s_name");
  const sAmount = document.getElementById("s_amount");
  const sMethod = document.getElementById("s_method");
  const sTime = document.getElementById("s_time");

  // Lấy thẻ hình ảnh thành công
  const paymentSuccessImage = document.getElementById("payment_success_image");

  const createQRBtn = document.getElementById("createQRBtn");
  const confirmBtn = document.getElementById("confirmPaymentBtn");

  // --- TẠO MÃ QR ---
  createQRBtn.addEventListener("click", () => {
    let name = nameInput.value.trim();
    let amount = amountInput.value.trim();
    let method = methodSelect.value;

    // Kiểm tra tính hợp lệ của số tiền
    if (!name || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Vui lòng nhập họ tên và số tiền hợp lệ!");
      return;
    }

    // Tự động viết hoa chữ cái đầu của mỗi từ trong họ tên (cải thiện UX)
    name = name.toLowerCase().split(' ').map((word) => {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');

    const qrData = `PAYMENT|NAME=${name}|AMOUNT=${amount}|METHOD=${method}`;

    QRCode.toDataURL(qrData, { width: 250 }).then((url) => {
      qrImg.src = url;
      qrBox.classList.remove("hide");
    });

    sName.textContent = name;
    sAmount.textContent = formatNumber(amount); // Dùng hàm format
    sMethod.textContent = method;
    sTime.textContent = new Date().toLocaleString('vi-VN'); // Dùng locale Việt Nam

    // Ẩn hình ảnh thành công khi tạo QR (nếu đã hiển thị)
    paymentSuccessImage.classList.add("hide");
  });

  // --- XÁC NHẬN THANH TOÁN ---
  confirmBtn.addEventListener("click", () => {
    if (sName.textContent === "-") {
      alert("Bạn chưa tạo giao dịch!");
      return;
    }

    // Hiển thị hình ảnh thành công
    paymentSuccessImage.classList.remove("hide");

    // Hiệu ứng thông báo thành công
    const msg = document.createElement("div");
    msg.className = "success-popup";
    msg.innerHTML = `
      <div class="popup-content">
        <h2>✔ Thanh toán thành công!</h2>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của UNILIB.</p>
        <p style="margin-top:20px; color:#7a33ec; font-weight:600;">(Hệ thống sẽ chuyển hướng bạn về Trang chủ sau 3 giây)</p>
      </div>
    `;
    document.body.appendChild(msg);

    // Tự tắt sau 3.8s và chuyển hướng về trang chủ (3 giây + 0.8 giây của animation popup)
    setTimeout(() => {
      msg.remove();
      // Giả lập chuyển về trang chủ sau khi xác nhận thanh toán
      window.location.href = "index.html";
    }, 3800); 
  });
});