//Retrieves data from csv
let data = [];
let fieldNames;

// Get input field and datalist
const roomNumberInput = document.getElementById('roomNumberInput');
const roomNumberOptions = document.getElementById('roomNumberOptions');

//Input option data structures
const roomNumbers = new Set();
const dropDown1 = document.getElementById('fields');
const dropDown2 = document.getElementById('values');
let selectedField;

const helpButton = document.getElementById('helpButton');
const popup = document.getElementById('popup');
const closeButton = document.getElementById('closeButton');

helpButton.addEventListener('click', function() {
  popup.style.display = 'block';
});

closeButton.addEventListener('click', function() {
  popup.style.display = 'none';
});

fetch('courses.csv')
  .then(response => response.text())
  .then(csvData => {
    const lines = csvData.split('\n');
    const regex = /"(.*?)"/g;
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].match(regex).map(match => match.slice(1, -1));
      if (fields[10].length < 8){continue;}
      data.push(fields);
    }
    //Dynamically sets options in input fields based on values in csv
    fieldNames = lines[0].match(regex).map(match => match.slice(1, -1));
    addDropDownOptions();
    addOptionsToRoomInput();
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Generates options for first drop down box
function addDropDownOptions(){
  for (let i = 0; i < fieldNames.length; i++) {
    const option = document.createElement('option');
    option.text = fieldNames[i];
    option.value = fieldNames[i];
    dropDown1.appendChild(option);
  }
  selectedField = fieldNames[0]
}

// Extract unique room numbers from CSV
function addOptionsToRoomInput(){
  for (let i = 1; i < data.length; i++) {
    const roomNumber = data[i][11].trim(); // Modify index based on your CSV structure
    roomNumbers.add(roomNumber);
  }
  // Create options for room number input
  roomNumbers.forEach(roomNumber => {
    const option = document.createElement('option');
    option.value = roomNumber;
    roomNumberOptions.appendChild(option);
  });
}

// Event listener for input changes
roomNumberInput.addEventListener('input', function() {
  const input = this.value.toLowerCase();
  const options = roomNumberOptions.getElementsByTagName('option');

  // Filter options based on user input
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const optionValue = option.value.toLowerCase();

    if (optionValue.indexOf(input) !== -1) {
      option.style.display = ''; // Show matching option
    } else {
      option.style.display = 'none'; // Hide non-matching option
    }
  }
});

//Updates second drop down box
dropDown1.addEventListener('change', function() {
  selectedField = fieldNames.indexOf(this.value);
  const uniqueValues = new Set();
  for (let row = 1; row < data.length; row++) { 
    uniqueValues.add(data[row][selectedField]);
  }
  var i, L = dropDown2.options.length - 1;
  for(i = L; i >= 0; i--) {
      dropDown2.remove(i);
  }
  uniqueValues.forEach(function(value){
    const option = document.createElement('option');
    option.text = value;
    option.value = value;
    dropDown2.appendChild(option);
  })
});

let selectedValue
dropDown2.addEventListener('change', function() {
  selectedValue = this.value;
});

const heatMapCheckbox = document.getElementById('heatmap');

heatMapCheckbox.addEventListener('change', function() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  createChart();
});


function addCourses(){
  for (let i = 1; i < data.length; i++) {
    if(data[i][selectedField] != selectedValue){continue;}
    const isDuplicateCourse = activeCourses.some(existingCourse => {
      return existingCourse.crn === data[i][0];
    });
    if(isDuplicateCourse){continue;}
    const times = data[i][10].split(" - ");
    const course = {
      crn: data[i][0],
      days: data[i][9].replace(/ *\([^)]*\) */g, ""),
      startTime: times[0],
      endTime: times[1],
      courseName: data[i][4],
    };
    activeCourses.push(course);
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  createChart();
}

function removeCourses(){
  let crns = new Set();
  for (let i = 1; i < data.length; i++) {
    if (data[i][selectedField] == selectedValue){crns.add(data[i][0]);}
  }
  activeCourses = activeCourses.filter((course) => {
    return !crns.has(course.crn);
  });
  context.clearRect(0, 0, canvas.width, canvas.height);
  createChart();
}

//Courses actively on canvas
var activeCourses = [];

function timeToMinutes(time) {
  if (time.length !== 4) return;
  const hour = time[0] + time[1];
  const minute = time[2] + time[3];
  return parseFloat(hour) * 60  + parseFloat(minute);
}

const hoursOnLabel = 14;
const dayStart = 8;

const tooltipContainer = document.querySelector('.tooltip');

const canvas = document.getElementById("time-chart");
const context = canvas.getContext("2d");

dayCheck = ['M','T','W','R','F']

let mouseTimer;

// Add event listener to track mouse movement on the canvas
canvas.addEventListener('mousemove', handleMouseMove);




let timeLabelWidth;
let dayLabelHeight;
let chartHeight;
let chartWidth;

//Adds info from activeCourses being hovered over by mouse to a div under the canvas
function handleMouseMove(event) {
  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(() => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const dayOfWeek = dayCheck[Math.floor(((mouseX - timeLabelWidth)/ chartWidth)*5)];
    let timeOfDay = (((mouseY - dayLabelHeight) / chartHeight) * hoursOnLabel) + dayStart;
    let hourOfDay = Math.floor(timeOfDay);
    let minuteOfDay = Math.round((timeOfDay - hourOfDay) * 60);
    timeOfDay = hourOfDay * 100 + minuteOfDay;

    let mousedOnCourses = [];
    activeCourses.forEach((course) => {
      if (course.startTime < timeOfDay && course.endTime > timeOfDay && course.days.includes(dayOfWeek)){
        mousedOnCourses.push(course);
      }
    });
    if (activeCourses.length > 0) {showTooltip(mousedOnCourses,event);} 
    else {tooltipContainer.style.display = 'none';}
  }, 700); 
}


