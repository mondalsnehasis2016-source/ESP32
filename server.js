require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let temperature = 0;
let clients = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/temp', (req, res) => {
    res.json({ temperature });
});

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const clientId = Date.now();
    clients.push({ id: clientId, res });

    res.write(`data: ${JSON.stringify({ temperature })}\n\n`);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

app.post('/api/set-temp', (req, res) => {
    temperature = Number(req.body.temperature) || 0;
    sendTemperatureUpdate();
    res.json({ temperature });
});

function sendTemperatureUpdate() {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ temperature })}\n\n`);
    });
}

setInterval(() => {
    clients.forEach(client => {
        client.res.write(`: keep-alive\n\n`);
    });
}, 25000);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});