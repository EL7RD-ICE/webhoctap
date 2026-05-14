(function () {
  "use strict";

  var MODEL = "gemini-flash-latest";

  /**
   * Cố gắng sửa JSON bị cắt cụt (thêm dấu ngoặc đóng).
   * @param {string} jsonStr
   * @returns {*}
   */
  function repairJson(jsonStr) {
    let text = jsonStr.trim();
    
    // Đóng các chuỗi chưa kết thúc
    let quoteCount = (text.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      text += '"';
    }

    // Đóng các dấu ngoặc
    let openBraces = (text.match(/\{/g) || []).length;
    let closeBraces = (text.match(/\}/g) || []).length;
    while (openBraces > closeBraces) {
      text += '}';
      closeBraces++;
    }

    let openBrackets = (text.match(/\[/g) || []).length;
    let closeBrackets = (text.match(/\]/g) || []).length;
    while (openBrackets > closeBrackets) {
      text += ']';
      closeBrackets++;
    }

    return JSON.parse(text);
  }

  /**
   * Tách JSON từ chuỗi Gemini (hỗ trợ khối ```json).
   * @param {string} text
   * @returns {*}
   */
  function parseJsonLoose(text) {
    var t = String(text).trim();
    var m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m) t = m[1].trim();
    
    try {
      return JSON.parse(t);
    } catch (e) {
      console.warn("JSON parse failed, attempting repair...");
      return repairJson(t);
    }
  }

  /**
   * Gọi Gemini 1.5 Flash, yêu cầu trả về JSON.
   * @param {{ systemInstruction: string, userText: string }} opts
   * @returns {Promise<*>} Đã JSON.parse
   */
  async function generateGeminiJson(opts) {
    var apiKey = typeof getApiKey === "function" ? getApiKey() : "";
    if (!apiKey) {
      throw new Error("Thiếu Gemini API key. Hãy nhập và lưu key ở đầu trang.");
    }

    var url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    var body = {
      systemInstruction: { parts: [{ text: opts.systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: opts.userText }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    };

    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      var msg = res.statusText;
      try {
        var errBody = await res.json();
        if (errBody.error && errBody.error.message) msg = errBody.error.message;
      } catch (_) {}
      throw new Error("Gemini API (" + res.status + "): " + msg);
    }

    var data = await res.json();
    var cand = data.candidates && data.candidates[0];
    if (!cand || cand.finishReason === "SAFETY") {
      throw new Error("Phản hồi Gemini không hợp lệ hoặc bị chặn bởi bộ lọc an toàn.");
    }
    var parts = cand.content && cand.content.parts;
    var text = parts && parts[0] && parts[0].text;
    if (!text) throw new Error("Gemini không trả về nội dung văn bản.");

    try {
      return parseJsonLoose(text);
    } catch (e) {
      console.error("Gemini Raw Response:", text);
      throw new Error("Không parse được JSON từ Gemini (có thể do phản hồi bị cắt ngắn hoặc sai định dạng). Hãy thử tài liệu ngắn hơn hoặc xem Console để biết chi tiết.");
    }
  }

  window.generateGeminiJson = generateGeminiJson;
})();
