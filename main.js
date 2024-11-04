import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CDP from 'chrome-remote-interface'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const dataFilePath = path.join(app.getPath('userData'), 'userData.json');

// Initialize JSON data file if it doesn’t exist
function initializeDataFile() {
    if (!fs.existsSync(dataFilePath)) {
        const initialData = {
            mouse_clicks: 0,
            key_presses: 0,
            activity_log: []
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    }
}

// Helper function to read JSON data
function readDataFile() {
    const rawData = fs.readFileSync(dataFilePath);
    return JSON.parse(rawData);
}

// Helper function to write JSON data
function writeDataFile(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Create the main application window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', () => {
        sendCountsToRenderer();
        sendActivityLogToRenderer();

        // Send historical data for chart initialization
        const data = readDataFile();
        const previousData = data.activity_log.map(entry => ({
            timestamp: entry.timestamp,
            mouse_clicks: entry.mouse_clicks,
            key_presses: entry.key_presses,
        }));
        mainWindow.webContents.send('initializeChartData', previousData);
    });
}

// Log active application using Electron's webContents
async function logActiveWindow() {
    // Get the currently focused window
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        const title = focusedWindow.getTitle();
        const name = focusedWindow.getTitle(); // You might want to set this differently if needed

        let url = null;
        if (title.includes("Chrome")) {
            url = await getActiveTabURL(); // Fetch the active tab URL
        }

        // Format timestamp to a readable format
        const timestamp = new Date().toLocaleString('en-US');

        const data = readDataFile();
        const currentMouseClicks = data.mouse_clicks;
        const currentKeyPresses = data.key_presses;

        // Log the activity along with the counts
        data.activity_log.unshift({
            timestamp,
            app_name: name,
            window_title: title,
            url: url || "N/A", // Save the URL or "N/A" if not available
            mouse_clicks: currentMouseClicks,
            key_presses: currentKeyPresses,
        });

        writeDataFile(data);
        sendActivityLogToRenderer();
    } else {
        console.error("No focused window found.");
    }
}


// Function to get the current active tab URL in Chrome
async function getActiveTabURL() {
    try {
        const client = await CDP();
        const { Target, Page } = client;

        const targets = await Target.getTargets();
        const activeTarget = targets.find(target => target.active); // Find the active tab

        if (activeTarget) {
            await Page.enable();
            const { url } = activeTarget; // Get the URL of the active tab
            await client.close();
            return url; // Return the URL
        }

        await client.close();
        return null;
    } catch (error) {
        console.error("Error fetching active tab URL:", error);
        return null;
    }
}

function sendActivityLogToRenderer() {
    const data = readDataFile();
    console.log("Sending activity log:", data.activity_log.slice(0, 10));  
    mainWindow.webContents.send('updateActivityLog', data.activity_log.slice(0, 10));
}


// Handle mouse click updates from the renderer
ipcMain.on('mouseClick', async () => {
    const data = readDataFile();
    data.mouse_clicks += 1;
    writeDataFile(data);
    sendCountsToRenderer();
    await logActiveWindow();
});

// Handle key press updates from the renderer
ipcMain.on('keyPress', async () => {
    const data = readDataFile();
    data.key_presses += 1;
    writeDataFile(data);
    sendCountsToRenderer();
    await logActiveWindow();
});

// Send counts to the renderer
function sendCountsToRenderer() {
    const data = readDataFile();
    mainWindow.webContents.send('updateCounts', {
        mouse_clicks: data.mouse_clicks,
        key_presses: data.key_presses,
    });
}

// Clear logs on request from renderer
ipcMain.on('clearLogs', () => {
    const data = readDataFile();
    data.activity_log = [];
    writeDataFile(data);
    sendActivityLogToRenderer();
});

// Application event listeners
app.whenReady().then(() => {
    initializeDataFile();
    createWindow();
});

// Handle all windows closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Recreate a window in the app when the dock icon is clicked in macOS
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
