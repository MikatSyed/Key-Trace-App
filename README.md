Keytrace - Desktop Activity Tracker

Keytrace is a cross-platform desktop app that monitors mouse clicks, keyboard presses, application usage, and URLs, providing an activity dashboard for better insights into computer usage.

Features

Mouse & Keyboard Counter: Tracks and displays total mouse clicks and keypresses.

Activity Logging: Records active applications and logs website URLs (Chrome, Firefox).

Local Storage: Saves all activity data in a JSON file.

Installation & Setup

Windows

Open a terminal in the project root and run:
bash

yarn

yarn build:win 

Locate keytrace Setup 1.0.0.exe in the dist folder and double-click to install.

Launch Keytrace from the Start Menu or desktop icon.

macOS

Open a terminal in the project root and run:
bash

yarn

yarn build:mac

Find the .dmg file in the dist folder (e.g., keytrace-1.0.0.dmg), double-click to mount, then drag the app icon to /Applications.

Launch from /Applications or via terminal:
bash

open /Applications/Keytrace.app

Development

Requirements: Node.js, Yarn

Clone and navigate to the project:
bash

git clone <repository-url> && cd keytrace

Install dependencies:

bash

yarn install


Start the development server:

bash

yarn start

