const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = 8000;

server.listen(port, () => {
  console.log(`Server is running on port ${port} :)`);
});

app.use(express.static('./../client'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../client/index.html');
});

app.get('/:filename', (req, res) => {
  res.json({
    filename: req.params.filename
  });
  res.sendFile(__dirname + '/../client/' + req.params.filename);
});


io.on('connection', (socket) => {
  console.log('socket connection', socket.id);

  socket.on('message', (data) => {
    console.log(`message: ${data.msg}`);
    io.emit('message', data.msg);
  });

  socket.on('trades', (trade) => {
    console.log(`trades: trade`);
    io.emit('trades', trade);
  });

  socket.on('disconnect', () => {
    console.log('disconnected');
  });

});