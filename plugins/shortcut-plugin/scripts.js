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

    this.executeMethod("AddContextMenuItem", [
      {
        guid: this.guid,
        items: [
          {
            id: MENU_ITEM_ID,
            text: "Insert Variable"
          }
        ]
      }
    ]);
  };

  window.Asc.plugin.attachContextMenuClickEvent(MENU_ITEM_ID, function (data) {
    console.log("Context menu item clicked:", MENU_ITEM_ID, data);

    postToParent({
      source: "onlyoffice-plugin",
      type: "OPEN_REACT_MODAL",
      data: {
        from: "context-menu",
        itemData: data
      }
    });
  });

  window.Asc.plugin.event_onContextMenuClick = function (id) {
    console.log("onContextMenuClick", id);
    const pluginObj = window.Asc.plugin;
    let itemId = id;
    let itemData;

    const itemPos = itemId.indexOf("_oo_sep_");
    if (itemPos !== -1) {
      itemData = itemId.slice(itemPos + 8);
      itemId = itemId.slice(0, itemPos);
    }

    if (pluginObj.contextMenuEvents && pluginObj.contextMenuEvents[itemId]) {
      pluginObj.contextMenuEvents[itemId].call(pluginObj, itemData);
    }
  };
})(window);