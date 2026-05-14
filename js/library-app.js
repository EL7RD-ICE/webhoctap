/**
 * Library App Logic
 * Xử lý fetch danh sách bài học và render Markdown từ Firestore.
 */

(function () {
  "use strict";

  // Cấu hình Markdown Renderer
  if (typeof marked !== "undefined") {
    marked.setOptions({
      gfm: true,
      breaks: true,
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    });
  }

  /* 
     HƯỚNG DẪN TÍCH HỢP KATEX (TOÁN HỌC):
     1. Thêm CDN CSS & JS của KaTeX vào <head> và cuối <body>.
     2. Sử dụng thư viện 'marked-katex-extension' hoặc regex để bắt các ký tự $$...$$ hoặc $...$.
     3. Gọi katex.render(formula, element) cho mỗi khối toán học đã bắt được.
  */

  const LESSONS_COLLECTION = "lessons";
  let db = null;

  /**
   * Seed Data: Thêm bài học mẫu nếu library trống
   */
  async function seedLibrary() {
    if (!db) return;
    try {
      const snap = await db.collection(LESSONS_COLLECTION).limit(1).get();
      if (!snap.empty) return; // Đã có dữ liệu

      const samples = [
        {
          title: "Giải tích: Đạo hàm và ứng dụng",
          subject: "Toán học",
          content: "# Đạo hàm và Ý nghĩa hình học\n\nĐạo hàm của hàm số $y=f(x)$ tại điểm $x_0$ biểu thị tốc độ thay đổi của hàm số.\n\n### 1. Công thức cơ bản\n- $(x^n)' = n.x^{n-1}$\n- $(\\sin x)' = \\cos x$\n- $(\\cos x)' = -\\sin x$\n\n### 2. Ví dụ\nTính đạo hàm của $y = x^2$ tại $x=3$.\n$y' = 2x \\Rightarrow y'(3) = 6$.",
          privacy: "public",
          author: "system"
        },
        {
          title: "Vật lý: Định luật Bảo toàn Năng lượng",
          subject: "Vật lý",
          content: "# Năng lượng và Công\n\nNăng lượng không tự nhiên sinh ra cũng không tự nhiên mất đi.\n\n### Cơ năng\n$$W = \\frac{1}{2}mv^2 + mgh$$\n\n```python\n# Tính thế năng\ndef potential_energy(m, g, h):\n    return m * g * h\n```",
          privacy: "public",
          author: "system"
        },
        {
          title: "Vật lý: Lực hướng tâm",
          subject: "Vật lý",
          content: "# Lực hướng tâm ($F_{ht}$)\n\nLực hướng tâm là lực hướng vào tâm quỹ đạo, giúp vật duy trì chuyển động tròn.\n\n### 1. Công thức tính\n\n$$F_{ht} = m \\cdot \\frac{v^2}{r} = m \\cdot \\omega^2 \\cdot r$$\n\n**Trong đó:**\n- $m$: khối lượng của vật (kg)\n- $v$: vận tốc dài (m/s)\n- $\\omega$: vận tốc góc (rad/s)\n- $r$: bán kính quỹ đạo (m)\n\n### 2. Ý nghĩa\nLực hướng tâm không phải là một lực mới mà là hợp lực của các lực tác dụng lên vật, gây ra gia tốc hướng tâm.",
          privacy: "public",
          author: "system"
        },
        {
          title: "Sinh học: Mã di truyền và Protein",
          subject: "Sinh học",
          content: "# Mã di truyền (Genetic Code)\n\nMã di truyền là trình tự sắp xếp các nucleotide trong gene quy định trình tự các amino acid trong protein.\n\n### Đặc điểm của mã di truyền:\n1. **Mã bộ ba:** Cứ 3 nucleotide kế tiếp mã hóa cho 1 amino acid.\n2. **Tính phổ biến:** Hầu hết các loài đều dùng chung một bộ mã di truyền.\n3. **Tính đặc hiệu:** Một bộ ba chỉ mã hóa cho duy nhất 1 loại amino acid.\n\n> **Thông tin thú vị:** Bộ ba AUG vừa là mã mở đầu, vừa mã hóa cho Methionine.",
          privacy: "public",
          author: "system"
        },
        {
          title: "Địa lý: Hệ Mặt Trời và các Hành tinh",
          subject: "Địa lý",
          content: "# Khám phá Hệ Mặt Trời\n\nHệ Mặt Trời gồm Mặt Trời ở trung tâm và các thiên thể quay quanh nó.\n\n### Các hành tinh theo thứ tự xa dần Mặt Trời:\n1. **Sao Thủy** (Mercury)\n2. **Sao Kim** (Venus)\n3. **Trái Đất** (Earth)\n4. **Sao Hỏa** (Mars)\n5. **Sao Mộc** (Jupiter) - *Hành tinh lớn nhất*\n6. **Sao Thổ** (Saturn) - *Có vành đai rực rỡ*\n7. **Sao Thiên Vương** (Uranus)\n8. **Sao Hải Vương** (Neptune)",
          privacy: "public",
          author: "system"
        },
        {
          title: "Ngữ văn: Tác phẩm 'Tắt đèn' - Ngô Tất Tố",
          subject: "Ngữ văn",
          content: "# Tắt đèn (Ngô Tất Tố)\n\nMột trong những tác phẩm tiêu biểu nhất của trào lưu văn học hiện thực phê phán Việt Nam trước 1945.\n\n### 1. Nhân vật chính: Chị Dậu\n- Đại diện cho hình ảnh người phụ nữ nông dân nghèo khổ nhưng giàu tình yêu thương và tiềm năng phản kháng.\n- Phân đoạn tiêu biểu: Tức nước vỡ bờ.\n\n### 2. Giá trị nhân đạo\n- Tố cáo tội ác của chế độ thực dân nửa phong kiến.\n- Ca ngợi vẻ đẹp tâm hồn của người nông dân.",
          privacy: "public",
          author: "system"
        },
        {
          title: "Tiếng Anh: Passive Voice (Câu bị động)",
          subject: "Tiếng Anh",
          content: "# Passive Voice - Câu bị động\n\nCấu trúc: **S + be + V3/ed + (by O)**\n\n- *Active:* They built this house in 1990.\n- *Passive:* This house was built in 1990.",
          privacy: "public",
          author: "system"
        },
        {
          title: "Hóa học: Bảng tuần hoàn Mendeleev",
          subject: "Hóa học",
          content: "# Bảng tuần hoàn\n\n- **Nhóm IA:** Kim loại kiềm (Li, Na, K...)\n- **Nhóm VIIA:** Halogen (F, Cl, Br, I...)\n- **Nhóm VIIIA:** Khí hiếm (He, Ne, Ar...)",
          privacy: "public",
          author: "system"
        }
      ];

      const batch = db.batch();
      samples.forEach(s => {
        const ref = db.collection(LESSONS_COLLECTION).doc();
        batch.set(ref, s);
      });
      await batch.commit();
      loadSidebar();
    } catch (e) {
      console.warn("Seeding error:", e);
    }
  }

  function initFirestore() {
    if (window.__firestoreDb) {
      db = window.__firestoreDb;
      return true;
    }
    if (typeof firebase === "undefined") return false;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.HOCVIET_FIREBASE_CONFIG || {});
      }
      db = firebase.firestore();
      window.__firestoreDb = db;
      return true;
    } catch (e) {
      console.error("Lỗi khởi tạo Firestore:", e);
      return false;
    }
  }

  // Script Global references
  let elTree, elArticle, elEmpty, elTitle, elSubject, elContent, elBtnFocus, elBtnFocusClose, elSearchInput;

  function initUi() {
    elTree = document.getElementById("lib-tree");
    elArticle = document.getElementById("lib-article");
    elEmpty = document.getElementById("lib-content-empty");
    elTitle = document.getElementById("lib-title");
    elSubject = document.getElementById("lib-subject");
    elContent = document.getElementById("lib-content");
    elBtnFocus = document.getElementById("lib-focus-toggle");
    elBtnFocusClose = document.getElementById("lib-focus-close");
    elSearchInput = document.getElementById("lib-search");

    if (elSearchInput) {
      elSearchInput.addEventListener("input", filterSidebar);
    }

    if (elBtnFocus) {
      elBtnFocus.addEventListener("click", () => toggleFocus(true));
    }
    if (elBtnFocusClose) {
      elBtnFocusClose.addEventListener("click", () => toggleFocus(false));
    }

    // Delegation cho sidebar
    elTree.addEventListener("click", (e) => {
      const btn = e.target.closest(".lib-item");
      if (!btn) return;
      showLesson(btn.dataset.id, btn);
    });
  }

  /**
   * Tìm kiếm bài học trong sidebar
   */
  function filterSidebar() {
    const val = (elSearchInput.value || "").toLowerCase();
    const items = elTree.querySelectorAll(".lib-item");
    const groups = elTree.querySelectorAll(".lib-group");

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(val) ? "" : "none";
    });

    groups.forEach(group => {
      const visibleItems = group.querySelectorAll('.lib-item[style=""]');
      group.style.display = visibleItems.length > 0 ? "" : "none";
    });
  }

  if (elSearchInput) {
    elSearchInput.addEventListener("input", filterSidebar);
  }

  /**
   * Toggle Chế độ tập trung
   */
  function toggleFocus(on) {
    if (on) {
      document.body.classList.add("lib-focus-mode");
    } else {
      document.body.classList.remove("lib-focus-mode");
    }
  }

  if (elBtnFocus) {
    elBtnFocus.addEventListener("click", () => toggleFocus(true));
  }
  if (elBtnFocusClose) {
    elBtnFocusClose.addEventListener("click", () => toggleFocus(false));
  }
  
  // Esc để thoát focus mode
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleFocus(false);
    }
  });

  /**
   * Tải danh sách bài học và hiển thị ở sidebar
   */
  async function loadSidebar() {
    if (!initFirestore()) return;

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    try {
      // Query lấy bài học công khai
      const publicSnap = await db.collection(LESSONS_COLLECTION)
        .where("privacy", "==", "public")
        .get();

      // Query lấy bài học riêng tư của chính user
      let privateSnap = { docs: [] };
      if (user) {
        privateSnap = await db.collection(LESSONS_COLLECTION)
          .where("author", "==", user)
          .where("privacy", "==", "private")
          .get();
      }

      const allDocs = [...publicSnap.docs, ...privateSnap.docs];

      if (allDocs.length === 0) {
        elTree.innerHTML = '<div class="lib-loading">Chưa có bài học nào. Đang nạp dữ liệu mẫu...</div>';
        seedLibrary();
        return;
      }

      const groups = {};
      allDocs.forEach((doc) => {
        const d = doc.data();
        const sub = d.subject || "Khác";
        if (!groups[sub]) groups[sub] = [];
        groups[sub].push({ id: doc.id, ...d });
      });

      let html = "";
      Object.keys(groups).sort().forEach((sub) => {
        html += `<div class="lib-group">
          <div class="lib-group__title">${sub}</div>
          <div class="lib-group__items">
            ${groups[sub].map((lesson) => 
              `<button type="button" class="lib-item ${lesson.privacy === 'private' ? 'lib-item--private' : ''}" data-id="${lesson.id}">
                ${lesson.privacy === 'private' ? '<span class="lib-item__lock">🔒</span> ' : ''}
                ${lesson.title}
              </button>`
            ).join("")}
          </div>
        </div>`;
      });

      elTree.innerHTML = html;
    } catch (e) {
      console.error("Lỗi tải danh sách bài học:", e);
      elTree.innerHTML = '<div class="lib-loading" style="color:red">Lỗi tải dữ liệu.</div>';
    }
  }

  /**
   * Hiển thị nội dung một bài học
   */
  async function showLesson(id, btn) {
    if (!id || !db) return;

    // UI Feedback
    document.querySelectorAll(".lib-item--active").forEach(el => el.classList.remove("lib-item--active"));
    if (btn) btn.classList.add("lib-item--active");

    try {
      const doc = await db.collection(LESSONS_COLLECTION).doc(id).get();
      if (!doc.exists) return;

      const d = doc.data();
      elTitle.textContent = d.title || "Không tiêu đề";
      elSubject.textContent = d.subject || "Chung";
      
      // Render Markdown
      const rawHtml = marked.parse(d.content || "");
      // Sanitize XSS
      const cleanHtml = typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(rawHtml) : rawHtml;
      
      elContent.innerHTML = cleanHtml;
      
      // Show content
      elEmpty.hidden = true;
      elArticle.hidden = false;

      // Track achievement
      if (window.AchievementEngine && typeof getCurrentUser === "function") {
        const user = getCurrentUser();
        if (user) window.AchievementEngine.trackLessonRead(user);
      }

      // Cuộn lên đầu
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (e) {
      console.error("Lỗi hiển thị bài học:", e);
      alert("Không thể tải nội dung bài học.");
    }
  }

  // Khởi chạy khi DOM sẵn sàng
  document.addEventListener("DOMContentLoaded", () => {
    initUi();
    loadSidebar();
  });

})();
