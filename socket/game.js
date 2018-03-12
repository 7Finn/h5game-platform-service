const gameModel = require('../model/game')
const URL = require("url");
const ROLE_MASTER = 0;
const ROLE_MAP = 1;
let room = {};
let masterSocket = null;
let mapSocket = null;
let flag = true;

function parsePlayerInfo(url) {
  const urlParse = URL.parse(url, true);
  const { gameId, roomId, role, userId } = urlParse.query;
  return { 
    gameId: +gameId, 
    roomId: +roomId, 
    userId: +userId,
    role: +role
  };
}

module.exports = (io) => {
  let gameIo = io.of('/game')
  gameIo.on('connection', (socket) => {
    console.log('/game.connection')
    let url = socket.request.headers.referer;
    let { gameId, roomId, role, userId } = parsePlayerInfo(url);
    if (!room[roomId]) {
      room[roomId] = {
        gameId: gameId,
        masters: {},
        maps: {}
      }
    }
    // 玩家
    if (role === ROLE_MASTER) {
      room[roomId].masters[userId] = socket;
      socket.join(roomId);
      socket.join(`${roomId}_${userId}`);
      socket.on('token', () => {
        socket.emit('token', { role: ROLE_MASTER });
      })

      socket.on('ready', () => {
        console.log('/game.ready')
        gameIo.to(`${roomId}_${userId}`).emit('start');
      })

      socket.on('broadcastData', (msg) => {
        gameIo.to(roomId).emit(msg.name, msg.data);
      })

      socket.on('sendData', (msg) => {
        if (room[roomId].maps[userId]) {
          room[roomId].maps[userId].emit(msg.name, msg.data);
        }
      })

      socket.on('win', () => {
        gameIo.to(roomId).emit('win');
      })
    } else if (role === ROLE_MAP) {
      room[roomId].maps[userId] = socket;
      socket.join(roomId);
      socket.join(`${roomId}_${userId}`);
      socket.on('token', () => {
        socket.emit('token', { role: ROLE_MAP });
      })
    }

    socket.on('disconnect', () => {
      console.log('disconnect');
      room[roomId] = null;
      if (masterSocket === socket) masterSocket = null;
      if (mapSocket === socket) mapSocket = null;
    })
  });
}