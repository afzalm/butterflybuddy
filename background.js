chrome.runtime.onInstalled.addListener(async () => {

   let url = chrome.runtime.getURL("butterfly.html");
   let tab = await chrome.tabs.create({ url });
   console.log(`Created tab ${tab.id}`);
});


/* try {
  importScripts(
    "scripts/common.js",
    "scripts/storage.js",
    "scripts/activity.js",
    "scripts/tab.js",
    "scripts/timeInterval.js",
    "scripts/background.js",
    "scripts/restriction.js",
    "scripts/url.js"
  )
 
} catch (e) {
  console.log(e);
} */


/* chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('fileoperation.html', {
	id: "mainwin",
    innerBounds: {
      'width': 400,
      'height': 500
    }
  });
}); */
