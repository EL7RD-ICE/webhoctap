/**
 * Quản lý API key Gemini (localStorage).
 * @returns {string}
 */
function getApiKey() {
  try {
    return (localStorage.getItem("GEMINI_API_KEY") || "").trim();
  } catch (e) {
    return "";
  }
}

function setApiKey(value) {
  try {
    localStorage.setItem("GEMINI_API_KEY", (value || "").trim());
  } catch (e) {
    console.warn("Không lưu được API key:", e);
  }
}

window.getApiKey = getApiKey;
window.setApiKey = setApiKey;
