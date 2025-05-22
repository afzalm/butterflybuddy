// Word of the Day functionality
async function updateWordOfDay() {
  try {
    const response = await fetch('data/words.json');
    const data = await response.json();
    
    // Get a random word from the array
    const randomIndex = Math.floor(Math.random() * data.words.length);
    const selectedWord = data.words[randomIndex];
    
    // Update the display
    document.getElementById('word-of-day').textContent = selectedWord.word;
    document.getElementById('word-meaning').textContent = selectedWord.meaning;
    document.getElementById('word-example').textContent = selectedWord.example;
  } catch (error) {
    console.error('Error loading word:', error);
    document.getElementById('word-of-day').textContent = 'Error loading word';
    document.getElementById('word-meaning').textContent = 'Please try again later';
    document.getElementById('word-example').textContent = '';
  }
}

// World Day functionality
async function updateWorldDay() {
  try {
    const response = await fetch('data/world-days.json');
    const data = await response.json();
    const worldDays = data.worldDays;
    
    // Get today's date
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentDay = today.getDate();
    
    // Find today's world day if it exists
    const todayWorldDay = worldDays.find(worldDay => {
      const [eventMonth, eventDay] = worldDay.date.split(' ');
      return eventMonth === currentMonth && parseInt(eventDay) === currentDay;
    });
    
    const worldDayContainer = document.getElementById('world-day-container');
    
    if (todayWorldDay) {
      // If there's a world day today, show it
      worldDayContainer.innerHTML = `
        <div class="world-day animate-fade-in">
          <div class="world-day-title text-xl font-bold mb-2">${todayWorldDay.title}</div>
          <div class="world-day-description text-gray-700">${todayWorldDay.description}</div>
          <div class="text-sm text-gray-600 mt-2">Today's Special Day!</div>
        </div>
      `;
    } else {
      // If no world day today, show a message
      worldDayContainer.innerHTML = `
        <div class="world-day animate-fade-in">
          <div class="world-day-title text-xl font-bold mb-2">No Special Day Today</div>
          <div class="world-day-description text-gray-700">
            There are no special world days today. Check back tomorrow for new celebrations!
          </div>
          <div class="text-sm text-gray-600 mt-2">
            Next special day: ${getNextWorldDay(worldDays, today)}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading world days:', error);
    const worldDayContainer = document.getElementById('world-day-container');
    worldDayContainer.innerHTML = `
      <div class="world-day animate-fade-in">
        <div class="world-day-title text-xl font-bold mb-2">Error Loading World Days</div>
        <div class="world-day-description text-gray-700">
          Unable to load world days. Please try again later.
        </div>
      </div>
    `;
  }
}

// Helper function to find the next world day
function getNextWorldDay(worldDays, today) {
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  
  // Sort world days by month and day
  const sortedDays = worldDays.map(worldDay => {
    const [month, dayNum] = worldDay.date.split(' ');
    const monthIndex = new Date(`${month} 1, 2000`).getMonth();
    return {
      ...worldDay,
      monthIndex,
      day: parseInt(dayNum)
    };
  }).sort((a, b) => {
    if (a.monthIndex === b.monthIndex) {
      return a.day - b.day;
    }
    return a.monthIndex - b.monthIndex;
  });
  
  // Find the next world day
  const nextDay = sortedDays.find(day => {
    if (day.monthIndex > currentMonth) return true;
    if (day.monthIndex === currentMonth && day.day > currentDay) return true;
    return false;
  });
  
  // If no next day found in this year, return the first day of next year
  if (!nextDay) {
    return sortedDays[0].date;
  }
  
  return nextDay.date;
}

// Initialize all features
async function initializeFeatures() {
  await updateWordOfDay();
  await updateWorldDay();
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeFeatures); 