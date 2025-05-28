// Enhanced buddy.js with backend integration

// Enhanced configuration loading with backend integration
async function loadEnhancedConfig() {
  try {
    // Wait for API to be ready
    await new Promise(resolve => {
      if (window.butterflyAPI) {
        resolve();
      } else {
        setTimeout(resolve, 100);
      }
    });

    let config = {};
    
    // If we have API connection, use backend data
    if (window.butterflyAPI.hasHashKey()) {
      const policies = window.butterflyAPI.getPolicies();
      if (policies) {
        config = {
          username: 'Student',
          allowed_websites: policies.allowed_sites || {},
          blocked_sites: policies.blocked_sites || [],
          controlled_sites: policies.controlled_sites || []
        };
      }
    }
    
    // Fallback to local config if no backend connection
    if (!config.allowed_websites) {
      try {
        const configUrl = chrome.runtime.getURL('data/config.json');
        const response = await fetch(configUrl);
        const localConfig = await response.json();
        config = { ...localConfig, ...config };
      } catch (error) {
        console.error('Error loading local config:', error);
        // Use default config
        config = {
          username: 'Student',
          allowed_websites: {
            "Khan Academy": "https://www.khanacademy.org",
            "Wikipedia": "https://www.wikipedia.org",
            "Google Scholar": "https://scholar.google.com"
          }
        };
      }
    }
    
    // Update user info
    const nameElement = document.getElementById('buddy_name');
    const greetingsElement = document.getElementById('greetings');
    
    if (nameElement) {
      nameElement.textContent = config.username || 'Student';
    }
    
    if (greetingsElement) {
      greetingsElement.textContent = getGreeting();
    }
    
    // Update recommended sites
    const recommendedElement = document.getElementById('recommended');
    if (recommendedElement && config.allowed_websites) {
      let recommendedSitesHtml = '';
      
      for (const [name, url] of Object.entries(config.allowed_websites)) {
        recommendedSitesHtml += `<li><a href='${url}' target="_blank" class="recommended-link">🦋 ${name}</a></li>`;
        
        // Store in Chrome storage
        chrome.storage.sync.set({ [name]: url });
      }
      
      recommendedElement.innerHTML = recommendedSitesHtml;
      
      // Add click tracking for recommended sites
      const links = recommendedElement.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          if (window.butterflyAPI) {
            window.butterflyAPI.logActivity(link.href, link.textContent);
          }
        });
      });
    }
    
    // Show connection status
    showConnectionStatus();
    
    return config;
  } catch (error) {
    console.error('Error loading enhanced config:', error);
    showToast('error', 'Error', 'Failed to load configuration');
    return {};
  }
}

// Show connection status
function showConnectionStatus() {
  const statusElement = document.getElementById('connection-status');
  
  if (!statusElement) {
    // Create status element
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connection-status';
    statusDiv.className = 'connection-status';
    
    // Add to header or create one
    const header = document.querySelector('header .container');
    if (header) {
      header.appendChild(statusDiv);
    }
  }
  
  const statusEl = document.getElementById('connection-status');
  
  if (window.butterflyAPI && window.butterflyAPI.hasHashKey()) {
    const hashKey = window.butterflyAPI.getHashKey();
    statusEl.innerHTML = `
      <div class="status-connected">
        <span class="status-icon">✅</span>
        <span>Connected to teacher (${hashKey})</span>
        <button onclick="disconnectFromTeacher()" class="disconnect-btn">Disconnect</button>
      </div>
    `;
  } else {
    statusEl.innerHTML = `
      <div class="status-disconnected">
        <span class="status-icon">⚠️</span>
        <span>Not connected to teacher</span>
        <button onclick="showHashKeyModal()" class="connect-btn">Connect</button>
      </div>
    `;
  }
}

// Disconnect from teacher
async function disconnectFromTeacher() {
  if (confirm('Are you sure you want to disconnect from your teacher?')) {
    await chrome.storage.sync.remove(['butterflyHashKey']);
    await chrome.storage.local.remove(['butterflyPolicies']);
    window.butterflyAPI.hashKey = null;
    window.butterflyAPI.policies = null;
    
    showToast('info', 'Disconnected', 'You have been disconnected from your teacher');
    location.reload();
  }
}

// Make it globally available
window.disconnectFromTeacher = disconnectFromTeacher;

// Enhanced search tracking
function trackSearch() {
  const searchForm = document.querySelector('#search form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      const searchInput = searchForm.querySelector('input[name="q"]');
      if (searchInput && window.butterflyAPI) {
        const query = searchInput.value;
        window.butterflyAPI.logActivity(
          `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          `Search: ${query}`
        );
      }
    });
  }
}

// Enhanced page load tracking
function trackPageLoad() {
  if (window.butterflyAPI) {
    window.butterflyAPI.logActivity(
      window.location.href,
      document.title || 'Butterfly Buddy - New Tab'
    );
  }
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize original features
  updateNetworkStatus();
  
  // Add network status event listeners
  window.addEventListener('offline', () => {
    updateNetworkStatus();
    showToast('warning', 'Warning', 'You are disconnected from the internet');
  });
  
  window.addEventListener('online', () => {
    updateNetworkStatus();
    showToast('success', 'Success', 'You are back online');
  });
  
  // Load enhanced configuration
  await loadEnhancedConfig();
  
  // Build history list
  buildTypedUrlList('typedUrl_div');
  
  // Add enhanced tracking
  trackSearch();
  trackPageLoad();
  
  // Show hash key modal if needed (handled by hash-setup.js)
});

// Add CSS for connection status
const statusCSS = `
  .connection-status {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }
  
  .status-connected {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-disconnected {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .connect-btn, .disconnect-btn {
    margin-left: auto;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .connect-btn {
    background: #f59e0b;
    color: white;
  }
  
  .connect-btn:hover {
    background: #d97706;
  }
  
  .disconnect-btn {
    background: #ef4444;
    color: white;
  }
  
  .disconnect-btn:hover {
    background: #dc2626;
  }
  
  .recommended-link {
    color: #f97316;
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
    display: block;
  }
  
  .recommended-link:hover {
    background: #fed7aa;
    color: #ea580c;
  }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = statusCSS;
document.head.appendChild(style);
