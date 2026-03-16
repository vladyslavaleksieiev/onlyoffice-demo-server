(function (window, undefined) {
  let PLUGIN_GUID;
  const MENU_ITEM_ID = "open-react-side-modal";

  window.Asc.plugin.init = function () {
    PLUGIN_GUID = window.Asc.plugin.guid;

    alert("init");
    console.log("init");
    window.parent.postMessage({ type: 'init', data: { guid: PLUGIN_GUID } }, "*");
    window.Asc.plugin.attachEvent("onContextMenuShow", onContextMenuShow);
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