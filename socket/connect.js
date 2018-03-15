
//在线用户
let onlineUsers = {};
let users = {};
//当前在线人数
let onlineCount = 0;

module.exports = (socketio, db) => {
  let io = socketio.of('/connect')
  let usersModel = require('../model/user')(db)
  let gamesModel = require('../model/game')(db)

  io.on('connection', (socket) => {
    console.log('/connect.connection')
    //监听新用户加入
    socket.on('login', (data) => {
      console.log('/connect.login')
      const { account, password } = data
      usersModel.login(account, password)
        .then(res => {
          if (res.ret === 0) {
            const user = res.user
            //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
            socket.userData = {
              id: user.id,
              account: user.account
            }

            //检查在线列表，如果不在里面就加入
            if (!onlineUsers.hasOwnProperty(user.account)) {
              onlineUsers[user.account] = socket.id;
              //在线人数+1
              onlineCount++;
            }
    
            socket.emit('login', {
              ret: res.ret,
              onlineUsers: onlineUsers,
              onlineCount: onlineCount,
              user: user
            });

            // 获取好友列表
            usersModel.getFriends(socket.userData.account)
              .then(res => {
                res.forEach(friend => {
                  friend.online = onlineUsers.hasOwnProperty(friend.account)
                  if (friend.online) {
                    io.to(onlineUsers[friend.account]).emit('friend_online', { account: socket.userData.account })
                  }
                })
                socket.emit('set_friends', res)
              })
            // 获取好友申请列表
            usersModel.getApplicants(socket.userData.account)
              .then(res => {
                socket.emit('set_applicants', res)
              })
            // 获取游戏列表
            gamesModel.getFavorites(socket.userData.account)
              .then(res => {
                socket.emit('set_favorites', res)
              })
            // 获取商店游戏
            gamesModel.getStoreGames()
              .then(res => {
                socket.emit('set_store_games', res)
              })
            // 通知好友上线
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
      usersModel.registe(account, password).then(() => {
        socket.emit('registe', {
          ret: 0,
        })
      })
    })

    socket.on('search', (data) => {
      console.log('/connect.search')
      const { nickname } = data
      usersModel.search(nickname)
        .then(res => {
          socket.emit('search', res)
        })
    })

    socket.on('invite', data => {
      console.log('/connect.invite')
      const account = data.invitee.account
      if (onlineUsers.hasOwnProperty(account)) {
        io.to(onlineUsers[account]).emit('invite_msg', data)
      }
    })

    socket.on('add_contact', (data) => {
      console.log('/connect.add_contact')
      const { nickname } = data
      // 添加到数据库
      usersModel.addContact(nickname, socket.userData.account)
        .then(res => {
          socket.emit('add_contact', res)
          if (res.ret === 0) {
            const account = res.account
            // 如果对方在线，就通知他
            if (onlineUsers.hasOwnProperty(account)) {
              io.to(onlineUsers[account]).emit('has_applicant_msg')
              usersModel.getApplicants(account)
                .then(res => {
                  io.to(onlineUsers[account]).emit('set_applicants', res)
                })
            }
          }
        })
    })

    socket.on('get_applicants', () => {
      console.log('/connect.get_applicants')
      usersModel.getApplicants(socket.userData.account)
        .then(res => {
          socket.emit('set_applicants', res)
        })
    })

    socket.on('approve_application', data => {
      console.log('/connect.approve_application')
      usersModel.approveApplication(socket.userData.account, data.account)
        .then(res => {
          // 刷新自己的好友列表
          usersModel.getFriends(socket.userData.account)
            .then(res => {
              res.forEach(friend => {
                friend.online = onlineUsers.hasOwnProperty(friend.account)
              })
              socket.emit('set_friends', res)
            })
          
          // 刷新自己的申请人列表
          usersModel.getApplicants(socket.userData.account)
            .then(res => {
              socket.emit('set_applicants', res)
            })
          
          // 如果对方在线，刷新对方的好友列表
          if (onlineUsers.hasOwnProperty(data.account)) {
            usersModel.getFriends(data.account)
              .then(res => {
                res.forEach(friend => {
                  friend.online = onlineUsers.hasOwnProperty(friend.account)
                })
                io.to(onlineUsers[data.account]).emit('set_friends', res)
              })
          }
        })
    })

    socket.on('neglect_application', data => {
      console.log('/connect.neglect_application')
      usersModel.neglectApplication(socket.userData.account, data.account)
        .then(res => {
          // 刷新自己的申请人列表
          usersModel.getApplicants(socket.userData.account)
            .then(res => {
              socket.emit('set_applicants', res)
            })
        })
    })

    socket.on('get_friends', () => {
      console.log('/connect.get_friends')
      usersModel.getFriends(socket.userData.account)
        .then(res => {
          res.forEach(friend => {
            friend.online = onlineUsers.hasOwnProperty(friend.account)
          })
          socket.emit('set_friends', res)
        })
    })

    socket.on('update_profile', data => {
      console.log('/connect.update_profile')
      usersModel.updateProfile(socket.userData.account, data)
        .then(res => {
          socket.emit('update_profile', res)
        })
    })

    socket.on('get_favorites', data => {
      console.log('/conect.get_favorites')
      gamesModel.getFavorites(socket.userData.account)
        .then(res => {
          socket.emit('set_favorites', res)
        })
    })

    socket.on('get_store_games', data => {
      console.log('/connect.get_store_games')
      gamesModel.getStoreGames()
        .then(res => {
          socket.emit('set_store_games', res)
        })
    })
  
    //监听用户退出
    socket.on('disconnect', () => {
      console.log('/connect.disconnect')
      if (socket.userData) {
        const account = socket.userData.account
        //将退出的用户从在线列表中删除
        if (onlineUsers.hasOwnProperty(account)) {
          //删除
          delete onlineUsers[account];
          //在线人数-1
          onlineCount--;
    
          //向所有客户端广播用户下线
          io.sockets.emit('friend_offline', { account: account });
        }
      }
    })
  });
}

