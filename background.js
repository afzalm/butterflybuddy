// Background Service Worker for Manifest V3
// Listen for installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Butterfly Buddy extension installed/updated');
  
  // Open onboarding page
  let url = chrome.runtime.getURL("butterfly.html");
  let tab = await chrome.tabs.create({ url });
  console.log(`Created tab ${tab.id}`);
  
  // Initialize storage if needed
  chrome.storage.sync.get(['configInitialized'], (result) => {
    if (!result.configInitialized) {
      // Set default configuration values if needed
      chrome.storage.sync.set({configInitialized: true});
    }
  });
});

// Listen for navigation events
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    console.log(`Navigation completed to: ${details.url}`);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    console.log(`Tab ${tabId} updated: ${tab.url}`);
  }
});

// Keep service worker alive when needed
const KEEP_ALIVE_INTERVAL = 20 * 1000; // 20 seconds

function keepAlive() {
  setTimeout(() => {
    keepAlive();
  }, KEEP_ALIVE_INTERVAL);
}

// Start the keep-alive cycle
keepAlive();

// Function to check if a URL is blocked
function isBlocked(url) {
  const blockedDomains = [
    'rediff.com',
    // Add other blocked domains here
  ];
  
  return blockedDomains.some(domain => url.includes(domain));
}

// Listen for web navigation
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    const url = new URL(details.url);
    if (isBlocked(url.hostname)) {
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked.html')
      });
    }
  }
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
