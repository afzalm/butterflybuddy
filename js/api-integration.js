// API integration for Butterfly Buddy Chrome Extension

class ButterflyAPI {
  constructor() {
    this.baseURL = 'http://localhost:8001/api';
    this.hashKey = null;
    this.policies = null;
    this.loadHashKey();
  }

  // Load hash key from storage
  async loadHashKey() {
    try {
      const result = await chrome.storage.sync.get(['butterflyHashKey']);
      this.hashKey = result.butterflyHashKey;
      
      if (this.hashKey) {
        await this.loadPolicies();
      }
    } catch (error) {
      console.error('Error loading hash key:', error);
    }
  }

  // Set hash key
  async setHashKey(key) {
    try {
      this.hashKey = key;
      await chrome.storage.sync.set({ butterflyHashKey: key });
      await this.loadPolicies();
      return true;
    } catch (error) {
      console.error('Error setting hash key:', error);
      return false;
    }
  }

  // Load policies from backend
  async loadPolicies() {
    if (!this.hashKey) return null;

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
        // Store policies locally for offline access
        await chrome.storage.local.set({ butterflyPolicies: this.policies });
        return this.policies;
      } else {
        console.error('Failed to load policies:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      // Try to load from local storage
      const result = await chrome.storage.local.get(['butterflyPolicies']);
      this.policies = result.butterflyPolicies || null;
      return this.policies;
    }
  }

  // Log user activity to backend
  async logActivity(url, title, isBlocked = false) {
    if (!this.hashKey) return;

    try {
      const response = await fetch(`${this.baseURL}/extension/usage`, {
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

      if (!response.ok) {
        console.error('Failed to log activity:', response.status);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Check if URL is blocked
  isBlocked(url) {
    if (!this.policies) return false;

    const domain = this.extractDomain(url);
    return this.policies.blocked_sites.some(blocked => 
      domain.includes(blocked) || blocked.includes(domain)
    );
  }

  // Check if URL is controlled (time-limited)
  isControlled(url) {
    if (!this.policies) return false;

    const domain = this.extractDomain(url);
    return this.policies.controlled_sites.some(controlled => 
      domain.includes(controlled) || controlled.includes(domain)
    );
  }

  // Get allowed sites
  getAllowedSites() {
    return this.policies?.allowed_sites || {};
  }

  // Extract domain from URL
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  }

  // Get policies
  getPolicies() {
    return this.policies;
  }

  // Check if hash key is set
  hasHashKey() {
    return !!this.hashKey;
  }

  // Get hash key
  getHashKey() {
    return this.hashKey;
  }
}

// Global API instance
window.butterflyAPI = new ButterflyAPI();
