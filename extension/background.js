// מציג התראה כשהדף של משוב מזהה הודעה חדשה
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "mp-notify") return;
  chrome.notifications.create("mp-" + Date.now(), {
    type: "basic",
    iconUrl: "icon.png",
    title: msg.title,
    message: msg.body,
    priority: 2,
  });
  if (sender.tab) chrome.storage.session.set({ lastTab: sender.tab.id, lastWin: sender.tab.windowId });
});
// לחיצה על ההתראה פותחת את הטאב של משוב
chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  const { lastTab, lastWin } = await chrome.storage.session.get(["lastTab", "lastWin"]);
  try {
    await chrome.tabs.update(lastTab, { active: true });
    await chrome.windows.update(lastWin, { focused: true });
  } catch (e) {
    chrome.tabs.create({ url: "https://web.mashov.info/students/main/dashboard" });
  }
});
