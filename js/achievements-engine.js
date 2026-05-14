/**
 * Achievements Engine
 * Logic kiểm tra và cấp huy hiệu. Lưu trữ vào Firestore collection 'userAchievements'.
 */
(function () {
  "use strict";

  var ACHIEVEMENTS_COLLECTION = "userAchievements";

  function ensureFirestore() {
    if (window.__firestoreDb) return window.__firestoreDb;
    if (typeof firebase === "undefined") return null;
    return firebase.firestore();
  }

  /**
   * Cấp huy hiệu cho user nếu chưa có.
   * @param {string} userName
   * @param {string} badgeId
   */
  async function grantBadge(userName, badgeId) {
    var db = ensureFirestore();
    if (!db || !userName) return;

    var docRef = db.collection(ACHIEVEMENTS_COLLECTION).doc(userName);
    try {
      await db.runTransaction(async (transaction) => {
        var doc = await transaction.get(docRef);
        var badges = [];
        if (doc.exists) {
          badges = doc.data().badges || [];
        }

        if (badges.indexOf(badgeId) === -1) {
          badges.push(badgeId);
          transaction.set(docRef, {
            badges: badges,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log(`Đã cấp huy hiệu: ${badgeId} cho ${userName}`);
          // Hiển thị thông báo Toast nếu có
          if (window.showToast) {
            window.showToast(`🎉 Bạn đã đạt huy hiệu: ${badgeId}!`, "success");
          }
        }
      });
    } catch (e) {
      console.error("Lỗi khi cấp huy hiệu:", e);
    }
  }

  /**
   * Kiểm tra điều kiện sau khi hoàn thành đề thi.
   * @param {string} userName
   * @param {Object} sessionStats { timeSeconds, score, totalQuestions }
   */
  async function checkAfterQuiz(userName, sessionStats) {
    var db = ensureFirestore();
    if (!db || !userName) return;

    try {
      // 1. Kiểm tra tổng số đề đã làm (giả sử có collection 'results' hoặc query count)
      // Để đơn giản, ta có thể lưu stats trong userAchievements doc
      var docRef = db.collection(ACHIEVEMENTS_COLLECTION).doc(userName);
      var doc = await docRef.get();
      var data = doc.exists ? doc.data() : {};
      var totalQuizzes = (data.totalQuizzes || 0) + 1;

      // Cập nhật stats
      await docRef.set({
        totalQuizzes: totalQuizzes,
        lastQuizAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Check "Tân binh"
      if (totalQuizzes >= 1) await grantBadge(userName, "tan_binh");

      // Check "Chăm chỉ"
      if (totalQuizzes >= 5) await grantBadge(userName, "cham_chi");

      // Check "Siêu tốc"
      if (sessionStats.timeSeconds > 0 && sessionStats.timeSeconds < 60) {
        await grantBadge(userName, "sieu_toc");
      }
    } catch (e) {
      console.error("Lỗi khi kiểm tra huy hiệu sau quiz:", e);
    }
  }

  /**
   * Kiểm tra điều kiện "Học giả" (đã đọc bài học)
   * @param {string} userName
   */
  async function trackLessonRead(userName) {
    var db = ensureFirestore();
    if (!db || !userName) return;

    try {
      var docRef = db.collection(ACHIEVEMENTS_COLLECTION).doc(userName);
      var doc = await docRef.get();
      var data = doc.exists ? doc.data() : {};
      var lessonsRead = (data.lessonsRead || 0) + 1;

      await docRef.set({
        lessonsRead: lessonsRead
      }, { merge: true });

      if (lessonsRead >= 3) {
        await grantBadge(userName, "hoc_gia");
      }
    } catch (e) {
      console.error("Lỗi khi track bài học:", e);
    }
  }

  window.AchievementEngine = {
    grantBadge: grantBadge,
    checkAfterQuiz: checkAfterQuiz,
    trackLessonRead: trackLessonRead
  };
})();
