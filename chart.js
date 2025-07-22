// Chart.js CDN loader for demo (remove if using npm)
export function loadChartJs(callback) {
    if (window.Chart) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = callback;
    document.head.appendChild(script);
}
function getLast5MinuteLabels() {
    const now = new Date();
    const labels = [];
    for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60000);
        // Show label only for the first and last bar
        if (i === 0 || i === 4) {
            labels.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
            labels.push('');
        }
    }
    return labels;
}

export function createUptimeChart(ctx) {
    return new window.Chart(ctx, {
        type: 'bar',
        data: {
            labels: getLast5MinuteLabels(),
            datasets: [{
                label: 'Running',
                data: Array(5).fill(0), // 0 = off, 1 = running
                backgroundColor: function(context) {
                    const value = context.raw;
                    return value === 1 ? '#43a047' : '#fff';
                },
                borderWidth: 0,
                borderRadius: 2,
                barPercentage: 0.7,
                categoryPercentage: 0.7,
            }]
        },
        options: {
            responsive: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45,
                        color: '#333',
                        font: { size: 9 }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    ticks: { stepSize: 1, callback: v => v === 1 ? 'ON' : 'OFF', color: '#333', font: { size: 12 } },
                    title: { display: false },
                    grid: { color: '#eee' }
                }
            }
        }
    });
}
// Chart.js CDN loader for demo (remove if using npm)
export function updateUptimeChartLabels(chart) {
    if (!chart) return;
    chart.data.labels = getLast5MinuteLabels();
    chart.update('none');
}
