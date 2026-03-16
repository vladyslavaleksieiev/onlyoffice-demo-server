(function (window) {
  "use strict";

  const MENU_ITEM_ID = "open-react-side-modal";

  function postToParent(message) {
    try {
      window.parent.postMessage(message, "*");
    } catch (error) {
      console.error("Failed to post message to parent", error);
    }
  }

  if (!window.Asc || !window.Asc.plugin) {
    console.error("ONLYOFFICE plugin API is not available");
    return;
  }

  window.Asc.plugin.init = function () {
    console.log("Shortcut notifier plugin initialized", this.guid);

    postToParent({
      source: "onlyoffice-plugin",
      type: "PLUGIN_INIT",
      data: {
        guid: this.guid
      }
    });
  };

  window.Asc.plugin.button = function () {
    this.executeCommand("close", "");
  };

  window.Asc.plugin.event_onContextMenuShow = function (options) {
    console.log("onContextMenuShow", options);

    const items = {
      guid: this.guid,
      items: [
        {
          id: MENU_ITEM_ID,
          text: "Open side modal",
          icons: "icons/icon16.png"
        }
      ]
    };

    this.executeMethod("AddContextMenuItem", [items]);
  };

  window.Asc.plugin.attachContextMenuClickEvent(MENU_ITEM_ID, function () {
    console.log("Context menu item clicked:", MENU_ITEM_ID);

    postToParent({
      source: "onlyoffice-plugin",
      type: "OPEN_REACT_MODAL",
      data: {
        from: "context-menu"
      }
    });
  });
})(window);