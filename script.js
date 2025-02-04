// Login Page Logic
if (window.location.pathname.includes('login.html')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const employeeId = document.getElementById('employeeId').value.trim();
        
        if (!employeeId || employeeId.length < 3) {
            alert("Please enter a valid Employee ID");
            return;
        }

        localStorage.setItem('employeeId', employeeId);
        window.location.href = 'index.html';
    });
}

// Google Sheets API Configuration
const CLIENT_ID = '405927973240-2tn5rdu9c8pbrsp4ojdabpu93mh5t8r8.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCr5SBfP5n43oirLfXrhRDegno2ReA77vM';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let gapiInited = false;
let gisInited = false;
let tokenClient;

// Google Sheets API Functions
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: ''
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

// Authorization Handlers
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw resp;
        document.getElementById('authorize_button').style.visibility = 'hidden';
        document.getElementById('signout_button').style.visibility = 'visible';
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('authorize_button').style.visibility = 'visible';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}

// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) window.location.href = 'login.html';

    // Employee Data
    const employeeData = [
        { id: "1001", name: "S. M. Sohail Kabir", shift: "09:00-18:00" },
        { id: "19723", name: "Md. Saddam Hossain", shift: "09:00-18:00" },
        { id: "25376", name: "Md. Alauddin", shift: "09:00-18:00" },
        { id: "44921", name: "Adnan Bin Sultan Ayon", shift: "09:00-18:00" },
        { id: "4090", name: "Md. Masud Bhuayin", shift: "09:00-18:00" },
        { id: "58625", name: "Md Rahatuzzaman Roni", shift: "09:00-18:00" },
        { id: "58641", name: "Md. Noushad Hossain", shift: "09:00-18:00" },
        { id: "58765", name: "Md. Iftekhar Uddin Shohan", shift: "09:00-18:00" },
        { id: "49647", name: "Roma Kanto Paul", shift: "09:00-18:00" },
        { id: "601", name: "Md. Sharif", shift: "09:00-18:00" },
        { id: "39661", name: "Joynal Abedin Hasan", shift: "09:00-18:00" },
        { id: "18003", name: "Md- Shariful Islam", shift: "08:00-17:00" },
        { id: "20011", name: "Md. Rasel Pramanik", shift: "08:00-17:00" },
        { id: "29205", name: "Md. Mamun Hossen", shift: "08:00-17:00" },
        { id: "4774", name: "Mohammad Sohel Rana", shift: "08:00-17:00" },
        { id: "19973", name: "Sukumar Adhikari", shift: "08:00-17:00" },
        { id: "588", name: "Md. Shahinur Rahman", shift: "08:00-17:00" },
        { id: "643", name: "Mohammad Ali", shift: "08:00-17:00" },
        { id: "43892", name: "Md. Sujon Mamud", shift: "08:00-17:00" },
        { id: "12375", name: "Anamul Kobir", shift: "08:00-17:00" },
        { id: "44267", name: "Refat Mridha", shift: "08:00-17:00" },
        { id: "9785", name: "Md. Shafiqul Islam", shift: "08:00-17:00" },
        { id: "622", name: "Md. Raju Ahmmed", shift: "08:00-17:00" },
        { id: "1446", name: "Shafiqul Islam", shift: "08:00-17:00" },
        { id: "72", name: "Khalilur Rahman", shift: "08:00-17:00" },
        { id: "6245", name: "Md. Shahin", shift: "08:00-17:00" }
    ];

    const currentEmployee = employeeData.find(emp => emp.id === employeeId);
    if (!currentEmployee) {
        alert("Invalid Employee ID");
        window.location.href = 'login.html';
    }

    // DOM Elements
    const timelineBar = document.getElementById('timelineBar');
    const taskList = document.getElementById('taskList');
    const timeScale = document.querySelector('.time-scale');
    const popup = document.querySelector('.popup');
    const entryForm = document.getElementById('entryForm');
    const overtimeInput = document.getElementById('overtimeHours');
    const datePicker = document.getElementById('datePicker');
    
    // Set default date and initialize
    datePicker.value = new Date().toISOString().split('T')[0];
    let selectedDate = datePicker.value;

    // Date Change Handler
    datePicker.addEventListener('change', function() {
        selectedDate = this.value;
        loadTasksForDate(selectedDate);
    });

    // Shift Time Calculations
    let [shiftStart, shiftEnd] = currentEmployee.shift.split('-').map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    });

    // Task Management
    let tasks = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Local Storage Functions
    function loadTasksForDate(date) {
        const storedData = localStorage.getItem(`tasks_${employeeId}_${date}`);
        tasks = storedData ? JSON.parse(storedData) : [];
        updateTimeline();
    }

    function saveTasksForDate(date) {
        localStorage.setItem(`tasks_${employeeId}_${date}`, JSON.stringify(tasks));
    }

    // Timeline Functions
    function minutesToTime(minutes) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${ampm}`;
    }

    function updateTimeline() {
        timeScale.innerHTML = '';
        timelineBar.innerHTML = '';
    
        let overtimeMinutes = parseFloat(overtimeInput.value) * 60 || 0;
        const totalTime = shiftEnd - shiftStart + overtimeMinutes;
        const updatedShiftEnd = shiftEnd + overtimeMinutes;
    
        for (let i = shiftStart; i <= updatedShiftEnd; i += 60) {
          const timeLabel = document.createElement('div');
          timeLabel.textContent = minutesToTime(i);
          timeScale.appendChild(timeLabel);
        }
    
        taskList.innerHTML = '';
        tasks.forEach((task) => {
          const taskItem = document.createElement('li');
          taskItem.textContent = `${task.type} (${minutesToTime(task.start)} - ${minutesToTime(task.end)})`;
          taskList.appendChild(taskItem);
    
          const taskSegment = document.createElement('div');
          taskSegment.classList.add('timeline-segment');
          taskSegment.style.position = 'absolute';
          taskSegment.style.top = '0';
          taskSegment.style.height = '100%';
          taskSegment.style.backgroundColor = task.color;
          taskSegment.style.left = `${((task.start - shiftStart) / totalTime) * 100}%`;
          taskSegment.style.width = `${((task.end - task.start) / totalTime) * 100}%`;
          taskSegment.textContent = task.type;
          taskSegment.style.color = '#ffffff';
          taskSegment.style.textAlign = 'center';
          timelineBar.appendChild(taskSegment);
        });
      }

    // Event Listeners
    function handleClickOrDrag(xPos) {
        const rect = timelineBar.getBoundingClientRect();
        const percent = Math.min(Math.max((xPos - rect.left) / rect.width, 0), 1);
        const taskEnd = shiftStart + Math.round((shiftEnd + parseFloat(overtimeInput.value) * 60 - shiftStart) * percent);
        timelineBar.dataset.endPercent = percent;
    
        if (!taskPreviewSegment) {
          taskPreviewSegment = document.createElement('div');
          taskPreviewSegment.classList.add('timeline-segment');
          taskPreviewSegment.style.position = 'absolute';
          taskPreviewSegment.style.top = '0';
          taskPreviewSegment.style.height = '100%';
          taskPreviewSegment.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';
          timelineBar.appendChild(taskPreviewSegment);
        }
    
        const taskWidth = `${Math.abs(dragStartX - xPos) / rect.width * 100}%`;
        taskPreviewSegment.style.left = `${Math.min(dragStartX, xPos) / rect.width * 100}%`;
        taskPreviewSegment.style.width = taskWidth;
      }
    
      timelineBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        taskPreviewSegment = null;
      });
    
      timelineBar.addEventListener('mousemove', (e) => {
        if (isDragging) {
          handleClickOrDrag(e.clientX);
        }
      });
    
      timelineBar.addEventListener('mouseup', (e) => {
        isDragging = false;
        handleClickOrDrag(e.clientX);
        popup.style.display = 'flex';
      });
    
      timelineBar.addEventListener('click', (e) => {
        if (!isDragging) {
          handleClickOrDrag(e.clientX);
          popup.style.display = 'flex';
        }
      });
    
      overtimeInput.addEventListener('input', updateTimeline);
    
      entryForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const taskType = document.getElementById('taskType').value;
        const taskDesc = document.getElementById('taskDesc').value;
        const tgNumber = document.getElementById('tgNumber').value;
        const status = document.getElementById('status').value;
    

        // Validation
        if (!tgNumber) {
            alert('Please enter the TG number');
            return;
        }

        // Task Creation
        const taskStart = tasks.length > 0 ? tasks[tasks.length - 1].end : shiftStart;
        const taskEndPercent = parseFloat(timelineBar.dataset.endPercent) || 0;
        const overtimeMinutes = parseFloat(overtimeInput.value) * 60 || 0;
        const adjustedShiftEnd = shiftEnd + overtimeMinutes;
        const taskEnd = shiftStart + Math.round((adjustedShiftEnd - shiftStart) * taskEndPercent);

        if (taskEnd <= taskStart) {
            alert('End time must be after the last task');
            return;
        }

        // Save to Local Storage
        const task = {
            type: `${taskType} (TG:${tgNumber})`,
            description: taskDesc,
            start: taskStart,
            end: taskEnd,
            color: colors[tasks.length % colors.length],
            date: selectedDate
        };

        tasks.push(task);
        saveTasksForDate(selectedDate);

        // Save to Google Sheets
        const sheetData = [
            currentEmployee.id,
            selectedDate,
            minutesToTime(task.start),
            minutesToTime(task.end),
            taskType,
            status,
            tgNumber,
            taskDesc
        ];

        await appendDataToSheet(sheetData);

        updateTimeline();
        popup.style.display = 'none';
        this.reset();
    });

    // Initial Load
    loadTasksForDate(selectedDate);
    document.getElementById('loggedInId').textContent = currentEmployee.id;
    document.getElementById('loggedInName').textContent = currentEmployee.name;
});

// Google Sheets Functions
async function appendDataToSheet(data) {
    const body = { values: [data] };
    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: '1u1f3fiMF2EefFp7TidNrirmwBr20lnru5cNQhaU_ZoA',
            range: 'Main!A2:H',
            valueInputOption: 'RAW',
            resource: body,
        });
        console.log('Data saved to Google Sheets');
    } catch (err) {
        console.error('Sheets API error:', err);
    }
}

// Initialize Google API
gapiLoaded();
gisLoaded();