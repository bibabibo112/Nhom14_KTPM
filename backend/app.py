import os
import sys
from flask import Flask, jsonify, request, send_from_directory, make_response, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
try:
    from faq_service import find_best_answer
    print("Đã import chatbot từ faq_service.py thành công!")
except ImportError as e:
    print(f"⚠️ Lỗi import faq.py: {e}")
    print("⚠️ Sử dụng chatbot đơn giản thay thế")
    
    # Hàm thay thế nếu import lỗi
    def find_best_answer(message, threshold=0.0):
        faq_data = {
            "mượn sách": "Tìm sách và bấm nút Mượn sách.",
            "trả sách": "Vào mục Đã mượn, bấm nút Trả.",
            "thời gian mượn": "30 ngày.",
        }
        message = message.lower()
        for q, a in faq_data.items():
            if q in message:
                return a, 1.0
        return "Xin lỗi, tôi chưa hiểu câu hỏi.", 0.0

# ===================== FLASK SETUP =====================
app = Flask(__name__)
CORS(app, supports_credentials=True)

app.secret_key = "super_secret_key"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

# ===================== CORS HEADERS =====================
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route("/<path:path>", methods=["OPTIONS"])
@app.route("/", methods=["OPTIONS"])
def options_handler(path=None):
    return '', 200

# ===================== DATABASE SETUP =====================
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
os.makedirs(INSTANCE_DIR, exist_ok=True)

DB_PATH = os.path.join(INSTANCE_DIR, "data.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ===================== MODEL =====================
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    author = db.Column(db.String(255))
    description = db.Column(db.Text)
    isbn = db.Column(db.String(100))
    image = db.Column(db.String(500))
    available = db.Column(db.Boolean, default=True)
    file_path = db.Column(db.String(500))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class BorrowRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    borrow_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime, nullable=True)
    returned = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='borrow_records')
    book = db.relationship('Book', backref='borrow_records')

# ===================== INIT DATABASE =====================
with app.app_context():
    db.create_all()
    print(f"📘 Database initialized at: {DB_PATH}")

# ===================== AUTH API =====================
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Thiếu tên đăng nhập hoặc mật khẩu!"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Tên người dùng đã tồn tại!"}), 400

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "Đăng ký thành công!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"status": "error", "message": "Tài khoản không tồn tại!"}), 401

    if user.check_password(password):
        session["user_id"] = user.id
        session["username"] = username
        return jsonify({
            "status": "success", 
            "message": "Đăng nhập thành công!", 
            "user_id": user.id,
            "username": username
        }), 200
    else:
        return jsonify({"status": "error", "message": "Sai mật khẩu!"}), 401

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    session.pop("username", None)
    return jsonify({"status": "success", "message": "Đã đăng xuất"})

@app.route("/check-auth", methods=["GET"])
def check_auth():
    if "user_id" in session:
        return jsonify({
            "status": "success",
            "user_id": session["user_id"],
            "username": session.get("username", "")
        })
    return jsonify({"status": "error"}), 401

# ===================== BOOKS API =====================
@app.route("/borrow", methods=["POST"])
def borrow_book():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Chưa đăng nhập"}), 401

    user_id = session["user_id"]
    data = request.get_json()

    book_id = data.get("book_id")
    if book_id:
        book = db.session.get(Book, book_id)
        if not book or not book.available:
            return jsonify({"status": "error", "message": "Sách không khả dụng"}), 400
    else:
        title = data.get("title")
        author = data.get("author")
        image = data.get("image")
        isbn = data.get("isbn")

        if not title or not author:
            return jsonify({"status": "error", "message": "Thiếu thông tin sách"}), 400

        book = Book.query.filter_by(isbn=isbn).first() if isbn else None
        if not book:
            book = Book.query.filter_by(title=title, author=author).first()
        
        if not book:
            book = Book(
                title=title,
                author=author,
                image=image,
                isbn=isbn,
                available=True
            )
            db.session.add(book)
            db.session.commit()
        elif not book.available:
            return jsonify({"status": "error", "message": "Sách đang được mượn"}), 400

    existing = BorrowRecord.query.filter_by(user_id=user_id, book_id=book.id, returned=False).first()
    if existing:
        return jsonify({"status": "error", "message": "Bạn đã mượn sách này rồi!"}), 400

    borrow = BorrowRecord(user_id=user_id, book_id=book.id, borrow_date=datetime.utcnow())
    book.available = False
    db.session.add(borrow)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Mượn sách thành công!",
        "book_id": book.id,
        "borrow_id": borrow.id
    })

