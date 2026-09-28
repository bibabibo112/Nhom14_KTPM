(function () {
  function injectStyles(primaryColor) {
    const style = document.createElement("style");
    style.innerHTML = `
      .cbt-launcher {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, ${primaryColor}, #6a5af9);
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        color: #fff;
        font-size: 26px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .cbt-window {
        position: fixed;
        right: 24px;
        bottom: 96px;
        width: 380px;
        max-height: 560px;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .cbt-header {
        padding: 14px 16px;
        background: radial-gradient(circle at top left, ${primaryColor}, #1d293b);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .cbt-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .cbt-avatar {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        background: rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }

      .cbt-title {
        font-weight: 600;
        font-size: 15px;
      }

      .cbt-status {
        font-size: 11px;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .cbt-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #22c55e;
      }

      .cbt-close-btn {
        background: transparent;
        border: none;
        color: #e2e8f0;
        font-size: 20px;
        cursor: pointer;
      }

      .cbt-messages {
        flex: 1;
        padding: 12px 14px;
        background: radial-gradient(circle at top left, #1f2937, #020617);
        overflow-y: auto;
      }

      .cbt-msg-row {
        margin-bottom: 10px;
        display: flex;
      }

      .cbt-msg-row.user {
        justify-content: flex-end;
      }

      .cbt-bubble {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 14px;
        font-size: 13px;
        line-height: 1.4;
        color: #e2e8f0;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.4);
      }

      .cbt-bubble.user {
        background: linear-gradient(135deg, ${primaryColor}, #6a5af9);
        border-bottom-right-radius: 4px;
      }

      .cbt-bubble.bot {
        background: rgba(15,23,42,0.9);
        border: 1px solid rgba(148,163,184,0.3);
        border-bottom-left-radius: 4px;
      }

      .cbt-input-area {
        padding: 10px;
        background: #0b1120;
        border-top: 1px solid rgba(15,23,42,0.9);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cbt-input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid #1e293b;
        background: #020617;
        color: #e5e7eb;
        font-size: 13px;
        outline: none;
      }

      .cbt-input::placeholder {
        color: #64748b;
      }

      .cbt-send-btn {
        padding: 8px 14px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, ${primaryColor}, #6a5af9);
        color: #fff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .cbt-send-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .cbt-footer-note {
        font-size: 10px;
        text-align: center;
        padding: 4px 8px 8px;
        color: #94a3b8;
        background: #020617;
      }

      @media (max-width: 480px) {
        .cbt-window {
          right: 8px;
          left: 8px;
          width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createChatbot(config) {
    const backendUrl = config.backendUrl;
    const primaryColor = config.primaryColor || "#2563eb";
    const title = config.title || "Library Assistant";

    injectStyles(primaryColor);

    const launcher = document.createElement("button");
    launcher.className = "cbt-launcher";
    launcher.innerHTML = "💬";
    document.body.appendChild(launcher);

    const win = document.createElement("div");
    win.className = "cbt-window";
    win.innerHTML = `
      <div class="cbt-header">
        <div class="cbt-header-left">
          <div class="cbt-avatar">📚</div>
          <div>
            <div class="cbt-title">${title}</div>
            <div class="cbt-status">
              <span class="cbt-dot"></span>
              <span>Online - Hỗ trợ thư viện</span>
            </div>
          </div>
        </div>
        <button class="cbt-close-btn">&times;</button>
      </div>
      <div class="cbt-messages"></div>
      <div class="cbt-input-area">
        <input class="cbt-input" type="text" placeholder="Nhập câu hỏi của bạn về thư viện..." />
        <button class="cbt-send-btn">
          <span>Gửi</span>
          <span>➤</span>
        </button>
      </div>
      <div class="cbt-footer-note">
        Gợi ý: hỏi về giờ mở cửa, mượn sách, gia hạn, tiền phạt, tài liệu điện tử...
      </div>
    `;
    document.body.appendChild(win);

    const closeBtn = win.querySelector(".cbt-close-btn");
    const messagesDiv = win.querySelector(".cbt-messages");
    const inputEl = win.querySelector(".cbt-input");
    const sendBtn = win.querySelector(".cbt-send-btn");

    let isOpen = false;
    let isSending = false;

    function setOpen(open) {
      isOpen = open;
      win.style.display = isOpen ? "flex" : "none";
      if (isOpen) {
        inputEl.focus();
      }
    }

    launcher.addEventListener("click", () => {
      setOpen(!isOpen);
    });

    closeBtn.addEventListener("click", () => {
      setOpen(false);
    });

    function appendMessage(text, isUser) {
      const row = document.createElement("div");
      row.className = "cbt-msg-row " + (isUser ? "user" : "bot");

      const bubble = document.createElement("div");
      bubble.className = "cbt-bubble " + (isUser ? "user" : "bot");
      bubble.textContent = text;

      row.appendChild(bubble);
      messagesDiv.appendChild(row);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage() {
      const text = inputEl.value.trim();
      if (!text || isSending) return;

      appendMessage(text, true);
      inputEl.value = "";
      inputEl.focus();

      isSending = true;
      sendBtn.disabled = true;

      const loadingRow = document.createElement("div");
      loadingRow.className = "cbt-msg-row bot";
      const loadingBubble = document.createElement("div");
      loadingBubble.className = "cbt-bubble bot";
      loadingBubble.textContent = "Đang tra cứu dữ liệu thư viện cho bạn...";
      loadingRow.appendChild(loadingBubble);
      messagesDiv.appendChild(loadingRow);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      try {
        const res = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        loadingRow.remove();

        if (data.reply) {
          appendMessage(data.reply, false);
        } else {
          appendMessage(
            "Hiện tại mình không nhận được phản hồi từ hệ thống, bạn thử lại sau nhé.",
            false
          );
        }
      } catch (err) {
        loadingRow.remove();
        appendMessage(
          "Không kết nối được tới máy chủ chatbot. Vui lòng kiểm tra lại đường truyền hoặc backend.",
          false
        );
      } finally {
        isSending = false;
        sendBtn.disabled = false;
      }
    }

    sendBtn.addEventListener("click", sendMessage);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });

    // Lời chào ban đầu
    appendMessage(
      "Xin chào! Mình là trợ lý thư viện. Bạn có thể hỏi mình về giờ mở cửa, mượn sách, gia hạn, tiền phạt, tài liệu điện tử và nhiều thứ khác.",
      false
    );

    // Trả về API để có thể điều khiển từ ngoài
    return {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen(!isOpen),
    };
  }

  window.initChatbotWidget = createChatbot;
})();
