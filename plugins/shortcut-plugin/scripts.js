(function () {
  function onKeyDown(e) {
    try {
      var isCtrl = e.ctrlKey || e.metaKey;
      var isDot =
        e.key === "." ||
        e.code === "Period" ||
        e.keyCode === 190;

      if (isCtrl && isDot) {
        if (typeof window.Asc !== "undefined" && window.Asc.plugin) {
          window.Asc.plugin.executeMethod("ShowMessage", [
            "Ctrl + . shortcut was triggered",
          ]);
        }

        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
        return false;
      }
    } catch (err) {
      // ignore errors inside handler
    }
  }

  window.Asc = window.Asc || {};
  window.Asc.plugin = window.Asc.plugin || {};

  window.Asc.plugin.init = function () {
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", onKeyDown, true);
    }
  };

  window.Asc.plugin.button = function () {
    if (typeof window.Asc.plugin.executeMethod === "function") {
      window.Asc.plugin.executeMethod("ShowMessage", [
        "Shortcut notifier plugin is active",
      ]);
    }
    window.Asc.plugin.executeMethod &&
      window.Asc.plugin.executeMethod("Close", []);
  };

  window.Asc.plugin.onMethodReturn = function () {};
})();

