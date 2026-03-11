(function (window, undefined) {
  const PLUGIN_GUID = window.Asc.plugin.guid;
  const MENU_ITEM_ID = "open-react-side-modal";

  window.Asc.plugin.init = function () {
    if (window.Asc.plugin.attachEditorEvent) {
      window.Asc.plugin.attachEditorEvent("onContextMenuShow", onContextMenuShow);
    } else {
      window.Asc.plugin.attachEvent("onContextMenuShow", onContextMenuShow);
    }
  };

  function onContextMenuShow(options) {
    const items = {
      guid: PLUGIN_GUID,
      items: [
        {
          id: MENU_ITEM_ID,
          text: "Open side modal",
          icons: "icons/icon16.png"
        }
      ]
    };

    window.Asc.plugin.executeMethod("AddContextMenuItem", [items]);
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