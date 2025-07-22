import { loadChartJs, createUptimeChart, updateUptimeChartLabels } from './chart.js';

let uptime = 0;
let downtime = 0;
let totalUptime = 0;
let totalDowntime = 0;
let signalOn = false;
let uptimeInterval = null;
let downtimeInterval = null;
let onDuration = 4; // seconds
let soundEnabled = true;
// Chart.js uptime history
let uptimeHistory = Array(15).fill(0); // 15 slots, 1 per minute
let chart = null;
let chartTimer = null;
let currentUptime = 0;
// Sound effects
const beep = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3');
const relay = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3');
const click = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3');

function playSound(audio) {
    if (soundEnabled && audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function updateTotals() {
    document.getElementById('total-uptime').textContent = `Total Uptime: ${totalUptime} s`;
    document.getElementById('total-downtime').textContent = `Total Downtime: ${totalDowntime} s`;
}

function logEvent(msg) {
    const log = document.getElementById('event-log');
    const now = new Date();
    const time = now.toLocaleTimeString();
    const li = document.createElement('li');
    li.textContent = `[${time}] ${msg}`;
    log.appendChild(li);
    // Keep log to last 10 events
    while (log.children.length > 10) log.removeChild(log.firstChild);
}

function processGreenlightSignal() {
    // Always return 1 for signal ON
    return 1;
}


function startUptime() {
    if (uptimeInterval) return;
    uptimeInterval = setInterval(() => {
        uptime++;
        totalUptime++;
        document.getElementById('uptime-status').textContent = `Uptime: ${uptime} s`;
        updateTotals();
        currentUptime = uptime;
    }, 1000);
}

function stopUptime() {
    clearInterval(uptimeInterval);
    uptimeInterval = null;
    // When signal turns off, update chart with 0 (off)
    updateUptimeHistory(0);
    currentUptime = 0;
}
function updateUptimeHistory(isRunning) {
    uptimeHistory.shift();
    uptimeHistory.push(isRunning ? 1 : 0);
    if (chart) {
        chart.data.datasets[0].data = [...uptimeHistory];
        if (typeof updateUptimeChartLabels === 'function') updateUptimeChartLabels(chart);
        chart.update('none');
    }
}

function startChartTimer() {
    if (chartTimer) clearInterval(chartTimer);
    chartTimer = setInterval(() => {
        // Every minute, push current running state
        updateUptimeHistory(signalOn);
    }, 60000);
}

function startDowntime() {
    if (downtimeInterval) return;
    downtimeInterval = setInterval(() => {
        downtime++;
        totalDowntime++;
        document.getElementById('downtime-status').textContent = `Downtime: ${downtime} s`;
        updateTotals();
    }, 1000);
}

function stopDowntime() {
    clearInterval(downtimeInterval);
    downtimeInterval = null;
}


function animatePulse(pulseId) {
    const pulse = document.getElementById(pulseId);
    pulse.classList.remove('active');
    // Force reflow for restart animation
    void pulse.offsetWidth;
    pulse.classList.add('active');
    setTimeout(() => pulse.classList.remove('active'), 1200);
}

function setLadderIndicator(state) {
    const ladderIndicator = document.getElementById('ladder-indicator');
    if (state === 'on') {
        ladderIndicator.textContent = 'ON';
        ladderIndicator.classList.add('on');
        ladderIndicator.classList.remove('off');
    } else {
        ladderIndicator.textContent = 'OFF';
        ladderIndicator.classList.add('off');
        ladderIndicator.classList.remove('on');
    }
}

function resetDemo() {
    uptime = 0;
    downtime = 0;
    signalOn = false;
    stopUptime();
    stopDowntime();
    document.getElementById('signal-status').textContent = 'No signal sent.';
    document.getElementById('opto-status').textContent = 'Opto22 Node: Waiting...';
    document.getElementById('binary-status').textContent = 'Binary Value: --';
    document.getElementById('ladder-status').textContent = 'Ladder: No action.';
    document.getElementById('uptime-status').textContent = 'Uptime: 0 s';
    document.getElementById('downtime-status').textContent = 'Downtime: 0 s';
    setLadderIndicator('off');
    [document.getElementById('laser-step'), document.getElementById('opto-step'), document.getElementById('ladder-step')].forEach(el => el.classList.remove('active'));
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('event-log').innerHTML = '';
    updateTotals();
    startDowntime();
    // Reset chart
    uptimeHistory = Array(15).fill(0);
    if (chart) {
        chart.data.datasets[0].data = [...uptimeHistory];
        chart.update('none');
    }
    currentUptime = 0;
}



// Ensure all event listeners and initialization run after DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    loadChartJs(() => {
        const ctx = document.getElementById('uptimeChart').getContext('2d');
        chart = createUptimeChart(ctx);
        startChartTimer();
    });

    document.getElementById('reset-demo').addEventListener('click', resetDemo);
    document.getElementById('help-btn').addEventListener('click', () => {
        document.getElementById('help-modal').style.display = 'flex';
    });
    document.getElementById('close-help').addEventListener('click', () => {
        document.getElementById('help-modal').style.display = 'none';
    });


    // Start downtime counter on load
    startDowntime();
    setLadderIndicator('off');
    updateTotals();

    document.getElementById('send-signal').addEventListener('click', () => {
        // Get ON duration from input
        const onInput = document.getElementById('on-duration');
        let userOn = parseInt(onInput.value, 10);
        if (isNaN(userOn) || userOn < 1) userOn = 4;
        onDuration = userOn;

        document.getElementById('signal-status').textContent = `24V signal sent from Laser.`;
        document.getElementById('opto-status').textContent = 'Opto22 Node: Reading signal...';
        const laserStep = document.getElementById('laser-step');
        const optoStep = document.getElementById('opto-step');
        const ladderStep = document.getElementById('ladder-step');
        [laserStep, optoStep, ladderStep].forEach(el => el.classList.remove('active'));
        document.getElementById('progress-bar').style.width = '0%';

        // Step 1: Laser active
        laserStep.classList.add('active');
        animatePulse('pulse-laser-opto');
        playSound(beep);
        logEvent('Laser sent 24V signal.');
        document.getElementById('progress-bar').style.width = '33%';
        setTimeout(() => {
            laserStep.classList.remove('active');
            optoStep.classList.add('active');
            document.getElementById('opto-status').textContent = 'Opto22 Node: Translating to binary...';
            animatePulse('pulse-opto-ladder');
            playSound(relay);
            logEvent('Opto22 Node received and translated signal.');
            document.getElementById('progress-bar').style.width = '66%';
            // Step 2: Opto22 active
            setTimeout(() => {
                optoStep.classList.remove('active');
                ladderStep.classList.add('active');
                const binaryValue = processGreenlightSignal();
                document.getElementById('binary-status').textContent = `Binary Value: ${binaryValue}`;
                document.getElementById('opto-status').textContent = 'Opto22 Node: Signal received!';
                document.getElementById('ladder-status').textContent = `Ladder: Running...`;
                // Step 3: Ladder active, turn indicator ON
                setLadderIndicator('on');
                signalOn = true;
                startUptime();
                stopDowntime();
                // Chart: update immediately to show running
                updateUptimeHistory(1);
                playSound(click);
                logEvent('Ladder logic: Machine ON (Uptime counting).');
                document.getElementById('progress-bar').style.width = '100%';
                setTimeout(() => {
                    ladderStep.classList.remove('active');
                    document.getElementById('binary-status').textContent = `Binary Value: 0`;
                    document.getElementById('ladder-status').textContent = `Ladder: Machine is OFF.`;
                    setLadderIndicator('off');
                    signalOn = false;
                    stopUptime();
                    startDowntime();
                    // Chart: update immediately to show not running
                    updateUptimeHistory(0);
                    logEvent('Ladder logic: Machine OFF (Downtime counting).');
                    document.getElementById('progress-bar').style.width = '0%';

                    // Reset status panel card to initial state (except totals)
                    document.getElementById('signal-status').textContent = 'No signal sent.';
                    document.getElementById('opto-status').textContent = 'Opto22 Node: Waiting...';
                    document.getElementById('binary-status').textContent = 'Binary Value: --';
                    document.getElementById('ladder-status').textContent = 'Ladder: No action.';
                }, onDuration * 1000); // Ladder step visible for ON duration
            }, 2000); // Opto22 step visible for 2 seconds
        }, 1600); // Laser step visible for 1.6 seconds
    });
});
