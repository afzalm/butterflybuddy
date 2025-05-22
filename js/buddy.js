function getIPifOnline() {
	$.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
	// Convert key-value pairs to JSON
	// https://stackoverflow.com/a/39284735/452587
	data = data.trim().split('\n').reduce(function(obj, pair) {
    pair = pair.split('=');
    return obj[pair[0]] = pair[1], obj;
	}, {});
	console.log(data);
	$('p#info').text('You are connected with IP address :' + data.ip);
	});
}

// When loading for the first time
if (navigator.onLine) {
  getIPifOnline();
} else {
  $('p#info').text('You are disconnected from the internet');
}

//During runtime
window.addEventListener('offline', function(e) { 
	console.log('Now you are offline'); 
	$('p#info').text('You are disconnected from the internet');
	$.toast({
		heading: 'Warning',
		text: 'Oops! You are disconnected from the internet',
		icon: 'warning'});
	});
	
window.addEventListener('online', function(e) { 
	console.log('Now you are back online');
	getIPifOnline();
	$.toast({
		heading: 'Success',
		text: 'Now you are back online',
		icon: 'success'});
	});


const my_config = chrome.runtime.getURL("data/config.json");
let user_name = "Buddy";

fetch(my_config)
		.then((response) => response.json()) //assuming file contains json
		.then((json) => readConfig(json));


// read json config file

function readConfig(obj){
	let name = obj.username;
	let school = obj.school_name;
	
	var recommended_sites_array = obj.allowed_websites;
	var recommended_sites_html = "";
	for (const [key, value] of Object.entries(recommended_sites_array)) {
		recommended_sites_html = `${recommended_sites_html}<li><a href='${value}'> &#129517; ${key}</a></li>`;
		// Using chrome sync data feature
		chrome.storage.sync.set({key: value});
		chrome.storage.sync.get(['key'], function(result) {
			console.log('Value currently for ' + key + ' is ' + result.key);
		  });
	  };

	//console.log(recommended_sites);
	user_name = name;
	$("#buddy_name").text(user_name);
	$("#greetings").text(greetings());
	$("#recommended").html(recommended_sites_html);
	
}

function greetings() {
	var day = new Date();
	var hr = day.getHours();
	var greeting = "";
	if (hr >= 0 && hr < 12) {
		greeting = "Good Morning!";
	} else if (hr >= 12 && hr <= 17) {
		greeting = "Good Afternoon!";
	} else {
		greeting = "Good Evening!";
	}
	return greeting;
}





// dump Json contenst to the console - Dev tool		
function dumpConsole(obj){
	//str = JSON.stringify(obj);
	str = JSON.stringify(obj, null, 4); // (Optional) beautiful indented output.
	console.log(str); // Logs output to dev tools console.
}		

// ------------------- Read and analyse History ---------------//

// Event listner for clicks on links in a browser action popup.
// Open the link in a new tab of the current window.
function onAnchorClick(event) {
	chrome.tabs.create({
	  selected: true,
	  url: event.srcElement.href
	});
	return false;
  }

// Given an array of URLs, build a DOM list of those URLs in the
// browser action popup.
function buildPopupDom(divName, data) {
	var popupDiv = document.getElementById(divName);
  
	var ul = document.createElement('ul');
	popupDiv.appendChild(ul);
  
	for (var i = 0, ie = data.length; i < ie; ++i) {
	  var a = document.createElement('a');
	  a.href = data[i];
	  a.appendChild(document.createTextNode(data[i]));
	  a.addEventListener('click', onAnchorClick);
  
	  var li = document.createElement('li');
	  li.appendChild(a);
  
	  ul.appendChild(li);
	}
  }
  
  // Search history to find up to ten links that a user has typed in,
  // and show those links in a popup.
  function buildTypedUrlList(divName) {
	// To look for history items visited in the last week,
	// subtract a week of microseconds from the current time.
	var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
	var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
  
	// Track the number of callbacks from chrome.history.getVisits()
	// that we expect to get.  When it reaches zero, we have all results.
	var numRequestsOutstanding = 0;
  
	chrome.history.search({
		'text': '',              // Return every history item....
		'startTime': oneWeekAgo  // that was accessed less than one week ago.
	  },
	  function(historyItems) {
		// For each history item, get details on all visits.
		for (var i = 0; i < historyItems.length; ++i) {
		  var url = historyItems[i].url;
		  var processVisitsWithUrl = function(url) {
			// We need the url of the visited item to process the visit.
			// Use a closure to bind the  url into the callback's args.
			return function(visitItems) {
			  processVisits(url, visitItems);
			};
		  };
		  chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
		  numRequestsOutstanding++;
		}
		if (!numRequestsOutstanding) {
		  onAllVisitsProcessed();
		}
	  });
  
  
	// Maps URLs to a count of the number of times the user typed that URL into
	// the omnibox.
	var urlToCount = {};
  
	// Callback for chrome.history.getVisits().  Counts the number of
	// times a user visited a URL by typing the address.
	var processVisits = function(url, visitItems) {
	  for (var i = 0, ie = visitItems.length; i < ie; ++i) {
		// Ignore items unless the user typed the URL.
		if (visitItems[i].transition != 'typed') {
		  continue;
		}
  
		if (!urlToCount[url]) {
		  urlToCount[url] = 0;
		}
  
		urlToCount[url]++;
	  }
  
	  // If this is the final outstanding call to processVisits(),
	  // then we have the final results.  Use them to build the list
	  // of URLs to show in the popup.
	  if (!--numRequestsOutstanding) {
		onAllVisitsProcessed();
	  }
	};
  
	// This function is called when we have the final list of URls to display.
	var onAllVisitsProcessed = function() {
	  // Get the top scorring urls.
	  urlArray = [];
	  for (var url in urlToCount) {
		urlArray.push(url);
	  }
  
	  // Sort the URLs by the number of times the user typed them.
	  urlArray.sort(function(a, b) {
		return urlToCount[b] - urlToCount[a];
	  });
  
	  buildPopupDom(divName, urlArray.slice(0, 10));
	};
  }
  
  document.addEventListener('DOMContentLoaded', function () {
	buildTypedUrlList("typedUrl_div");
  });