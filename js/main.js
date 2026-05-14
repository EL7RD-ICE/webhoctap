(function () {
  "use strict";

  var USER_NAME_MAX_AGE = 60 * 60 * 24 * 30;
  var COOKIE_NAME = "userName";

  var firebaseConfig =
    (typeof window !== "undefined" && window.HOCVIET_FIREBASE_CONFIG) || {
      apiKey: "YOUR_API_KEY",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };

  function setUserNameCookie(rawName) {
    var name = String(rawName || "").trim();
    if (!name) return;
    var encoded = encodeURIComponent(name);
    document.cookie =
      COOKIE_NAME +
      "=" +
      encoded +
      "; max-age=" +
      USER_NAME_MAX_AGE +
      "; path=/; SameSite=Lax";
    localStorage.setItem("hocviet_user_name", name);
  }

  function getUserName() {
    var name = "";
    var parts = document.cookie.split(";");
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (p.indexOf(COOKIE_NAME + "=") === 0) {
        try {
          name = decodeURIComponent(p.substring(COOKIE_NAME.length + 1));
        } catch (e) {
          name = p.substring(COOKIE_NAME.length + 1);
        }
        break;
      }
    }
    if (!name) {
      name = localStorage.getItem("hocviet_user_name") || "";
    }
    return name;
  }

  function getCurrentUser() {
    return getUserName();
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function initFirebase() {
    if (typeof firebase === "undefined") return null;
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
      return null;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      return firebase.firestore();
    } catch (err) {
      console.warn("Firebase chưa khởi tạo:", err);
      return null;
    }
  }

  window.getUserName = getUserName;
  window.getCurrentUser = getCurrentUser;

  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  var yearEl = document.querySelector("[data-year]");
  var revealNodes = document.querySelectorAll("[data-reveal]");

  var backdrop = document.getElementById("welcome-backdrop");
  var welcomeForm = document.getElementById("welcome-form");
  var welcomeName = document.getElementById("welcome-name");
  var welcomeError = document.getElementById("welcome-error");
  var welcomeCancel = document.getElementById("welcome-cancel");
  var navUser = document.getElementById("nav-user");
  var navLogin = document.getElementById("nav-login");
  var userGreetingText = document.getElementById("user-greeting-text");
  var btnDoiTen = document.getElementById("btn-doi-ten");

  var welcomeRequired = false;

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  window.__firestoreDb = initFirebase();

  function setHeaderScrolled() {
    if (!header) return;
    header.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
  }

  setHeaderScrolled();
  window.addEventListener("scroll", setHeaderScrolled, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (backdrop && !backdrop.hidden && !welcomeRequired) {
          closeWelcomeModal();
          e.preventDefault();
          return;
        }
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  } else {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (backdrop && !backdrop.hidden && !welcomeRequired) {
        closeWelcomeModal();
      }
    });
  }

  function applyUserUi(displayName) {
    var name = String(displayName || "").trim();
    if (navUser) navUser.hidden = !name;
    if (navLogin) navLogin.hidden = !!name;
    if (userGreetingText) {
      if (name) {
        userGreetingText.innerHTML = "Xin chào, " + escapeHtml(name);
      } else {
        userGreetingText.textContent = "";
      }
    }
  }

  function openWelcomeModal(options) {
    options = options || {};
    welcomeRequired = !!options.required;
    if (!backdrop) return;
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("welcome-open");
    if (welcomeCancel) {
      welcomeCancel.hidden = welcomeRequired;
    }
    if (welcomeError) welcomeError.textContent = "";
    if (welcomeName) {
      welcomeName.value = options.initialValue || getUserName() || "";
      welcomeName.focus();
    }
  }

  function closeWelcomeModal() {
    if (!backdrop) return;
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("welcome-open");
    welcomeRequired = false;
  }

  function onWelcomeSubmit(e) {
    e.preventDefault();
    if (welcomeError) welcomeError.textContent = "";
    var v = welcomeName ? welcomeName.value.trim() : "";
    if (!v) {
      if (welcomeError) welcomeError.textContent = "Vui lòng nhập tên hiển thị.";
      return;
    }
    setUserNameCookie(v);
    window.location.href = 'lobby.html';
  }

  document.getElementById("btn-logout-db")?.addEventListener("click", () => {
    document.cookie = "userName=; max-age=0; path=/;";
    localStorage.removeItem("hocviet_user_name");
    window.location.href = 'index.html';
  });

  if (welcomeForm) {
    welcomeForm.addEventListener("submit", onWelcomeSubmit);
  }

  if (welcomeCancel) {
    welcomeCancel.addEventListener("click", function () {
      closeWelcomeModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function (e) {
      if (e.target !== backdrop || welcomeRequired) return;
      closeWelcomeModal();
    });
  }

  if (btnDoiTen) {
    btnDoiTen.addEventListener("click", function () {
      openWelcomeModal({ required: false, initialValue: getUserName() });
      if (nav) nav.setAttribute("data-open", "false");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  }

  function initIdentity() {
    var existing = getUserName();
    if (existing) {
      applyUserUi(existing);
      // Optional: Auto redirect to lobby if on index.html and logged in
      if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        // We can either redirect or just show the "Go to Lobby" button
        const heroCta = document.querySelector('.hero__cta');
        if (heroCta) {
          heroCta.innerHTML = `
            <a class="btn btn--primary btn--lg" href="lobby.html">Vào Sảnh Học Tập</a>
            <a class="btn btn--outline btn--lg" href="#gioi-thieu">Xem giới thiệu</a>
          `;
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIdentity);
  } else {
    initIdentity();
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window && revealNodes.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealNodes.forEach(function (el, i) {
      el.style.setProperty("--reveal-delay", Math.min(i * 45, 180) + "ms");
      io.observe(el);
    });
  } else {
    revealNodes.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
