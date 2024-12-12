const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı.');

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`${socket.id} odaya katıldı: ${room}`);
        socket.to(room).emit('user-joined', socket.id);
    });

    socket.on('signal', (data) => {
        io.to(data.target).emit('signal', {
            caller: socket.id,
            signal: data.signal,
        });
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı.');
        socket.broadcast.emit('user-disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server çalışıyor: http://localhost:${PORT}`));
