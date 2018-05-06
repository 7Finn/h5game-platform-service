import io from 'socket.io-client'
import { TYPE_ROLE } from './config'
import { utils } from './tools/utils'
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
      socket.emit('_token');
      socket.on('_token', (data) => {
        console.log('_token', data)
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

  emit: (name, data) => {
    console.log('emit:', name, role, data);
    if (role === TYPE_ROLE.MASTER) {
      socket.emit('_broadcast_data', { name, data });
    }
  },

  on: (name, callback) => {
    socket.on(name, callback)
  },
  
  once: (name, callback) => {
    socket.once(name, callback)
  },

  broadcastData: async (name, data, callback) => {
    if (role === TYPE_ROLE.MASTER) {
      console.log('broadcast_data', name, data);
      socket.emit('_broadcast_data', { name, data });
    }
    socket.removeAllListeners(name);
    if (utils.isFunction(callback)) {
      socket.on(name, (data) => {
        callback(data)
      });
    } else {
      return await new Promise((resolve, reject) => {
        socket.on(name, (data) => {
          resolve(data);
        });
      })
    }
  },

  broadcastDataSync: async (name, data, callback) => {
    callback = utils.isFunction(callback) ? callback : () => {}
    if (role === TYPE_ROLE.MASTER) {
      console.log('broadcast_data_sync', name, data);
      socket.emit('_broadcast_data', { name, data });
    }
    socket.removeAllListeners(name);
    await new Promise((resolve, reject) => {
      socket.on(name, (data) => {
        callback(data);
        resolve();
      });
    })    
  },

    /**
   * 发送消息
   * 
   * @param {any} name 数据名称
   * @param {any} data 发送数据
   * @param {any} callback 回调函数
   */
  sendData: async (name, data, callback) => {
    callback = utils.isFunction(callback) ? callback : () => {}
    if (role === TYPE_ROLE.MASTER) {
      socket.emit('_send_data', { name, data });
      callback(data);
    } else if (role === TYPE_ROLE.MAP) {
      socket.removeAllListeners(name);
      await new Promise((resolve, reject) => {
        socket.on(name, (data) => {
          callback(data);
          resolve();
        });
      })
    }
  },

  sendDataSync: async (name, data, callback) => {
    callback = utils.isFunction(callback) ? callback : () => {}
    switch (role) {
      case TYPE_ROLE.MASTER:
        socket.emit('_send_data', { name, data });
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

  ready: (time) => {
    socket.emit('_ready', { time: time });
  },

  onStart: async (handler) => {
    if (handler) {
      socket.once('_start', handler)
    } else {
      await new Promise((resolve, reject) => {
        socket.once('_start', () => {
          resolve();
        })
      })
    }
  },

  win: () => {
    socket.emit('_platform_win');
  },

  onWin: (handler) => {
    socket.once('_platform_win', handler)
  },

  lose: () => {
    socket.emit('_platform_lose');
  },

  onLose: (handler) => {
    socket.once('_platform_lose', handler)
  },

  reportInfo: (name, data) => {
    socket.emit('_report_info', { name, data })
  }
}