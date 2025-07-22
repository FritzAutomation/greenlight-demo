# Greenlight Demo

This is a single-page interactive demo simulating the Greenlight system.

## How it works
- Select a machine (Laser, Brake Press, or Other).
- Click "Send 24V Signal" to simulate sending a signal from the machine.
- The Opto22 node reads the signal and translates it to a ladder logic action.

## Project Structure
- `public/index.html`: Main HTML file for the demo.
- `src/app.js`: Handles UI and interactivity.
- `src/greenlight.js`: Simulates Greenlight logic.
- `src/style.css`: Styles for the demo.
- `public/assets/`: Place for images or icons if needed.

## Usage
Open `public/index.html` in your browser to view the demo.
