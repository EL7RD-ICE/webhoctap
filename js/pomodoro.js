/**
 * Pomodoro Widget Module
 * Logic cho đồng hồ Pomodoro: 25p, Bắt đầu, Tạm dừng, Reset, Âm thanh thông báo.
 */
(function () {
  "use strict";

  var DEFAULT_TIME = 25 * 60; // 25 minutes
  var state = {
    timeLeft: DEFAULT_TIME,
    timerId: null,
    isRunning: false
  };

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function playAlarm() {
    try {
      var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var oscillator = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn("Không thể phát âm thanh thông báo:", e);
    }
  }

  function initWidget() {
    var container = document.getElementById("sidebar-pomodoro-container");
    var mountPoint = container || document.body;
    
    var widget = document.createElement("div");
    widget.id = "pomodoro-widget";
    // If mounted in sidebar, use a different class for styling
    widget.className = container ? "pomodoro-sidebar-app" : "pomodoro-widget";
    
    widget.innerHTML = `
      <div class="pomodoro-widget__content">
        <div class="pomodoro-widget__header">
          <h3 class="pomodoro-widget__title">Pomodoro</h3>
          <div class="pomodoro-widget__actions">
            <button type="button" class="pomodoro-widget__toggle-settings" id="pomodoro-settings-toggle" title="Cài đặt">⚙️</button>
            ${container ? "" : '<button type="button" class="pomodoro-widget__close" title="Thu nhỏ">&times;</button>'}
          </div>
        </div>
        
        <div id="pomodoro-main-view">
          <div class="pomodoro-widget__timer" id="pomodoro-timer">25:00</div>
          <div class="pomodoro-widget__controls">
            <button type="button" class="pomodoro-widget__btn pomodoro-widget__btn--start" id="pomodoro-start">Bắt đầu</button>
            <button type="button" class="pomodoro-widget__btn pomodoro-widget__btn--reset" id="pomodoro-reset">Reset</button>
          </div>
          <div class="pomodoro-widget__status" id="pomodoro-status">Sẵn sàng!</div>
        </div>

        <div id="pomodoro-settings-view" style="display: none; margin-top: 10px;">
          <div class="pomodoro-settings">
            <label class="pomodoro-settings__label">Thời gian (phút):</label>
            <input type="number" id="pomodoro-input-time" class="pomodoro-settings__input" value="25" min="1" max="60">
            <button type="button" class="pomodoro-widget__btn pomodoro-widget__btn--save" id="pomodoro-save-settings">Lưu</button>
          </div>
        </div>
      </div>
    `;

    mountPoint.appendChild(widget);

    var timerEl = document.getElementById("pomodoro-timer");
    var startBtn = document.getElementById("pomodoro-start");
    var resetBtn = document.getElementById("pomodoro-reset");
    var statusEl = document.getElementById("pomodoro-status");
    var closeBtn = widget.querySelector(".pomodoro-widget__close");
    var settingsToggle = document.getElementById("pomodoro-settings-toggle");
    var mainView = document.getElementById("pomodoro-main-view");
    var settingsView = document.getElementById("pomodoro-settings-view");
    var inputTime = document.getElementById("pomodoro-input-time");
    var saveBtn = document.getElementById("pomodoro-save-settings");

    function updateUi() {
      timerEl.textContent = formatTime(state.timeLeft);
      if (state.isRunning) {
        startBtn.textContent = "Tạm dừng";
        startBtn.className = "pomodoro-widget__btn pomodoro-widget__btn--pause";
        statusEl.textContent = "Đang tập trung...";
      } else {
        startBtn.textContent = "Bắt đầu";
        startBtn.className = "pomodoro-widget__btn pomodoro-widget__btn--start";
        statusEl.textContent = state.timeLeft === (parseInt(inputTime.value) * 60) ? "Sẵn sàng!" : "Đã tạm dừng";
      }
    }

    settingsToggle.addEventListener("click", function(e) {
      e.stopPropagation();
      if (settingsView.style.display === "none") {
        settingsView.style.display = "block";
        mainView.style.display = "none";
      } else {
        settingsView.style.display = "none";
        mainView.style.display = "block";
      }
    });

    saveBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      var newMin = parseInt(inputTime.value);
      if (isNaN(newMin) || newMin < 1) newMin = 25;
      DEFAULT_TIME = newMin * 60;
      
      if (!state.isRunning) {
        state.timeLeft = DEFAULT_TIME;
        updateUi();
      }
      
      settingsView.style.display = "none";
      mainView.style.display = "block";
    });

    function tick() {
      if (state.timeLeft > 0) {
        state.timeLeft--;
        updateUi();
      } else {
        clearInterval(state.timerId);
        state.timerId = null;
        state.isRunning = false;
        state.timeLeft = 0;
        updateUi();
        statusEl.textContent = "Hết giờ!";
        playAlarm();
        alert("Đã hết giờ! Nghỉ 5 phút thôi nào!");
        state.timeLeft = DEFAULT_TIME;
        updateUi();
      }
    }

    startBtn.addEventListener("click", function () {
      if (state.isRunning) {
        clearInterval(state.timerId);
        state.timerId = null;
        state.isRunning = false;
      } else {
        state.isRunning = true;
        state.timerId = setInterval(tick, 1000);
      }
      updateUi();
    });

    resetBtn.addEventListener("click", function () {
      clearInterval(state.timerId);
      state.timerId = null;
      state.isRunning = false;
      state.timeLeft = DEFAULT_TIME;
      updateUi();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        widget.classList.add("pomodoro-widget--minimized");
      });
    }

    widget.addEventListener("click", function () {
      if (widget.classList.contains("pomodoro-widget--minimized")) {
        widget.classList.remove("pomodoro-widget--minimized");
      }
    });

    // Load saved state if any (optional enhancement)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }
})();
