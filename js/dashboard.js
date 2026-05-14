/**
 * Dashboard Logic
 * Quản lý đề thi của user và hiển thị huy hiệu.
 */
(function () {
  "use strict";

  function ensureFirestore() {
    if (window.__firestoreDb) return window.__firestoreDb;
    if (typeof firebase === "undefined") return null;
    var c = window.HOCVIET_FIREBASE_CONFIG;
    try {
      if (!firebase.apps.length) firebase.initializeApp(c);
      var db = firebase.firestore();
      try {
        db.settings({ experimentalForceLongPolling: true });
      } catch(e) {}
      window.__firestoreDb = db;
      return window.__firestoreDb;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  var examListBody = document.getElementById("exam-list-body");
  var badgeCollection = document.getElementById("badge-collection");
  var userStatsEl = document.getElementById("user-stats");
  var statusEl = document.getElementById("dashboard-status");

  var currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : "";

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.className = "converter-status" + (kind ? " converter-status--" + kind : "");
    if (msg) setTimeout(() => (statusEl.textContent = ""), 5000);
  }

  async function loadDashboard() {
    var db = ensureFirestore();
    if (!db || !currentUser) {
      if (examListBody) examListBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Vui lòng đặt tên hiển thị để xem dashboard.</td></tr>';
      return;
    }

    document.getElementById("user-greeting-text").textContent = "Xin chào, " + currentUser;

    // 1. Load Exams
    try {
      var snap = await db.collection("exams")
        .where("createdBy", "==", currentUser)
        .orderBy("createdAt", "desc")
        .get();

      if (snap.empty) {
        examListBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Bạn chưa tạo đề thi nào.</td></tr>';
      } else {
        examListBody.innerHTML = "";
        snap.docs.forEach(doc => {
          var d = doc.data();
          var tr = document.createElement("tr");
          tr.innerHTML = `
            <td><strong>${escapeHtml(d.title)}</strong></td>
            <td>${escapeHtml(d.subject)}</td>
            <td>
              <span class="status-pill ${d.isActive !== false ? 'status-pill--active' : 'status-pill--inactive'}">
                ${d.isActive !== false ? 'Hoạt động' : 'Đã ẩn'}
              </span>
            </td>
            <td>${d.attemptCount || 0}</td>
            <td class="action-btns">
              <div class="action-menu">
                <button class="menu-trigger" data-id="${doc.id}">⋮</button>
                <div class="menu-dropdown" id="dropdown-${doc.id}">
                  <button class="menu-item btn-edit" data-id="${doc.id}">✏️ Chỉnh sửa</button>
                  <a href="bang-vang.html?id=${doc.id}" class="menu-item" style="text-decoration: none;">🏆 Kết quả</a>
                  <button class="menu-item menu-item--danger btn-delete" data-id="${doc.id}">🗑️ Xóa đề thi</button>
                </div>
              </div>
            </td>
          `;
          examListBody.appendChild(tr);
        });
      }
    } catch (e) {
      console.error(e);
      setStatus("Lỗi tải danh sách đề thi: " + e.message, "err");
    }

    // 2. Load Achievements
    try {
      var achDoc = await db.collection("userAchievements").doc(currentUser).get();
      var earnedBadges = [];
      var stats = { totalQuizzes: 0, lessonsRead: 0 };
      
      if (achDoc.exists) {
        var data = achDoc.data();
        earnedBadges = data.badges || [];
        stats.totalQuizzes = data.totalQuizzes || 0;
        stats.lessonsRead = data.lessonsRead || 0;
      }

      // Render Badges
      if (badgeCollection && window.HOCVIET_ACHIEVEMENTS_CONFIG) {
        badgeCollection.innerHTML = "";
        window.HOCVIET_ACHIEVEMENTS_CONFIG.forEach(b => {
          var isEarned = earnedBadges.includes(b.id);
          var div = document.createElement("div");
          div.className = `badge-item ${isEarned ? 'badge-item--unlocked' : 'badge-item--locked'}`;
          div.title = b.description;
          div.innerHTML = `
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
          `;
          badgeCollection.appendChild(div);
        });
      }

      // Render Stats
      if (userStatsEl) {
        userStatsEl.innerHTML = `
          <ul style="list-style: none; padding: 0; font-size: 0.875rem; color: #475569;">
            <li style="margin-bottom: 8px;">📚 Đề đã làm: <strong>${stats.totalQuizzes}</strong></li>
            <li style="margin-bottom: 8px;">📖 Bài học đã đọc: <strong>${stats.lessonsRead}</strong></li>
            <li style="margin-bottom: 8px;">🏅 Huy hiệu: <strong>${earnedBadges.length}</strong> / ${window.HOCVIET_ACHIEVEMENTS_CONFIG.length}</li>
          </ul>
        `;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Handle actions
  if (examListBody) {
    examListBody.addEventListener("click", async function (e) {
      var id = e.target.dataset.id;
      
      // Toggle dropdown
      if (e.target.classList.contains("menu-trigger")) {
        // Close other dropdowns
        document.querySelectorAll('.menu-dropdown--open').forEach(el => {
          if (el.id !== 'dropdown-' + id) el.classList.remove('menu-dropdown--open');
        });
        document.getElementById('dropdown-' + id)?.classList.toggle('menu-dropdown--open');
        return;
      }

      if (!id) return;

      // Close all dropdowns when an item is clicked
      document.querySelectorAll('.menu-dropdown--open').forEach(el => el.classList.remove('menu-dropdown--open'));

      if (e.target.classList.contains("btn-delete")) {
        if (confirm("Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) {
          try {
            var db = ensureFirestore();
            await db.collection("exams").doc(id).delete();
            setStatus("Đã xóa đề thi thành công.", "ok");
            loadDashboard();
          } catch (err) {
            setStatus("Lỗi khi xóa: " + err.message, "err");
          }
        }
      }

      if (e.target.classList.contains("btn-edit")) {
        window.location.href = `de-thi-ai.html?edit=${id}`;
      }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.classList.contains('menu-trigger')) {
        document.querySelectorAll('.menu-dropdown--open').forEach(el => el.classList.remove('menu-dropdown--open'));
      }
    });
  }

  document.getElementById("btn-logout-db")?.addEventListener("click", () => {
    document.cookie = "userName=; max-age=0; path=/;";
    window.location.href = 'index.html';
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDashboard);
  } else {
    loadDashboard();
  }
})();
