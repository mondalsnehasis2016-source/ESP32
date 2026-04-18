require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let data = {
    temperature: 0,
    voltage: 0,
    ax1: 0,
    ay1: 0,
    az1: 0,
    ax2: 0,
    ay2: 0,
    az2: 0
};

let clients = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

app.get('/api/data', (req, res) => {
    res.json(data);
});

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const clientId = Date.now();
    clients.push({ id: clientId, res });

    res.write(`data: ${JSON.stringify(data)}\n\n`);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

app.get('/api/change', (req, res) => {
    data.temperature = Number(req.query.temperature) || 0;
    data.voltage = Number(req.query.voltage) || 0;
    data.ax1 = Number(req.query.ax1) || 0;
    data.ay1 = Number(req.query.ay1) || 0;
    data.az1 = Number(req.query.az1) || 0;
    data.ax2 = Number(req.query.ax2) || 0;
    data.ay2 = Number(req.query.ay2) || 0;
    data.az2 = Number(req.query.az2) || 0;

    sendUpdate();
    res.json(data);
});

function sendUpdate() {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

setInterval(() => {
    clients.forEach(client => {
        client.res.write(`: keep-alive\n\n`);
    });
}, 25000);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});