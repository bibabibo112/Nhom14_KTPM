const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// Chuyển đổi giữa Form Đăng ký và Form Đăng nhập
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// Hàm hiển thị thông báo Toast
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#e74c3c" : "#4CAF50"; // Đỏ nếu lỗi, xanh nếu OK
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
}

// =========================================================
// BỔ SUNG: Xử lý Đăng nhập và Chuyển hướng sang main.html
// =========================================================

// Lấy element form đăng nhập (nhớ đặt id="login-form" cho thẻ <form> trong HTML)
const loginForm = document.querySelector('.form-box.login form'); 

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Chống reload lại trang khi bấm submit

        // Thêm logic gọi API Backend hoặc kiểm tra thông tin của bạn ở đây
        // Ví dụ giả định đăng nhập thành công:
        const isSuccess = true; 

        if (isSuccess) {
            // 1. Lưu trạng thái đã đăng nhập vào LocalStorage
            localStorage.setItem('isLoggedIn', 'true');

            // 2. Thông báo cho người dùng
            showToast("Đăng nhập thành công! Đang chuyển hướng...");

            // 3. Chuyển hướng sang trang main.html sau 1.5 giây
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1500);
        } else {
            showToast("Tài khoản hoặc mật khẩu không chính xác!", true);
        }
    });
}
