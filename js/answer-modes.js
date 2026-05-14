(function () {
  "use strict";

  var CONVERTER_SYSTEM = [
    "Bạn là một AI chuyên gia soạn đề thi. Nhiệm vụ của bạn là đọc văn bản thô và chuyển đổi thành một đối tượng JSON duy nhất.",
    "QUY TẮC CỰC KỲ QUAN TRỌNG:",
    "1. CHỈ trả về dữ liệu JSON, KHÔNG bao gồm lời giải thích hay định dạng markdown (như ```json).",
    "2. Đảm bảo tất cả các chuỗi (string) được escape đúng cách (đặc biệt là dấu ngoặc kép \" và các ký tự xuống dòng \\n).",
    "3. Cấu trúc JSON phải có các khóa là 'ask1', 'ask2', 'ask3', ... tương ứng với thứ tự câu hỏi.",
    "",
    "Mỗi câu hỏi (ví dụ 'ask1') phải có các trường sau:",
    "- Ask: nội dung câu hỏi",
    "- Type: một trong 'multi' | 'TrueFalse' | 'short' | 'essay'",
    "",
    "Quy tắc cho từng loại Type:",
    "1. Nếu Type là 'multi':",
    "   - Answer1, Answer2, Answer3, Answer4: nội dung 4 đáp án.",
    "   - Answer: 1 (nếu A đúng), 2 (nếu B), 3 (nếu C), 4 (nếu D).",
    "2. Nếu Type là 'TrueFalse':",
    "   - Answer1, Answer2, Answer3, Answer4: 4 phát biểu.",
    "   - Answer: chuỗi '1 0 1 0' (1: True, 0: False).",
    "3. Nếu Type là 'short':",
    "   - Answer: đáp án ngắn.",
    "4. Nếu Type là 'essay':",
    "   - Answer: đáp án mẫu.",
    "",
    "Văn bản thô nằm trong khối sau dấu ---."
  ].join("\n");

  function buildConverterUserText(rawText) {
    return "---\n" + String(rawText || "") + "\n---";
  }

  var EXTRACT_SYSTEM = [
    "Hãy phân tích văn bản sau, tìm và trích xuất phần đáp án (thường ở cuối tài liệu, có các từ khóa như 'ĐÁP ÁN', 'ANSWER KEY')",
    "và tự động điền vào trường Answer cho từng câu hỏi trong cấu trúc JSON đã tạo ở bước trước.",
    "Bạn nhận (1) đối tượng JSON câu hỏi hiện tại và (2) toàn bộ văn bản (đề + đáp án).",
    "Trả về DUY NHẤT một đối tượng JSON cùng cấu trúc, giữ nguyên Ask, Type, Answer1-4; chỉ cập nhật Answer cho khớp đáp án trích được.",
    "Định dạng Answer phải nhất quán theo loại câu hỏi (multi: 1-4; TrueFalse: '1 0 1 0'; short/essay: văn bản)."
  ].join(" ");

  var AI_SOLVE_SYSTEM = [
    "Hãy đóng vai một học sinh xuất sắc, giải tất cả các câu hỏi dưới đây và điền đáp án vào trường Answer.",
    "Với câu hỏi tự luận (essay), hãy viết một bài giải mẫu ngắn gọn trong Answer.",
    "Thêm trường ai_generated: true vào mỗi câu hỏi trong kết quả.",
    "Trả về DUY NHẤT một đối tượng JSON, cùng cấu trúc với đầu vào, giữ Ask, Type, Answer1-4; bổ sung Answer và ai_generated."
  ].join(" ");

  /**
   * @param {object} questionsObj - { ask1: {}, ask2: {} }
   * @param {"record"|"extract"|"ai_solve"} mode
   * @returns {object}
   */
  function prepareExamPayload(questionsObj, mode) {
    var copy = JSON.parse(JSON.stringify(questionsObj || {}));
    if (mode === "record") {
      Object.keys(copy).forEach(function (k) {
        copy[k].Answer = "";
        if (copy[k].ai_generated) delete copy[k].ai_generated;
      });
    }
    return copy;
  }

  /**
   * @param {object} questionsObj
   * @param {string} answerKeyText
   */
  async function mergeAnswersFromExtract(questionsObj, answerKeyText) {
    var keyT = String(answerKeyText || "");
    if (keyT.length > 100000) keyT = keyT.slice(0, 100000);
    var userText =
      "ĐỐI_TƯỢNG_CÂU_HỎI_JSON:\n" +
      JSON.stringify(questionsObj, null, 2) +
      "\n\nVĂN_BẢN_ĐẦY_ĐỦ (ĐỀ + ĐÁP ÁN):\n" +
      keyT;
    return await window.generateGeminiJson({
      systemInstruction: EXTRACT_SYSTEM,
      userText: userText
    });
  }

  /**
   * @param {object} questionsObj
   */
  async function solveWithAi(questionsObj) {
    var stripped = JSON.parse(JSON.stringify(questionsObj || {}));
    Object.keys(stripped).forEach(function (k) {
      stripped[k].Answer = "";
      if ("ai_generated" in stripped[k]) delete stripped[k].ai_generated;
    });
    var userText = "ĐỐI_TƯỢNG_CÂU_HỎI:\n" + JSON.stringify(stripped, null, 2);
    return await window.generateGeminiJson({
      systemInstruction: AI_SOLVE_SYSTEM,
      userText: userText
    });
  }

  window.AnswerModes = {
    CONVERTER_SYSTEM: CONVERTER_SYSTEM,
    buildConverterUserText: buildConverterUserText,
    prepareExamPayload: prepareExamPayload,
    mergeAnswersFromExtract: mergeAnswersFromExtract,
    solveWithAi: solveWithAi
  };
})();
