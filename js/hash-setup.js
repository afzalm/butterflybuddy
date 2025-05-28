// Hash key setup for Butterfly Buddy

// Show hash key input modal
function showHashKeyModal() {
  // Create modal HTML
  const modalHTML = `
    <div id="butterfly-hash-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        width: 90%;
      ">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #f97316, #fb923c);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 24px;
          ">🦋</div>
          <h2 style="margin: 0; color: #1f2937; font-size: 1.5rem; font-weight: 600;">
            Connect to Your Teacher
          </h2>
          <p style="margin: 0.5rem 0 0; color: #6b7280; font-size: 0.875rem;">
            Enter the 5-character hash key from your teacher
          </p>
        </div>
        
        <form id="hash-form">
          <div style="margin-bottom: 1rem;">
            <input 
              type="text" 
              id="hash-input" 
              placeholder="Enter hash key (e.g., ABC12)"
              maxlength="5"
              style="
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #d1d5db;
                border-radius: 0.5rem;
                font-size: 1rem;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                outline: none;
                transition: border-color 0.2s;
              "
              required
            />
          </div>
          
          <div style="display: flex; gap: 0.75rem;">
            <button 
              type="button" 
              id="skip-button"
              style="
                flex: 1;
                padding: 0.75rem;
                background: #f3f4f6;
                color: #374151;
                border: none;
                border-radius: 0.5rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
              "
            >
              Skip for now
            </button>
            <button 
              type="submit"
              style="
                flex: 1;
                padding: 0.75rem;
                background: linear-gradient(135deg, #f97316, #fb923c);
                color: white;
                border: none;
                border-radius: 0.5rem;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.2s;
              "
            >
              Connect
            </button>
          </div>
        </form>
        
        <div id="hash-error" style="
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          display: none;
        "></div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Add event listeners
  const modal = document.getElementById('butterfly-hash-modal');
  const form = document.getElementById('hash-form');
  const input = document.getElementById('hash-input');
  const skipButton = document.getElementById('skip-button');
  const errorDiv = document.getElementById('hash-error');

  // Auto-focus input
  input.focus();

  // Format input (uppercase, limit to 5 chars)
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().slice(0, 5);
    errorDiv.style.display = 'none';
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hashKey = input.value.trim();
    
    if (hashKey.length !== 5) {
      showError('Hash key must be exactly 5 characters');
      return;
    }

    // Show loading
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Connecting...';
    submitButton.disabled = true;

    try {
      // Set hash key and load policies
      const success = await window.butterflyAPI.setHashKey(hashKey);
      
      if (success && window.butterflyAPI.getPolicies()) {
        // Success - close modal and reload
        modal.remove();
        showSuccessToast('Connected successfully!');
        
        // Reload current content with new policies
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        showError('Invalid hash key or connection failed');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    } catch (error) {
      console.error('Error connecting:', error);
      showError('Connection failed. Please try again.');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });

  // Handle skip button
  skipButton.addEventListener('click', () => {
    modal.remove();
    showInfoToast('You can connect later from the extension popup');
  });

  // Helper function to show errors
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Show success toast
function showSuccessToast(message) {
  showToast('success', 'Success', message);
}

// Show info toast
function showInfoToast(message) {
  showToast('info', 'Info', message);
}

// Check if hash key setup is needed
async function checkHashKeySetup() {
  // Wait for API to load
  await new Promise(resolve => {
    if (window.butterflyAPI) {
      resolve();
    } else {
      setTimeout(resolve, 100);
    }
  });

  // Check if we have a hash key
  if (!window.butterflyAPI.hasHashKey()) {
    // Show modal after a short delay to let page load
    setTimeout(() => {
      showHashKeyModal();
    }, 1000);
  }
}

// Initialize hash key check when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkHashKeySetup);
} else {
  checkHashKeySetup();
}
