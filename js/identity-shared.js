(function () {
  "use strict";
  var COOKIE_NAME = "userName";

  function getUserName() {
    var name = "";
    // 1. Check Cookie
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
    // 2. Fallback to LocalStorage (more reliable on local files)
    if (!name) {
      name = localStorage.getItem("hocviet_user_name") || "";
    }
    
    console.log("[Identity] Found user:", name);
    return name;
  }

  function setUserName(name) {
    var n = String(name || "").trim();
    if (!n) return;
    // Set Cookie
    document.cookie = COOKIE_NAME + "=" + encodeURIComponent(n) + "; max-age=" + (60 * 60 * 24 * 30) + "; path=/; SameSite=Lax";
    // Set LocalStorage
    localStorage.setItem("hocviet_user_name", n);
    console.log("[Identity] Saved user:", n);
  }

  function getCurrentUser() {
    return getUserName();
  }

  window.getUserName = getUserName;
  window.getCurrentUser = getCurrentUser;
  window.setUserName = setUserName;
})();