function showTooltip(mousedOnCourses, event) {
  tooltipContainer.innerHTML = '';
  // Create a new tooltip element for each course
  mousedOnCourses.forEach(course => {
    const tooltip = document.createElement('div');
    tooltip.textContent = course.courseName + "  " + course.startTime + ' - ' + course.endTime;
    tooltipContainer.appendChild(tooltip);
  });
  tooltipContainer.style.top = (event.clientY + 10) + 'px';
  tooltipContainer.style.left = (event.clientX + 10) + 'px';
  tooltipContainer.style.display = 'block';
}
function compareStringsUpToFirstNumber(str1, str2) {
  return str1.substring(0, str1.search(/\d/)) === str2.substring(0, str1.search(/\d/));
}

const warningMessages = document.getElementById('warningMessages');
const conflictMessages = document.getElementById('conflictMessages');

function validateNewCourse(newCourse){
  warningMessages.innerHTML = '';
  conflictMessages.innerHTML = '';
  let conflicts = [];
  let warnings = [];
  for (let i = 0; i < data.length; i++) {
    if(data[i][fieldNames.indexOf("DAYS")] && !data[i][fieldNames.indexOf("DAYS")].split('').some(char => newCourse.days.includes(char))){continue}
    if(newCourse.roomNumber == data[i][fieldNames.indexOf("ROOM")]){
      const times = data[i][fieldNames.indexOf("TIMES")].split(" - ");
      if(newCourse.startTime >= times[0] && newCourse.startTime <= times[1]){conflicts.push(i);}
      else if(newCourse.endTime >= times[0] && newCourse.endTime <= times[1]){conflicts.push(i);}
    }else{
      const sameCourseLevel = compareStringsUpToFirstNumber(data[i][fieldNames.indexOf("CRSE")],newCourse.courseName);
      if(sameCourseLevel){
        const times = data[i][fieldNames.indexOf("TIMES")].split(" - ");
        if(newCourse.startTime >= times[0] && newCourse.startTime <= times[1]){warnings.push(i);}
        else if(newCourse.endTime >= times[0] && newCourse.endTime <= times[1]){warnings.push(i);}
      }
    }
  }
  for(let i = 0; i < warnings.length; i++){
    const warning = document.createElement('p');
    warning.textContent = data[warnings[i]][0];
    warningMessages.appendChild(warning);
  }
  for(let i = 0; i < conflicts.length; i++){
    const conflict = document.createElement('p');
    conflict.textContent = data[conflicts[i]][0];
    conflictMessages.appendChild(conflict);
  }
}

const courseName = document.getElementById('courseName');
const newStartTime = document.getElementById('startTime');
const newEndTime = document.getElementById('endTime');
const roomNumber = document.getElementById('roomNumberInput')
const days = document.getElementById('daysInput');

const courseForm = document.getElementById('courseForm');
courseForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form submission

  const newCourse = {
    courseName: courseName.value,
    startTime: newStartTime.value,
    endTime: newEndTime.value,
    roomNumber: roomNumber.value,
    days: days.value,
  };
  validateNewCourse(newCourse);
  this.reset();
});

function createChart() {
   dayLabelHeight = 22;
  // Draw time labels
  const timeLabels = Array.from({ length: hoursOnLabel }, (_, index) => {
    const hour = ((index+dayStart-1)%12+1).toString().padStart(2, "0");
    return `${hour}:00`;
  });
  context.font = "14px Arial";
  context.textBaseline = "middle";
  context.textAlign = "right";
  timeLabelWidth = context.measureText(timeLabels[0]).width;

  chartHeight = canvas.height - dayLabelHeight
  chartWidth = canvas.width - timeLabelWidth
  timeLabels.forEach((label, index) => {
    const x = timeLabelWidth;
    const y = (index * chartHeight) / hoursOnLabel + dayLabelHeight;
    context.fillText(label, x, y);
  });
  // Draw day labels
  context.font = "bold "+dayLabelHeight+"px Arial";
  context.textBaseline = "middle";
  context.textAlign = "center";
  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  dayLabels.forEach((day, index) => {
    const x = (index * chartWidth) / 5 + timeLabelWidth + chartWidth / 10;
    const y = dayLabelHeight / 2;
    context.fillText(day, x, y);
  });
  // Draw activeCourses
  activeCourses.forEach((course) => {
    const startMinutes = timeToMinutes(course.startTime);
    const endMinutes = timeToMinutes(course.endTime);
    const durationMinutes = endMinutes - startMinutes;
    var i = course.days.length;
    while (i--) {
      const dayIndex = dayCheck.indexOf(course.days[i]);
      const x = (dayIndex * chartWidth) / 5 + timeLabelWidth;
      const y = dayLabelHeight + (((startMinutes-(dayStart*60))/(hoursOnLabel*60)) * chartHeight);
      const width = chartWidth / 5;
      const height = (durationMinutes * chartHeight) / (60*hoursOnLabel);
      const transparent = heatMapCheckbox.checked?.15:1;
      context.fillStyle = `rgba(255, 0, 0, ${transparent})`;
      context.fillRect(x, y, width, height);
      
    }
  });
  context.fillStyle = `rgba(0, 0, 0, 1)`;
}

window.addEventListener("load", createChart);
