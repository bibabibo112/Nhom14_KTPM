import json
import os
import re
from difflib import SequenceMatcher

# SỬA DÒNG NÀY: Tìm faq.json trong instance folder
DATA_PATH = os.path.join(os.path.dirname(__file__), "instance", "faq.json")

print(f"🔍 Đang tìm faq.json tại: {DATA_PATH}")

def load_faq():
    try:
        # Kiểm tra file có tồn tại không
        if not os.path.exists(DATA_PATH):
            print(f"❌ Không tìm thấy file: {DATA_PATH}")
            print("⚠️ Sử dụng FAQ mặc định")
            return get_default_faq()
        
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"✅ Đã tải {len(data)} câu hỏi từ faq.json")
            return data
            
    except json.JSONDecodeError as e:
        print(f"❌ Lỗi đọc JSON: {e}")
        return get_default_faq()
    except Exception as e:
        print(f"❌ Lỗi không xác định: {e}")
        return get_default_faq()

def get_default_faq():
    """FAQ mặc định nếu không đọc được file"""
    return [
        {"question": "mượn sách", "answer": "Tìm sách và bấm Mượn sách."},
        {"question": "trả sách", "answer": "Vào mục Đã mượn, bấm Trả."},
        {"question": "thời gian mượn", "answer": "30 ngày."}
    ]

FAQ_DATA = load_faq()

def normalize(text: str) -> str:
    """
    Chuẩn hoá text:
    - chuyển về chữ thường
    - bỏ ký tự đặc biệt, giữ chữ cái, số, dấu tiếng Việt và khoảng trắng
    - gom nhiều khoảng trắng về 1
    """
    text = text.lower()
    # giữ chữ cái, số, dấu tiếng Việt cơ bản và khoảng trắng
    text = re.sub(r"[^0-9a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def tokens(text: str):
    return set(normalize(text).split())

def char_similarity(a: str, b: str) -> float:
    """Độ giống theo ký tự (chuỗi)"""
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

def token_overlap(a: str, b: str) -> float:
    """
    Độ giống theo từ: Jaccard similarity
    = (tập từ chung) / (tập từ hợp)
    """
    ta = tokens(a)
    tb = tokens(b)
    if not ta or not tb:
        return 0.0
    inter = ta.intersection(tb)
    union = ta.union(tb)
    return len(inter) / len(union)

def combined_similarity(user_msg: str, question: str) -> float:
    """
    Kết hợp:
    - 60% giống chuỗi
    - 40% giống theo từ
    + bonus nếu câu hỏi chứa cụm từ của nhau
    """
    s_char = char_similarity(user_msg, question)
    s_tok = token_overlap(user_msg, question)

    score = 0.6 * s_char + 0.4 * s_tok

    u_norm = normalize(user_msg)
    q_norm = normalize(question)

    # Nếu một bên là "cụm con" của bên kia → cộng thêm điểm
    if u_norm in q_norm or q_norm in u_norm:
        score += 0.15

    # Giới hạn max 1.0
    return min(score, 1.0)

def find_best_answer(user_message: str, threshold: float = 0.4):
    """
    Tìm câu trả lời tốt nhất trong FAQ với:
    - so sánh tương đồng chuỗi + từ khóa
    - nếu score >= threshold → xem là match
    """
    if not FAQ_DATA:
        return None, 0.0
    
    best_score = 0.0
    best_answer = None

    for item in FAQ_DATA:
        q = item["question"]
        score = combined_similarity(user_message, q)

        if score > best_score:
            best_score = score
            best_answer = item["answer"]

    if best_score >= threshold:
        return best_answer, best_score
    return None, 0.0

# Test nếu chạy riêng file này
if __name__ == "__main__":
    print(f"🔢 Số câu hỏi đã tải: {len(FAQ_DATA)}")
    print("🧪 Testing...")
    
    test_questions = ["giờ mở cửa", "mượn sách", "wifi thư viện"]
    for q in test_questions:
        ans, score = find_best_answer(q, 0.3)
        if ans:
            print(f"❓ '{q}' -> 💡 '{ans[:50]}...' (score: {score:.3f})")
        else:
            print(f"❓ '{q}' -> ❌ Không tìm thấy (score: {score:.3f})")