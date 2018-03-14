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
      //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
      socket.userData = {
        gameId: data.gameId,
        roomId: data.roomId,
        account: data.account
      }

      //检查在线列表，如果不在里面就加入
      if (!onlineUsers.hasOwnProperty(data.account)) {
        onlineUsers[data.account] = socket.id;
        //在线人数+1
        onlineCount++;
      }
    })
  })
}