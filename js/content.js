// Content script for Butterfly Buddy extension
// Fetch configuration
const my_config = chrome.runtime.getURL("data/config.json");

// Use async/await for better promise handling
(async function() {
  try {
    const response = await fetch(my_config);
    const json = await response.json();
    readConfig(json);
  } catch (error) {
    console.error("Error loading configuration:", error);
  }
})();

function readConfig(obj) {
    const origin = window.location.origin;
    const block_list = obj.blocked_websites + ""; // Added empty string to make it a string
    const control_list = obj.controlled_sites + "";
    const absolute_origin = origin.replace(/(^\w+:|^)\/\//, '');
    const ipv4 = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/;  
    const ipv6 = /^([0-9A-Fa-f]{0,4}:){2,7}([0-9A-Fa-f]{1,4}$|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\\.|$)){4})$/;
    
    const uname = obj.username;
    const uschool = obj.school_name;
    const max_timer = obj.controlled_sites_daily_max_time;

    const track_img_code = `<img src="https://techinteach.com/butterfly/buddy.svg.php?bname=${uname}&bsch=${uschool}&bpage=${window.location.href}" class="buddy_icon">`;
    const modal_box = '<div class="time-message"><h1><span id="timeInSeconds">0</span> <span>seconds</span></h1><h4 id="activityStatus">You are actively using this page.</h4></div>';
    
    // Save data to extension storage
    chrome.storage.sync.set({
      currentPage: window.location.href,
      visitTime: new Date().toISOString()
    });
    
    // Check if the URL is in Block list
    if (block_list.match(new RegExp("(?:^|,)" + origin + "(?:,|$)"))) {
        document.head.innerHTML = '<title>Blocked</title>';
        document.body.classList.add("blocked");
        document.body.innerHTML = "<div class='blocked'> <p id='blocked'>This site is blocked</p> </div>";
        document.body.innerHTML += track_img_code;
        injectBuddyScript(uname, uschool, max_timer);
    }
    // Check if URL is an IP address
    else if (ipv4.test(absolute_origin) || ipv6.test(absolute_origin)) {
        document.body.classList.add("warning-ip");
        document.body.innerHTML += track_img_code + modal_box;
        injectBuddyScript(uname, uschool, max_timer);
    }
    // Add report script to loading document    
    else if (control_list.match(new RegExp("(?:^|,)" + origin + "(?:,|$)"))) {
        document.body.classList.add("allowed-controlled");
        document.body.innerHTML += track_img_code + modal_box;
        injectBuddyScript(uname, uschool, max_timer);
    }
    else {
        document.body.classList.add("allowed");
        document.body.innerHTML += track_img_code + modal_box;
        injectBuddyScript(uname, uschool, max_timer);
    }      
}

// In Manifest V3, we should avoid injecting external scripts into web pages
// Instead, we can communicate with the background service worker
function injectBuddyScript(user_name, user_school, max_timer) {
    // Instead of injecting scripts, communicate with service worker
    chrome.runtime.sendMessage({
        action: "pageVisited",
        data: {
            userName: user_name,
            userSchool: user_school,
            maxTime: max_timer,
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString()
        }
    });
    
    // Load and inject the scripts that are essential to functionality
    // These must be listed in web_accessible_resources in manifest.json
    loadScriptFromExtension('js/timeme.min.js');
    loadScriptFromExtension('js/buddy-script.js', {
        name: user_name,
        school: user_school,
        maxtime: max_timer
    });
}

// Helper function to load scripts from the extension
function loadScriptFromExtension(scriptPath, attributes = {}) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(scriptPath);
    
    // Add any custom attributes
    for (const [key, value] of Object.entries(attributes)) {
        script.setAttribute(`data-${key}`, value);
    }
    
    (document.head || document.documentElement).appendChild(script);
    
    // Remove script after loading (optional)
    script.onload = function() {
        script.remove();
    };
}
