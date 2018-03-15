//在线用户
let onlineUsers = {};
let users = {};
//当前在线人数
let onlineCount = 0;

module.exports = (socketio, db) => {
  let io = socketio.of('/iframe')

  io.on('connection', (socket) => {
    console.log('/iframe.connection')
    
    socket.on('init', data => {
      // 将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
      socket.userData = {
        game: data.game,
        roomId: data.roomId,
        player: data.player,
        competitor: data.competitor
      }

      console.log(socket.userData)

      // 加入房间
      socket.join(socket.userData.roomId)

      // 检查在线列表，如果不在里面就加入
      if (!onlineUsers.hasOwnProperty(socket.userData.player.account)) {
        onlineUsers[socket.userData.player.account] = socket.id;
        //在线人数+1
        onlineCount++;
      }

      // 检查在线列表，如果双方都在，则取消等待
      if (onlineUsers.hasOwnProperty(socket.userData.competitor.account)) {
        io.to(socket.userData.roomId).emit('all_player_in')
      }
    })
  })
}