@app.route("/return", methods=["POST"])
def return_book():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Chưa đăng nhập"}), 401

    data = request.get_json()
    book_id = data.get("book_id")

    try:
        book_id = int(book_id)
    except:
        return jsonify({"status": "error", "message": "book_id không hợp lệ"}), 400

    record = BorrowRecord.query.filter_by(
        user_id=session["user_id"], 
        book_id=book_id, 
        returned=False
    ).first()

    if not record:
        return jsonify({"status": "error", "message": "Không tìm thấy sách đã mượn"}), 400

    record.returned = True
    record.return_date = datetime.utcnow()

    book = db.session.get(Book, book_id)
    if book:
        book.available = True

    db.session.commit()
    return jsonify({"status": "success", "message": "Trả sách thành công!"}), 200

@app.route("/api/user/borrowed-count", methods=["GET"])
def get_borrowed_count():
    if "user_id" not in session:
        return jsonify({"count": 0})
    
    user_id = session["user_id"]
    count = BorrowRecord.query.filter_by(user_id=user_id, returned=False).count()
    return jsonify({"count": count})

@app.route("/api/user/borrowed-books", methods=["GET"])
def get_borrowed_books():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Chưa đăng nhập"}), 401
    
    user_id = session["user_id"]
    
    records = BorrowRecord.query.filter_by(
        user_id=user_id, 
        returned=False
    ).join(Book, BorrowRecord.book_id == Book.id).all()
    
    borrowed_books = []
    for record in records:
        borrowed_books.append({
            "book_id": record.book.id,
            "title": record.book.title,
            "author": record.book.author,
            "image": record.book.image,
            "borrow_date": record.borrow_date.isoformat() if record.borrow_date else None,
            "borrow_id": record.id
        })
    
    return jsonify({
        "status": "success",
        "books": borrowed_books
    })
#CHATBOT

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # ✅ Lời chào đặc biệt
    if message.lower() in ["xin chào", "chào", "hello", "hi"]:
        return jsonify({
            "reply": "Xin chào mình là Trợ lý ảo UniLib! Mình có thể giúp gì cho bạn?",
            "source": "greeting",
            "confidence": 1.0
        })

    # ✅ GỌI FAQ: luôn lấy câu giống nhất, không chặn bởi threshold bên trong
    # Sau đó tự kiểm tra score ở đây để hỗ trợ cả câu hỏi chỉ có vài keyword
    answer, score = find_best_answer(message, threshold=0.0)

    # Ngưỡng chấp nhận: chỉ cần giống vừa phải là trả lời
    # Bạn có thể chỉnh 0.30 -> 0.25 hoặc 0.35 tùy mức muốn "dễ tính" hay không
    MIN_SCORE = 0.30

    if answer and score >= MIN_SCORE:
        return jsonify({
            "reply": answer,
            "source": "local",
            "confidence": score
        })

    # ❌ Không đủ giống -> báo chưa có dữ liệu
    return jsonify({
        "reply": "Xin lỗi, hiện tại mình chưa có dữ liệu cho câu hỏi này.",
        "source": "none",
        "confidence": float(score)
    })
# ===================== STATIC FILES =====================
@app.route("/")
def serve_index():
    return send_from_directory(os.path.join(BASE_DIR, "../frontend"), "SignUp_LogIn_Form.html")

@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory(os.path.join(BASE_DIR, "../frontend"), path)

# ===================== MAIN =====================
if __name__ == "__main__":
    print("UniLib backend running on http://localhost:3000")
    app.run(host="0.0.0.0", port=3000, debug=True)