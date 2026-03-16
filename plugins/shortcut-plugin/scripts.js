(function (window) {
  "use strict";

  const MENU_ITEM_ID = "openReactSideModal";

  function postToParent(message) {
    console.log("postToParent", message);
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
    postToParent({
      source: "onlyoffice-plugin",
      type: "PLUGIN_INIT",
      data: {
        guid: this.guid,
      }
    })

    window.Asc.plugin.attachEditorEvent("onContextMenuClick", () => {
      console.log("onContextMenuClick");
      postToParent({
        source: "onlyoffice-plugin",
        type: "OPEN_REACT_MODAL",
        data: {
          from: "context-menu",
          itemData: { type: 'insertVariableMenuItemClick' }
        }
      })
    })

    window.Asc.plugin.attachEditorEvent("onContextMenuShow", function () {
      console.log("onContextMenuShow");
      this.executeMethod("AddContextMenuItem", [
        {
          guid: this.guid,
          items: [
            {
              id: MENU_ITEM_ID,
              text: "Insert variable"
            }
          ]
        }
      ]);
    })

    this.executeMethod("GetVersion", [], function (version) {
      console.log("ONLYOFFICE version:", version);
    });
  };
})(window);