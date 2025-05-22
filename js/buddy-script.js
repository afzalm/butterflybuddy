function remove(el) {
    var element = el;
    element.remove();
  }

const user_data = document.querySelector('#buddy-data');

if (document.body.classList.contains("allowed-controlled")) {
  setTimeout(function() {
  document.body.innerHTML += '<div id="buddy-warning-box"><p id="buddy-warning-msg">Hey '+ user_data.dataset.name +', <br> You have reached maximum time allowed in this site. Please close the window</p><div id="buddy-warning-close" onclick="remove(this.parentElement)">(X)</div></div>';
},Number(user_data.dataset.maxtime));}

if (document.body.classList.contains("warning-ip")) {
  document.body.innerHTML += '<div style="" id="buddy-warning-box"><p id="buddy-warning-msg">Hey! '+ user_data.dataset.name +'<br>Is it a typing error?<br>Do verify your web address.<br>These number based sites could be very dangerous. Stay out of them!. <br><br> Do you want to proceed?</p><div id="buddy-warning-close" onclick="remove(this.parentElement)">(X)</div></div>';}

// alert('You are '+ user_data.dataset.name + ' from ' + user_data.dataset.school);

// Initialize library and start tracking time
TimeMe.initialize({
  currentPageName: "my-home-page", // current page
  idleTimeoutInSeconds: 5, // stop recording time due to inactivity
  //websocketOptions: { // optional
  //	websocketHost: "ws://your_host:your_port",
  //	appId: "insert-your-made-up-app-id"
  //}
});

TimeMe.callAfterTimeElapsedInSeconds(4, function () {
  console.log("The user has been using the page for 4 seconds! Let's prompt them with something.");
});

TimeMe.callAfterTimeElapsedInSeconds(9, function () {
  console.log("The user has been using the page for 9 seconds! Let's prompt them with something.");
});


window.onload = function () {
  TimeMe.trackTimeOnElement('area-of-interest-1');
  TimeMe.trackTimeOnElement('area-of-interest-2');
  setInterval(function () {
    let timeSpentOnPage = TimeMe.getTimeOnCurrentPageInSeconds();
    document.getElementById('timeInSeconds').textContent = timeSpentOnPage.toFixed(2);

    if (TimeMe.isUserCurrentlyOnPage && TimeMe.isUserCurrentlyIdle === false) {
      document.getElementById('activityStatus').textContent = "You are actively using this page."
    } else {
      document.getElementById('activityStatus').textContent = "You have left the page."
    }

  }, 37);
}
