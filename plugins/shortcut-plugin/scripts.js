(function () {
  var lastChars = "";

  function triggerInsertVariable(source) {
    if (typeof window.Asc === "undefined" || !window.Asc.plugin) {
      return;
    }

    var suffix = source || "";
    var message = "INSERT_VARIABLE:" + suffix;

    if (typeof window.Asc.plugin.executeMethod === "function") {
      window.Asc.plugin.executeMethod("ShowMessage", [message]);
    }
  }

  function onKeyDown(e) {
    try {
      var isCtrlLike = !!(e.ctrlKey || e.metaKey);
      var isDot =
        e.key === "." ||
        e.code === "Period" ||
        e.keyCode === 190;

      if (isCtrlLike && isDot) {
        triggerInsertVariable("CTRL_DOT");

        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
        return false;
      }

      if (!isCtrlLike && !e.altKey) {
        var isLt =
          e.key === "<" ||
          (e.code === "Comma" && e.shiftKey) ||
          (e.keyCode === 188 && e.shiftKey);

        if (isLt) {
          lastChars = (lastChars + "<").slice(-2);
        } else {
          lastChars = "";
        }

        if (lastChars === "<<") {
          triggerInsertVariable("LT_LT");
        }
      }
    } catch (err) {
      // ignore errors inside handler
    }
  }

  window.Asc = window.Asc || {};
  window.Asc.plugin = window.Asc.plugin || {};

  window.Asc.plugin.init = function () {
    if (
      window.Asc &&
      window.Asc.plugin &&
      typeof window.Asc.plugin.attachEvent === "function"
    ) {
      window.Asc.plugin.attachEvent("onDocumentContentReady", function () {
        if (typeof document !== "undefined") {
          document.removeEventListener("keydown", onKeyDown, true);
          document.addEventListener("keydown", onKeyDown, true);
        }

        if (typeof window.Asc.plugin.executeMethod === "function") {
          window.Asc.plugin.executeMethod("ShowMessage", [
            "Shortcut plugin mounted and ready to listen for Ctrl+. and <<",
          ]);
        }
      });
    } else if (typeof document !== "undefined") {
      // Fallback if attachEvent is not available
      document.addEventListener("keydown", onKeyDown, true);
    }
  };

  window.Asc.plugin.button = function () {
    triggerInsertVariable("MANUAL");

    if (
      window.Asc &&
      window.Asc.plugin &&
      typeof window.Asc.plugin.executeMethod === "function"
    ) {
      window.Asc.plugin.executeMethod("Close", []);
    }
  };

  window.Asc.plugin.onMethodReturn = function () {};
})();

