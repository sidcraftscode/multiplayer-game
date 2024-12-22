const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const chatInput = document.getElementById('chatInput');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Connect to server
const socket = io();

// Game state
const players = {};
let myId = null;

// Handle keyboard input
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Chat input handling
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        socket.emit('chatMessage', chatInput.value.trim());
        chatInput.value = '';
    }
});

// Socket event handlers
socket.on('connect', () => {
    myId = socket.id;
});

socket.on('currentPlayers', (serverPlayers) => {
    Object.assign(players, serverPlayers);
});

socket.on('newPlayer', (player) => {
    players[player.id] = player;
});

socket.on('playerMoved', (playerInfo) => {
    if (players[playerInfo.id]) {
        players[playerInfo.id].x = playerInfo.x;
        players[playerInfo.id].y = playerInfo.y;
    }
});

socket.on('playerMessage', (messageInfo) => {
    if (players[messageInfo.id]) {
        players[messageInfo.id].message = messageInfo.message;
        players[messageInfo.id].messageTimer = 150;
    }
});

socket.on('playerDisconnected', (playerId) => {
    delete players[playerId];
});

// Game loop
function update() {
    if (myId && players[myId]) {
        // Handle movement
        const speed = 5;
        if (keys['ArrowUp']) players[myId].y -= speed;
        if (keys['ArrowDown']) players[myId].y += speed;
        if (keys['ArrowLeft']) players[myId].x -= speed;
        if (keys['ArrowRight']) players[myId].x += speed;

        // Keep player in bounds
        players[myId].x = Math.max(20, Math.min(canvas.width - 20, players[myId].x));
        players[myId].y = Math.max(20, Math.min(canvas.height - 20, players[myId].y));

        // Emit movement
        socket.emit('playerMovement', {
            x: players[myId].x,
            y: players[myId].y
        });
    }

    // Update message timers
    Object.values(players).forEach(player => {
        if (player.messageTimer > 0) {
            player.messageTimer--;
        }
    });
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all players
    Object.entries(players).forEach(([id, player]) => {
        // Draw player circle
        ctx.beginPath();
        ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();

        // Draw chat bubble if message exists
        if (player.message && player.messageTimer > 0) {
            ctx.font = '14px Arial';
            const metrics = ctx.measureText(player.message);
            const padding = 5;
            const bubbleWidth = metrics.width + padding * 2;
            const bubbleHeight = 24;
            const bubbleY = player.y - 50;

            // Draw bubble background
            ctx.fillStyle = 'white';
            ctx.fillRect(
                player.x - bubbleWidth / 2,
                bubbleY,
                bubbleWidth,
                bubbleHeight
            );

            // Draw bubble border
            ctx.strokeStyle = 'black';
            ctx.strokeRect(
                player.x - bubbleWidth / 2,
                bubbleY,
                bubbleWidth,
                bubbleHeight
            );

            // Draw message text
            ctx.fillStyle = 'black';
            ctx.fillText(
                player.message,
                player.x - metrics.width / 2,
                bubbleY + 17
            );
        }
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
