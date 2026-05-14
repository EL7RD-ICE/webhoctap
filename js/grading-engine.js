/**
 * Chấm điểm bài làm (JavaScript thuần).
 * @example
 *   const r = GradingEngine.grade({ 0: "A", 1: "Đúng" }, questions);
 */
(function () {
  "use strict";

  /**
   * Chuẩn hóa chuỗi để so sánh short_answer:
   * - Chuyển chữ thường (tiếng Việt: không bỏ dấu để tránh sai lệch lớn).
   * - Gom khoảng trắng đầu/cuối và giữa các từ thành một dấu cách.
   * - Loại bỏ dấu câu cơ bản . , ; ? !
   * @param {string} str
   * @returns {string}
   */
  function normalizeText(str) {
    if (str == null) return "";
    var s = String(str).toLowerCase().trim();
    s = s.replace(/\s+/g, " ");
    s = s.replace(/[.,;?!,]/g, "");
    return s.trim();
  }

  function exactMatch(a, b) {
    return String(a) === String(b);
  }

  class GradingEngine {
    /**
     * @param {Record<string, *>} userAnswers — key là 'ask1', 'ask2'...
     * @param {Record<string, object>} questionSet — object { ask1: {}, ... }
     * @returns {{ score: number, total: number, details: object[] }}
     */
    static grade(userAnswers, questionSet) {
      var qs = questionSet || {};
      var keys = Object.keys(qs).sort(function(a, b) {
        return parseInt(a.replace("ask", "")) - parseInt(b.replace("ask", ""));
      });
      var details = [];
      var score = 0;
      var total = 0;

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var q = qs[key];
        var userVal = userAnswers[key] == null ? "" : String(userAnswers[key]);

        var type = q.Type;
        var correct = q.Answer;

        if (type === "essay") {
          details.push({
            key: key,
            type: type,
            correct: false,
            requiresManualGrading: true,
            userAnswer: String(userVal),
            referenceAnswer: correct != null ? String(correct) : ""
          });
          continue;
        }

        total += 1;
        var ok = false;

        if (type === "multi") {
          ok = exactMatch(userVal.trim(), String(correct).trim());
        } else if (type === "TrueFalse") {
          // Normalize both strings: remove multiple spaces, then compare
          var uv = userVal.trim().replace(/\s+/g, " ");
          var cv = String(correct).trim().replace(/\s+/g, " ");
          ok = (uv === cv);
        } else if (type === "short") {
          ok = normalizeText(userVal) === normalizeText(correct);
        } else {
          ok = exactMatch(userVal.trim(), String(correct).trim());
        }

        if (ok) score += 1;
        details.push({
          key: key,
          type: type,
          correct: ok,
          userAnswer: userVal,
          expected: correct != null ? String(correct) : ""
        });
      }

      return { score: score, total: total, details: details };
    }
  }

  GradingEngine.normalizeText = normalizeText;
  window.GradingEngine = GradingEngine;

  /** Chạy trong console: GradingEngine.__selfTest() */
  GradingEngine.__selfTest = function () {
    var qs = {
      ask1: { Type: "multi", Answer: "1", Answer1: "A", Answer2: "B", Answer3: "C", Answer4: "D" },
      ask2: { Type: "TrueFalse", Answer: "1 0 1 0" },
      ask3: { Type: "short", Answer: "Hà  Nội" },
      ask4: { Type: "essay", Answer: "Gợi ý" }
    };
    var ua = { ask1: "1", ask2: "1 0 1 0 ", ask3: "hà nội", ask4: "bài làm" };
    var r = GradingEngine.grade(ua, qs);
    console.assert(r.total === 3, "total");
    console.assert(r.score === 3, "score all correct");
    console.assert(r.details[3].requiresManualGrading === true, "essay");
    return r;
  };
})();
