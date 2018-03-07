import io from 'socket.io-client'
import { TYPE_ROLE } from './config'
import { utils } from './utils'
let role;
let socket;
let token;

exports.tsocket = {
  /**
   * 连接游戏房间的服务器
   * 
   * @param {any} callback 
   */
  connectSync: async (callback) => {
    socket = io('http://127.0.0.1:3000/game');
    await new Promise((resolve, reject) => {
      socket.emit('token');
      socket.on('token', (data) => {
        role = data.role
        resolve();
      });

      socket.on('error', (data) => {
        reject();
      })
    })

    if (callback) {
      callback();
    }
  },
  
  broadcastDataSync: async (name, data, callback) => {
    callback = utils.isFunction(callback) ? callback : () => {}
    socket.emit('broadcastData', { name, data });
    socket.removeAllListeners(name);
    await new Promise((resolve, reject) => {
      socket.on(name, (data) => {
        callback(data);
        resolve();
      });
    })    
  },

  broadcastData: (name, data) => {
    socket.emit('broadcastData', { name, data });
  },

  bindBroadCastEventHandler: (name, callback) => {
    socket.on(name, callback)
  },
  /**
   * 发送消息
   * 
   * @param {any} name 数据名称
   * @param {any} data 发送数据
   * @param {any} callback 回调函数
   */
  sendDataSync: async (name, data, callback) => {
    callback = utils.isFunction(callback) ? callback : () => {}
    switch (role) {
      case TYPE_ROLE.MASTER:
        socket.emit('sendData', { name, data });
        callback(data);
        break;
      case TYPE_ROLE.MAP:
        socket.removeAllListeners(name);
        await new Promise((resolve, reject) => {
          socket.on(name, (data) => {
            callback(data);
            resolve();
          });
        })
        break;
      default:
    }
  },

  ready: () => {
    socket.emit('ready');
  },

  bindStartEventHandler: (handler) => {
    socket.removeAllListeners('start');
    socket.on('start', handler)
  },

  win: () => {
    socket.emit('win');
  },

  bindWinEventHandler: (handler) => {
    socket.removeAllListeners('win');
    socket.on('win', handler)
  }
}