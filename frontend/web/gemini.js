// ==========================
// 🤖 TÍCH HỢP GEMINI API GOOGLE
// ==========================
const API_KEY = "AIzaSyDwXDzlPsud9YW8WYQoRevF8culgSLkiq8"; // 🔹 Dán API key của bạn vào đây
const MODEL = "gemini-1.5-flash"; // Hoặc "gemini-1.5-pro" nếu bạn muốn độ chính xác cao hơn

async function askGemini() {
  const question = document.getElementById("aiQuestion").value.trim();
  const outputDiv = document.getElementById("aiResponse");
  const bookTitle =
    document.getElementById("popupTitle")?.textContent || "chưa rõ";

  if (!question) {
    outputDiv.innerHTML =
      "<p style='color:#777;'>⚠️ Vui lòng nhập câu hỏi!</p>";
    return;
  }

  outputDiv.innerHTML = "<p>⏳ Đang suy nghĩ...</p>";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Người dùng đang hỏi về sách "${bookTitle}". Trả lời ngắn gọn, rõ ràng.\n\nCâu hỏi: ${question}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Xin lỗi, tôi không thể trả lời câu hỏi này.";

    outputDiv.innerHTML = `<p>${formatText(answer)}</p>`;
  } catch (error) {
    console.error("❌ Lỗi API:", error);
    outputDiv.innerHTML = `
      <p style="color:red;">
        ❌ Lỗi API: ${
          error.message.includes("models")
            ? "Model hoặc endpoint không hợp lệ. Hãy chắc chắn bạn đã bật 'Generative Language API' và dùng đúng model 'gemini-1.5-flash'."
            : "Không thể kết nối tới Gemini API."
        }
      </p>`;
  }
}

/* 🎨 Hàm hỗ trợ định dạng Markdown nhẹ */
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // In đậm
    .replace(/\*(.*?)\*/g, "<i>$1</i>") // In nghiêng
    .replace(/\n/g, "<br>"); // Xuống dòng
}
