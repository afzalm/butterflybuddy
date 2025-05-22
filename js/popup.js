// Popup script for Butterfly Buddy extension

// When popup loads
document.addEventListener('DOMContentLoaded', async () => {
  // Get the current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  // Update status with current site
  const statusElement = document.getElementById('status');
  if (statusElement && currentTab && currentTab.url) {
    const domain = new URL(currentTab.url).hostname;
    statusElement.textContent = `Current site: ${domain}`;
  }
  
  // Set up site info button
  const siteInfoButton = document.getElementById('current-site-info');
  if (siteInfoButton) {
    siteInfoButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get site info from storage
      chrome.storage.sync.get(['currentPage', 'visitTime'], (result) => {
        if (result.currentPage && result.visitTime) {
          const visitDate = new Date(result.visitTime);
          const formattedDate = visitDate.toLocaleString();
          
          alert(`
            Current page: ${result.currentPage}
            First visited: ${formattedDate}
          `);
        } else {
          alert('No site information available');
        }
      });
    });
  }
  
  // Listen for messages from other parts of the extension
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateStatus') {
      if (statusElement) {
        statusElement.textContent = message.data.statusText;
      }
    }
  });
}); 