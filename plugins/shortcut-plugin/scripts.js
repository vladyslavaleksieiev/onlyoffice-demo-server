(function (window, undefined) {
  const PLUGIN_GUID = window.Asc.plugin.guid;
  const MENU_ITEM_ID = "open-react-side-modal";

  window.Asc.plugin.init = function () {
    // For newer APIs, attachEditorEvent is preferred from 8.2+
    if (window.Asc.plugin.attachEditorEvent) {
      window.Asc.plugin.attachEditorEvent("onContextMenuShow", onContextMenuShow);
    } else {
      window.Asc.plugin.attachEvent("onContextMenuShow", onContextMenuShow);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "<") {
        window.parent.postMessage({
          source: "onlyoffice-plugin",
          type: "KEYBOARD_SHORTCUT",
          data: {
            key: "keyboard-<"
          }
        }, "*");
      }
    });
  };

  function onContextMenuShow(options) {
    // You can inspect options to show item only in certain cases
    // e.g. text selection, image, paragraph, etc.

    window.Asc.plugin.executeMethod("AddContextMenuItem", [[
      {
        guid: PLUGIN_GUID,
        items: [
          {
            id: MENU_ITEM_ID,
            text: "Open side modal"
          }
        ]
      }
    ]]);
  }

  window.Asc.plugin.onContextMenuClick = function (id) {
    if (id !== MENU_ITEM_ID) return;

    const payload = {
      source: "onlyoffice-plugin",
      type: "OPEN_REACT_MODAL",
      data: {
        from: "context-menu"
      }
    };

    // send to parent page hosting the editor
    window.parent.postMessage(payload, "*");
  };
})(window);