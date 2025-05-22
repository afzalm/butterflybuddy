// Modern version of buddy.js without jQuery dependency

// Helper functions
function showToast(type, heading, text) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-heading">${heading}</div>
    <div class="toast-message">${text}</div>
  `;
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateNetworkStatus() {
  const infoElement = document.getElementById('info');
  
  if (navigator.onLine) {
    fetchIP().then(ip => {
      if (infoElement) {
        infoElement.textContent = `You are connected with IP address: ${ip}`;
      }
    });
  } else {
    if (infoElement) {
      infoElement.textContent = 'You are disconnected from the internet';
    }
  }
}

async function fetchIP() {
  try {
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    const data = await response.text();
    
    // Convert key-value pairs to object
    const dataObj = data.trim().split('\n').reduce((obj, pair) => {
      const [key, value] = pair.split('=');
      obj[key] = value;
      return obj;
    }, {});
    
    return dataObj.ip || 'Unknown';
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'Unknown';
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  
  if (hour >= 0 && hour < 12) {
    return 'Good Morning!';
  } else if (hour >= 12 && hour <= 17) {
    return 'Good Afternoon!';
  } else {
    return 'Good Evening!';
  }
}

// Load configuration
async function loadConfig() {
  try {
    const configUrl = chrome.runtime.getURL('data/config.json');
    const response = await fetch(configUrl);
    const config = await response.json();
    
    // Update user info
    const nameElement = document.getElementById('buddy_name');
    const greetingsElement = document.getElementById('greetings');
    
    if (nameElement) {
      nameElement.textContent = config.username || 'Buddy';
    }
    
    if (greetingsElement) {
      greetingsElement.textContent = getGreeting();
    }
    
    // Update recommended sites
    const recommendedElement = document.getElementById('recommended');
    if (recommendedElement && config.allowed_websites) {
      let recommendedSitesHtml = '';
      
      for (const [name, url] of Object.entries(config.allowed_websites)) {
        recommendedSitesHtml += `<li><a href='${url}' target="_blank">🦋 ${name}</a></li>`;
        
        // Store in Chrome storage
        chrome.storage.sync.set({ [name]: url });
      }
      
      recommendedElement.innerHTML = recommendedSitesHtml;
    }
    
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    showToast('error', 'Error', 'Failed to load configuration');
    return {};
  }
}

// Get browser history
async function buildTypedUrlList(divName) {
  const microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  const oneWeekAgo = new Date().getTime() - microsecondsPerWeek;
  const popupDiv = document.getElementById(divName);
  
  if (!popupDiv) return;
  
  try {
    // Get history items
    const historyItems = await chrome.history.search({
      text: '',              // Return every history item
      startTime: oneWeekAgo  // That was accessed less than one week ago
    });
    
    // Process each history item
    const urlToCount = {};
    const visitPromises = [];
    
    for (const item of historyItems) {
      const visitPromise = chrome.history.getVisits({ url: item.url })
        .then(visits => {
          // Count typed visits
          const typedCount = visits.filter(v => v.transition === 'typed').length;
          if (typedCount > 0) {
            urlToCount[item.url] = typedCount;
          }
        });
      
      visitPromises.push(visitPromise);
    }
    
    // Wait for all visit data
    await Promise.all(visitPromises);
    
    // Sort URLs by visit count
    const urlArray = Object.keys(urlToCount).sort((a, b) => {
      return urlToCount[b] - urlToCount[a];
    }).slice(0, 10); // Get top 10
    
    // Create HTML list
    const ul = document.createElement('ul');
    ul.className = 'history-list';
    
    for (const url of urlArray) {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      
      const li = document.createElement('li');
      li.appendChild(a);
      
      ul.appendChild(li);
    }
    
    popupDiv.innerHTML = '';
    popupDiv.appendChild(ul);
    
  } catch (error) {
    console.error('Error building history list:', error);
    popupDiv.innerHTML = '<p>Could not load history</p>';
  }
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Update network status on load
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
  
  // Load configuration
  await loadConfig();
  
  // Build history list
  buildTypedUrlList('typedUrl_div');
}); 