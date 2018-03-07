//在线用户
let onlineUsers = {};
let users = {};
//当前在线人数
let onlineCount = 0;

module.exports = (io) => {
  io.of('/connect').on('connection', function (socket) {
    console.log('/connect.connection')
    //监听新用户加入
    socket.on('login', function (obj) {
      console.log('/connect.login')
      //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
      socket.name = obj.userid;
  
      //检查在线列表，如果不在里面就加入
      if (!onlineUsers.hasOwnProperty(obj.userid)) {
        onlineUsers[obj.userid] = obj.username;
        //在线人数+1
        onlineCount++;
      }
  
      //向所有客户端广播用户上线
      io.emit('login', { onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj });
      // console.log(obj.username+'加入了聊天室');
    });
  
    socket.on('invite', () => {
      // socket.broadcast.emit('invite')
      io.emit('invite')
    })
  
    //监听用户退出
    socket.on('disconnect', function () {
      //将退出的用户从在线列表中删除
      if (onlineUsers.hasOwnProperty(socket.name)) {
        //退出用户的信息
        var obj = { userid: socket.name, username: onlineUsers[socket.name] };
  
        //删除
        delete onlineUsers[socket.name];
        //在线人数-1
        onlineCount--;
  
        //向所有客户端广播用户下线
        io.emit('logout', { onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj });
        // console.log(obj.username+'退出了聊天室');
      }
    });
  });
}

