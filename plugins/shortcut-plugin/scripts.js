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

    window.Asc.attachEditorEvent("onContextMenuClick", () => {
      console.log("onContextMenuClick init");
    })

    window.Asc.attachEditorEvent("onContextMenuShow", () => {
      console.log("onContextMenuShow init");
    })

    this.executeMethod("GetVersion", [], function (version) {
      console.log("ONLYOFFICE version:", version);
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
            text: "Insert variable",
            items: [
              {
                id: 'insertVariable',
                text: 'Insert variable',
              }
            ]
          }
        ]
      }
    ]);
  };

  window.Asc.plugin.attachContextMenuClickEvent(MENU_ITEM_ID, function (data) {
    console.log("Context menu item clicked", data);

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
    console.log("event_onContextMenuClick", id);

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