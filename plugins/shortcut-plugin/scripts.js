(function (window) {
  "use strict";

  const MENU_ITEM_ID = "openReactSideModal";

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

  console.log("plugin script loaded");

  window.Asc.plugin.init = function () {
    console.log("plugin init", this.guid);
  };

  window.Asc.plugin.button = function () {
    this.executeCommand("close", "");
  };

  window.Asc.plugin.event_onContextMenuShow = function (options) {
    console.log("onContextMenuShow", options);

    this.executeMethod("AddContextMenuItem", [
      {
        guid: this.guid,
        items: [
          {
            id: "openReactSideModal",
            text: "Open side modal"
          }
        ]
      }
    ]);
  };

  window.Asc.plugin.attachContextMenuClickEvent("openReactSideModal", () => {
    console.log("Context menu item clicked");

    postToParent({
      source: "onlyoffice-plugin",
      type: "OPEN_REACT_MODAL",
      data: {
        from: "context-menu",
        itemData: "test"
      }
    });
  });
})(window);