// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
    // Initialize new player
    players[socket.id] = {
        x: Math.random() * 700,
        y: Math.random() * 500,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        message: '',
        messageTimer: 0
    };

    // Send current players to new player
    socket.emit('currentPlayers', players);

    // Broadcast new player to others
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        ...players[socket.id]
    });

    // Handle player movement
    socket.on('playerMovement', (movement) => {
        players[socket.id].x = movement.x;
        players[socket.id].y = movement.y;
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            x: players[socket.id].x,
            y: players[socket.id].y
        });
    });

    // Handle chat messages
    socket.on('chatMessage', (message) => {
        players[socket.id].message = message;
        players[socket.id].messageTimer = 150; // Display message for 5 seconds
        io.emit('playerMessage', {
            id: socket.id,
            message: message
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

http.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
