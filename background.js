// Background Service Worker for Manifest V3
// Enhanced with backend API integration

class ButterflyBackgroundAPI {
  constructor() {
    this.baseURL = 'http://localhost:8001/api';
    this.hashKey = null;
    this.policies = null;
    this.timeTracking = new Map(); // Track time spent on controlled sites
    this.init();
  }

  async init() {
    await this.loadHashKey();
    if (this.hashKey) {
      await this.loadPolicies();
    }
  }

  async loadHashKey() {
    try {
      const result = await chrome.storage.sync.get(['butterflyHashKey']);
      this.hashKey = result.butterflyHashKey;
    } catch (error) {
      console.error('Error loading hash key:', error);
    }
  }

  async loadPolicies() {
    if (!this.hashKey) return;

    try {
      const response = await fetch(`${this.baseURL}/extension/policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash_key: this.hashKey })
      });

      if (response.ok) {
        this.policies = await response.json();
        await chrome.storage.local.set({ butterflyPolicies: this.policies });
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      // Fallback to stored policies
      const result = await chrome.storage.local.get(['butterflyPolicies']);
      this.policies = result.butterflyPolicies;
    }
  }

  async logActivity(url, title, isBlocked = false, tabId = null) {
    if (!this.hashKey) return;

    try {
      await fetch(`${this.baseURL}/extension/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_hash: this.hashKey,
          url: url,
          title: title,
          timestamp: new Date().toISOString(),
          duration: 0,
          is_blocked: isBlocked
        })
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  }

  isBlocked(url) {
    if (!this.policies) return false;
    
    const domain = this.extractDomain(url);
    return this.policies.blocked_sites.some(blocked => 
      domain.includes(blocked) || blocked.includes(domain)
    );
  }

  isControlled(url) {
    if (!this.policies) return false;
    
    const domain = this.extractDomain(url);
    return this.policies.controlled_sites.some(controlled => 
      domain.includes(controlled) || controlled.includes(domain)
    );
  }

  async checkTimeLimit(domain, tabId) {
    if (!this.policies) return true;

    const dailyLimit = this.policies.daily_time_limit || 3600; // seconds
    const today = new Date().toDateString();
    
    // Get today's usage for this domain
    const storageKey = `timeUsage_${domain}_${today}`;
    const result = await chrome.storage.local.get([storageKey]);
    const usedTime = result[storageKey] || 0;

    return usedTime < dailyLimit;
  }

  async updateTimeUsage(domain, seconds) {
    const today = new Date().toDateString();
    const storageKey = `timeUsage_${domain}_${today}`;
    
    const result = await chrome.storage.local.get([storageKey]);
    const currentUsage = result[storageKey] || 0;
    const newUsage = currentUsage + seconds;
    
    await chrome.storage.local.set({ [storageKey]: newUsage });
    return newUsage;
  }
}

// Global API instance
const butterflyAPI = new ButterflyBackgroundAPI();

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
      chrome.storage.sync.set({configInitialized: true});
    }
  });
});

// Enhanced navigation blocking with backend policies
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    const url = details.url;
    
    // Skip chrome:// and extension URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return;
    }
    
    // Check if blocked
    if (butterflyAPI.isBlocked(url)) {
      console.log(`Blocked URL: ${url}`);
      
      // Log blocked attempt
      try {
        const tab = await chrome.tabs.get(details.tabId);
        await butterflyAPI.logActivity(url, tab.title || 'Blocked Page', true, details.tabId);
      } catch (error) {
        console.error('Error logging blocked activity:', error);
      }
      
      // Redirect to blocked page
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked.html') + '?blocked=' + encodeURIComponent(url)
      });
      return;
    }
    
    // Check if controlled (time-limited)
    if (butterflyAPI.isControlled(url)) {
      const domain = butterflyAPI.extractDomain(url);
      const canAccess = await butterflyAPI.checkTimeLimit(domain, details.tabId);
      
      if (!canAccess) {
        console.log(`Time limit exceeded for: ${domain}`);
        
        // Log time limit exceeded
        try {
          const tab = await chrome.tabs.get(details.tabId);
          await butterflyAPI.logActivity(url, 'Time Limit Exceeded', true, details.tabId);
        } catch (error) {
          console.error('Error logging time limit:', error);
        }
        
        // Redirect to time limit page
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked.html') + '?timelimit=' + encodeURIComponent(domain)
        });
        return;
      }
    }
  }
});

// Track navigation completion for logging
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    const url = details.url;
    
    // Skip chrome:// and extension URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return;
    }
    
    console.log(`Navigation completed to: ${url}`);
    
    // Log activity
    try {
      const tab = await chrome.tabs.get(details.tabId);
      await butterflyAPI.logActivity(url, tab.title || 'Unknown Page', false, details.tabId);
    } catch (error) {
      console.error('Error logging navigation:', error);
    }
    
    // Start time tracking for controlled sites
    if (butterflyAPI.isControlled(url)) {
      const domain = butterflyAPI.extractDomain(url);
      butterflyAPI.timeTracking.set(details.tabId, {
        domain: domain,
        startTime: Date.now()
      });
    }
  }
});

// Track tab removal to update time usage
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (butterflyAPI.timeTracking.has(tabId)) {
    const tracking = butterflyAPI.timeTracking.get(tabId);
    const duration = Math.floor((Date.now() - tracking.startTime) / 1000); // seconds
    
    if (duration > 0) {
      await butterflyAPI.updateTimeUsage(tracking.domain, duration);
      console.log(`Updated time usage for ${tracking.domain}: ${duration} seconds`);
    }
    
    butterflyAPI.timeTracking.delete(tabId);
  }
});

// Track tab activation changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Stop tracking for previously active tab
  for (const [tabId, tracking] of butterflyAPI.timeTracking.entries()) {
    if (tabId !== activeInfo.tabId) {
      const duration = Math.floor((Date.now() - tracking.startTime) / 1000);
      if (duration > 0) {
        await butterflyAPI.updateTimeUsage(tracking.domain, duration);
      }
      tracking.startTime = Date.now(); // Reset start time
    }
  }
});

// Listen for storage changes to update policies
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && changes.butterflyHashKey) {
    await butterflyAPI.loadHashKey();
    if (butterflyAPI.hashKey) {
      await butterflyAPI.loadPolicies();
    }
  }
});

// Keep service worker alive
const KEEP_ALIVE_INTERVAL = 20 * 1000; // 20 seconds

function keepAlive() {
  setTimeout(() => {
    keepAlive();
  }, KEEP_ALIVE_INTERVAL);
}

keepAlive();

// Periodic policy refresh
setInterval(async () => {
  if (butterflyAPI.hashKey) {
    await butterflyAPI.loadPolicies();
  }
}, 5 * 60 * 1000); // Every 5 minutes
