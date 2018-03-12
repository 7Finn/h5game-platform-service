
//在线用户
let onlineUsers = {};
let users = {};
//当前在线人数
let onlineCount = 0;

module.exports = (socketio, db) => {
  let io = socketio.of('/connect')
  let model = require('../model/user')(db)

  io.on('connection', (socket) => {
    console.log('/connect.connection')
    //监听新用户加入
    socket.on('login', (data) => {
      console.log('/connect.login')
      const { account, password } = data
      model.login(account, password)
        .then(res => {
          if (res.ret === 0) {
            const user = res.user
            //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
            socket.userData = {
              id: user.id,
              account: user.account,
              nickname: user.nickname,
              friends: user.friends
            }

            //检查在线列表，如果不在里面就加入
            if (!onlineUsers.hasOwnProperty(user.id)) {
              onlineUsers[user.id] = socket.id;
              //在线人数+1
              onlineCount++;
            }
    
            socket.emit('login', {
              ret: res.ret,
              onlineUsers: onlineUsers,
              onlineCount: onlineCount,
              user: user
            });
          } else {
            socket.emit('login', {
              ret: res.ret,
              onlineUsers: onlineUsers,
              onlineCount: onlineCount,
              user: user
            });
          }
        })
    })
  
    socket.on('registe', (data) => {
      console.log('/connect.registe')
      const { account, password } = data;
      model.registe(account, password).then(() => {
        socket.emit('registe', {
          ret: 0,
        })
      })
    })

    socket.on('search', (data) => {
      console.log('/connect.search')
      const { nickname } = data
      model.search(nickname)
        .then(res => {
          socket.emit('search', res)
        })
    })

    socket.on('add-contact', (data) => {
      console.log('/connect.add-contact')
      const { nickname } = data
      // 添加到数据库
      model.addContact(socket.userData.nickname, nickname)
        .then(res => {
          socket.emit('add-contact', res)
          if (res.ret === 0) {
            const userid = res.userid
            // 如果对方在线，就通知他
            if (onlineUsers.hasOwnProperty(userid)) {
              console.log(onlineUsers)
              io.sockets.socket(onlineUsers[userid]).emit('has-applicant-msg')
            }
          }
        })
    })
  
    //监听用户退出
    socket.on('disconnect', () => {
      // const user = socket.userDate
      // //将退出的用户从在线列表中删除
      // if (onlineUsers.hasOwnProperty(user.id)) {
      //   //退出用户的信息
      //   // var obj = {
      //   //   userid: socket.name,
      //   //   username: onlineUsers[socket.name]
      //   // };
  
      //   //删除
      //   delete onlineUsers[user.id];
      //   //在线人数-1
      //   onlineCount--;
  
      //   //向所有客户端广播用户下线
      //   // io.emit('logout', { onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj });
      //   // console.log(obj.username+'退出了聊天室');
      // }
    });
  });
}

