chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes("maang.in")) {
      chrome.action.setPopup({ tabId, popup: "popup.html" });
    } else {
      chrome.action.setPopup({ tabId, popup: "" }); // No popup for other sites
    }
  });
  
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes("maang.in")) {
      chrome.action.setPopup({ tabId: activeInfo.tabId, popup: "popup.html" });
    } else {
      chrome.action.setPopup({ tabId: activeInfo.tabId, popup: "" });
    }
  });
  