const { ipcRenderer } = require('electron');

// Dynamic data for the chart
const mouseClicksData = [];
const keyPressesData = [];
const labelsData = [];
let clickCount = 0;
let keyPressCount = 0;

const ctx = document.getElementById('activityChart').getContext('2d');
const activityChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labelsData,
        datasets: [
            {
                label: 'Mouse Clicks',
                data: mouseClicksData,
                backgroundColor: '#2a9d8f',
            },
            {
                label: 'Key Presses',
                data: keyPressesData,
                backgroundColor: '#e76f51',
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Activity Over Time'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Track mouse clicks and key presses
window.addEventListener('click', (event) => {
    if (event.target.id !== 'clear-logs') {
        clickCount++;
        ipcRenderer.send('mouseClick');
        updateClickChart(); // Update chart for clicks only
    }
});

window.addEventListener('keydown', () => {
    keyPressCount++;
    ipcRenderer.send('keyPress');
    updateKeyPressChart(); // Update chart for key presses only
});

// Function to update chart data for mouse clicks
function updateClickChart() {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    labelsData.unshift(currentTime);
    mouseClicksData.unshift(clickCount);
    keyPressesData.unshift(keyPressCount > 0 ? keyPressesData[0] : 0); // Keep previous key press data

    if (labelsData.length > 10) {
        labelsData.pop();
        mouseClicksData.pop();
        keyPressesData.pop();
    }
    activityChart.update();
}

// Function to update chart data for key presses
function updateKeyPressChart() {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    labelsData.unshift(currentTime);
    keyPressesData.unshift(keyPressCount);
    mouseClicksData.unshift(mouseClicksData[0] > 0 ? mouseClicksData[0] : 0); // Keep previous click data

    if (labelsData.length > 10) {
        labelsData.pop();
        mouseClicksData.pop();
        keyPressesData.pop();
    }
    activityChart.update();
}

// Update counts in the dashboard
ipcRenderer.on('updateCounts', (event, counts) => {
    document.getElementById('mouse-clicks').innerText = counts.mouse_clicks;
    document.getElementById('key-presses').innerText = counts.key_presses;
});


// Update activity log in the dashboard
ipcRenderer.on('updateActivityLog', (event, logEntries) => {
    const activityLogTable = document.getElementById('activity-log');
    activityLogTable.innerHTML = ''; // Clear previous entries

    logEntries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.timestamp}</td>
            <td>${entry.app_name}</td>
            <td>${entry.window_title}</td>
            <td>${entry.url}</td>
        `;
        activityLogTable.appendChild(row);
    });
});



// Initialize chart data
ipcRenderer.on('initializeChartData', (event, chartData) => {
    chartData.forEach(entry => {
        labelsData.push(entry.timestamp);
        mouseClicksData.push(entry.mouse_clicks);
        keyPressesData.push(entry.key_presses);
    });
    activityChart.update();
});

// Clear logs button
document.getElementById('clear-logs').addEventListener('click', () => {
    ipcRenderer.send('clearLogs');
});

