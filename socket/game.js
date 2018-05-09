const URL = require("url");
const ROLE_MASTER = 0;
const ROLE_MAP = 1;
const ROOM_MAX_NUMBER = 2;
// 游戏房间
let room = {};
// 在线用户
let onlineUsers = {};

module.exports = (socketio, db) => {
  let usersModel = require('../model/user')(db)
  let gamesModel = require('../model/game')(db)
  let experienceModel = require('../model/experience')(db)
  /*
   * 管理平台的控制
   */
  let iframeIo = socketio.of('/iframe')
  /*
   * 游戏数据传输
   */
  let gameIo = socketio.of('/game')
  gameIo.on('connection', (socket) => {
    console.log('/game.connection')
    let url = socket.request.headers.referer;
    let { gameId, roomId, role, account } = parsePlayerInfo(url);

    socket.userData = {
      gameId,
      roomId,
      role,
      account
    }
    
    if (!room[roomId]) {
      room[roomId] = {
        playerCount: 0,
        gameId: gameId,
        masters: {},
        ready: {},
        maps: {}
      }
    }
    // 玩家
    if (role === ROLE_MASTER) {
      room[roomId].masters[account] = socket;
      room[roomId].ready[account] = false;
      room[roomId].playerCount = room[roomId].playerCount + 1;
      // 房间里所有
      socket.join(roomId);
      socket.join(`${roomId}_${account}`);
      socket.on('_token', () => {
        socket.emit('_token', { role: ROLE_MASTER });
      })

      socket.on('_ready', () => {
        console.log('/game.ready')
        room[roomId].ready[account] = true;
        if (onlineUsers[roomId] && onlineUsers[roomId].player[account]) {
          iframeIo.to(onlineUsers[roomId].player[account]).emit('start_ready')
        }
        for (let key in room[roomId].masters) {
          if (room[roomId].ready[key] !== true) {
            return;
          }
        }
        let timeout = 3000;
        let timer = setInterval(() => {
          if (!room[roomId]) return
          if (timeout > 0) {
            for (let key in room[roomId].masters) {
              iframeIo.to(onlineUsers[roomId].player[key]).emit('start_count_down', { time: timeout })
            }
          } else {
            clearInterval(timer)
            for (let key in room[roomId].masters) {
              iframeIo.to(onlineUsers[roomId].player[key]).emit('start_count_down', { time: timeout })
              gameIo.to(`${roomId}_${key}`).emit('_start');
            }
          }
          timeout -= 1000;
        }, 1000)
        
      })

      socket.on('_broadcast_data', (msg) => {
        gameIo.to(`${roomId}_${account}`).emit(msg.name, msg.data);
      })

      socket.on('_send_data', (msg) => {
        if (room[roomId].maps[account]) {
          room[roomId].maps[account].emit(msg.name, msg.data);
        }
      })

      socket.on('_platform_win', data => {
        for (let key in room[roomId].masters) {
          if (key === socket.userData.account) {
            iframeIo.to(onlineUsers[roomId].player[key]).emit('game_result', {
              win: true,
              msg: '你赢了'
            })
            experienceModel.addPlayTime(key, room[roomId].gameId, true)
          } else {
            iframeIo.to(onlineUsers[roomId].player[key]).emit('game_result', {
              win: false,
              msg: '你输了'
            })
            experienceModel.addPlayTime(key, room[roomId].gameId, false)
          }
        }
      })

    } else if (role === ROLE_MAP) {
      room[roomId].maps[account] = socket;
      socket.join(roomId);
      socket.join(`${roomId}_${account}`);
      socket.on('_token', () => {
        socket.emit('_token', { role: ROLE_MAP });
      })
    }

    socket.on('disconnect', () => {
      if (role === ROLE_MASTER) {
        room[roomId].masters[account] = null;
        room[roomId].ready[account] = false;
        room[roomId].playerCount = room[roomId].playerCount - 1;
      } else if (role === ROLE_MAP) {
        if (room[roomId]) room[roomId].maps[account] = null;
      }
      if (room[roomId].playerCount === 0) {
        room[roomId] = null;
      }
    })
  });

  iframeIo.on('connection', (socket) => {
    console.log('/iframe.connection')
    
    socket.on('init', data => {
      // 将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
      socket.userData = {
        game: data.game,
        roomId: data.roomId,
        player: data.player,
        competitor: data.competitor
      }
      const roomId = data.roomId,
            playerAccount = data.player.account,
            competitorAccount = data.competitor.account;

      // 加入房间
      socket.join(`iframe_${roomId}`)

      // 检查在线列表，如果不在里面就加入
      if (!onlineUsers.hasOwnProperty(roomId)) {
        onlineUsers[roomId] = {
          player: {},
          count: 0
        }
      }

      onlineUsers[roomId].player[playerAccount] = socket.id;
      onlineUsers[roomId].count++;

      // 检查在线列表，如果双方都在，则取消等待
      if (onlineUsers.hasOwnProperty(roomId) && onlineUsers[roomId].count === 2) {
        iframeIo.to(`iframe_${roomId}`).emit('all_player_in')
      }

      socket.on('disconnect', () => {
        delete onlineUsers[roomId].player[playerAccount]
        onlineUsers[roomId].count--;

        if (onlineUsers[roomId].count === 0) {
          delete onlineUsers[roomId]
        }
      })
    })
  })
}


function parsePlayerInfo(url) {
  const urlParse = URL.parse(url, true);
  const { gameId, roomId, role, account } = urlParse.query;
  return { 
    gameId: gameId, 
    roomId: roomId, 
    account: account,
    role: +role
  };
}