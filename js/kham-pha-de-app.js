/**
 * Khám phá đề thi: tab mẫu (isOfficial) / cộng đồng (isPublic), phân trang, fork.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 10;

  function ensureFirestore() {
    if (window.__firestoreDb) return window.__firestoreDb;
    if (typeof firebase === "undefined") return null;
    var c = window.HOCVIET_FIREBASE_CONFIG;
    if (!c || !c.apiKey) return null;
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

  /** Icon theo từ khóa môn (Unicode, không phụ thuộc asset). */
  function subjectIcon(subject) {
    var raw = String(subject || "").toLowerCase();
    var s = raw;
    try {
      if (typeof raw.normalize === "function") {
        s = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
    } catch (e) {
      s = raw;
    }
    if (/toan|math/.test(s)) return "🔢";
    if (/van|liter|ngu van/.test(s)) return "📖";
    if (/anh|english|tieng anh/.test(s)) return "🔤";
    if (/hoa|chemistry|hoa hoc/.test(s)) return "🧪";
    if (/ly|physics|vat ly/.test(s)) return "⚡";
    if (/sinh|bio|sinh hoc/.test(s)) return "🧬";
    if (/su|history|lich su/.test(s)) return "📜";
    if (/dia|geo|dia ly/.test(s)) return "🌍";
    if (/tin|cntt|code|tin hoc/.test(s)) return "💻";
    return "📋";
  }

  function formatCreated(ts) {
    if (!ts) return "—";
    if (typeof ts.toDate === "function") {
      try {
        return ts.toDate().toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (e) {
        return "—";
      }
    }
    return String(ts);
  }

  function fmtScore(v) {
    if (v == null || v === "" || Number.isNaN(Number(v))) return null;
    return Number(v).toFixed(1);
  }

  var state = {
    lastOfficial: null,
    lastCommunity: null,
    hasMoreOfficial: false,
    hasMoreCommunity: false,
    loadingOfficial: false,
    loadingCommunity: false
  };

  function setStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg || "";
    el.className = "kpde-status" + (kind ? " kpde-status--" + kind : "");
  }

  function buildQueryOfficial(db, startAfterDoc) {
    var q = db
      .collection("exams")
      .where("isOfficial", "==", true)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE);
    if (startAfterDoc) q = q.startAfter(startAfterDoc);
    return q;
  }

  function buildQueryCommunity(db, startAfterDoc) {
    var q = db
      .collection("exams")
      .where("isPublic", "==", true)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE);
    if (startAfterDoc) q = q.startAfter(startAfterDoc);
    return q;
  }

  function renderCard(doc, opts) {
    opts = opts || {};
    var d = doc.data();
    var title = d.title || "Không tiêu đề";
    var subject = d.subject || "Khác";
    var author = d.createdBy || "—";
    var icon = subjectIcon(subject);
    var statsHtml = "";
    if (opts.showStats) {
      var ac = d.attemptCount;
      var avg = d.averageScore;
      var acStr = ac != null && ac !== "" ? String(ac) : "—";
      var avgStr = fmtScore(avg);
      statsHtml =
        '<div class="kpde-card__stats">' +
        "<span><strong>" +
        escapeHtml(acStr) +
        "</strong> lượt thi</span>" +
        (avgStr != null
          ? "<span>Điểm TB: <strong>" + escapeHtml(avgStr) + "</strong></span>"
          : "") +
        "</div>";
    }
    return (
      '<article class="kpde-card">' +
      '<div class="kpde-card__top">' +
      '<div class="kpde-card__icon" aria-hidden="true">' +
      icon +
      "</div>" +
      '<div class="kpde-card__body">' +
      '<h3 class="kpde-card__title">' +
      escapeHtml(title) +
      "</h3>" +
      '<p class="kpde-card__meta">' +
      escapeHtml(subject) +
      " · Tác giả: " +
      escapeHtml(author) +
      "</p>" +
      '<p class="kpde-card__meta">Cập nhật: ' +
      escapeHtml(formatCreated(d.createdAt)) +
      "</p>" +
      statsHtml +
      "</div></div>" +
      '<div class="kpde-card__actions">' +
      '<button type="button" class="btn btn--primary btn--sm kpde-fork" data-id="' +
      escapeHtml(doc.id) +
      '">Thêm vào thư viện của tôi</button>' +
      "</div></article>"
    );
  }

  function updateMoreButtons() {
    var btnOff = document.getElementById("load-official");
    var btnCom = document.getElementById("load-community");
    if (btnOff) btnOff.style.display = state.hasMoreOfficial ? "" : "none";
    if (btnCom) btnCom.style.display = state.hasMoreCommunity ? "" : "none";
  }

  async function fetchOfficialPage(reset, grid, statusEl, moreBtn) {
    var db = ensureFirestore();
    if (!db) {
      setStatus(statusEl, "Không kết nối được Firestore.", "err");
      return;
    }
    if (state.loadingOfficial) return;
    state.loadingOfficial = true;
    if (moreBtn) moreBtn.disabled = true;
    try {
      if (reset) {
        state.lastOfficial = null;
        grid.innerHTML = "";
      }
      var snap = await buildQueryOfficial(db, state.lastOfficial).get();
      if (snap.empty && reset) {
        grid.innerHTML = '<p class="kpde-empty">Chưa có đề mẫu (isOfficial = true).</p>';
      } else {
        snap.docs.forEach(function (doc) {
          grid.insertAdjacentHTML("beforeend", renderCard(doc, { showStats: false }));
        });
      }
      state.hasMoreOfficial = snap.docs.length === PAGE_SIZE;
      state.lastOfficial = snap.docs.length ? snap.docs[snap.docs.length - 1] : state.lastOfficial;
      if (!snap.docs.length && !reset) state.hasMoreOfficial = false;
      setStatus(statusEl, "", "");
    } catch (e) {
      var msg = e.message || String(e);
      if (msg.indexOf("index") >= 0 || e.code === "failed-precondition") {
        msg +=
          " — Tạo composite index: collection exams, isOfficial ASC, createdAt DESC.";
      }
      setStatus(statusEl, msg, "err");
    } finally {
      state.loadingOfficial = false;
      if (moreBtn) moreBtn.disabled = false;
      updateMoreButtons();
    }
  }

  async function fetchCommunityPage(reset, grid, statusEl, moreBtn) {
    var db = ensureFirestore();
    if (!db) {
      setStatus(statusEl, "Không kết nối được Firestore.", "err");
      return;
    }
    if (state.loadingCommunity) return;
    state.loadingCommunity = true;
    if (moreBtn) moreBtn.disabled = true;
    try {
      if (reset) {
        state.lastCommunity = null;
        grid.innerHTML = "";
      }
      var snap = await buildQueryCommunity(db, state.lastCommunity).get();
      if (snap.empty && reset) {
        grid.innerHTML = '<p class="kpde-empty">Chưa có đề công khai (isPublic = true).</p>';
      } else {
        snap.docs.forEach(function (doc) {
          grid.insertAdjacentHTML("beforeend", renderCard(doc, { showStats: true }));
        });
      }
      state.hasMoreCommunity = snap.docs.length === PAGE_SIZE;
      state.lastCommunity = snap.docs.length ? snap.docs[snap.docs.length - 1] : state.lastCommunity;
      if (!snap.docs.length && !reset) state.hasMoreCommunity = false;
      setStatus(statusEl, "", "");
    } catch (e) {
      var msg = e.message || String(e);
      if (msg.indexOf("index") >= 0 || e.code === "failed-precondition") {
        msg += " — Tạo composite index: collection exams, isPublic ASC, createdAt DESC.";
      }
      setStatus(statusEl, msg, "err");
    } finally {
      state.loadingCommunity = false;
      if (moreBtn) moreBtn.disabled = false;
      updateMoreButtons();
    }
  }

  async function forkExam(docId, statusEl) {
    var db = ensureFirestore();
    var user = typeof getCurrentUser === "function" ? getCurrentUser() : "";
    if (!user) {
      setStatus(statusEl, "Bạn cần đặt tên hiển thị (trang chủ) trước khi fork đề.", "err");
      return;
    }
    if (!db) {
      setStatus(statusEl, "Firestore chưa sẵn sàng.", "err");
      return;
    }
    try {
      var ref = db.collection("exams").doc(docId);
      var snap = await ref.get();
      if (!snap.exists) {
        setStatus(statusEl, "Không tìm thấy đề.", "err");
        return;
      }
      var d = snap.data();
      var nu = {};
      Object.keys(d).forEach(function (k) {
        nu[k] = d[k];
      });
      nu.createdBy = user;
      nu.isPublic = false;
      nu.isOfficial = false;
      nu.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      nu.forkedFrom = docId;
      delete nu.attemptCount;
      delete nu.averageScore;
      await db.collection("exams").add(nu);
      setStatus(statusEl, "Đã thêm bản sao vào thư viện của bạn (exams).", "ok");
    } catch (e) {
      setStatus(statusEl, e.message || String(e), "err");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var tabOfficial = document.getElementById("tab-official");
    var tabCommunity = document.getElementById("tab-community");
    var panelOfficial = document.getElementById("panel-official");
    var panelCommunity = document.getElementById("panel-community");
    var gridOfficial = document.getElementById("grid-official");
    var gridCommunity = document.getElementById("grid-community");
    var statusOfficial = document.getElementById("status-official");
    var statusCommunity = document.getElementById("status-community");
    var btnMoreOfficial = document.getElementById("load-official");
    var btnMoreCommunity = document.getElementById("load-community");
    var globalStatus = document.getElementById("kpde-global-status");

    if (!gridOfficial || !gridCommunity) return;

    function selectTab(which) {
      var isOff = which === "official";
      tabOfficial.setAttribute("aria-selected", isOff ? "true" : "false");
      tabCommunity.setAttribute("aria-selected", !isOff ? "true" : "false");
      panelOfficial.hidden = !isOff;
      panelCommunity.hidden = isOff;
      if (isOff && !gridOfficial.dataset.loaded) {
        gridOfficial.dataset.loaded = "1";
        fetchOfficialPage(true, gridOfficial, statusOfficial, btnMoreOfficial);
      }
      if (!isOff && !gridCommunity.dataset.loaded) {
        gridCommunity.dataset.loaded = "1";
        fetchCommunityPage(true, gridCommunity, statusCommunity, btnMoreCommunity);
      }
    }

    if (tabOfficial) {
      tabOfficial.addEventListener("click", function () {
        selectTab("official");
      });
    }
    if (tabCommunity) {
      tabCommunity.addEventListener("click", function () {
        selectTab("community");
      });
    }

    if (btnMoreOfficial) {
      btnMoreOfficial.addEventListener("click", function () {
        if (!state.hasMoreOfficial) return;
        fetchOfficialPage(false, gridOfficial, statusOfficial, btnMoreOfficial);
      });
    }

    if (btnMoreCommunity) {
      btnMoreCommunity.addEventListener("click", function () {
        if (!state.hasMoreCommunity) return;
        fetchCommunityPage(false, gridCommunity, statusCommunity, btnMoreCommunity);
      });
    }

    gridOfficial.addEventListener("click", function (e) {
      var btn = e.target.closest(".kpde-fork");
      if (!btn) return;
      forkExam(btn.getAttribute("data-id"), globalStatus);
    });
    gridCommunity.addEventListener("click", function (e) {
      var btn = e.target.closest(".kpde-fork");
      if (!btn) return;
      forkExam(btn.getAttribute("data-id"), globalStatus);
    });

    selectTab("official");
  });
})();
