const bcrypt = require('bcrypt-nodejs');

module.exports = (db) => {
  let users = db.collection('users');
  return {
    registe: (account, password) => {
      return new Promise((resolve, reject) => {
        bcrypt.hash(password, null, null, (error, hash) => {
          if (error) reject()
          else resolve(hash)
        })
      }).then(hash => {
        return users.insert({
          account,
          password: hash,
          nickname: account
        })
      })
    },
    login: (account, password) => {
      return users.findOne({ account: account })
        .then(result => {
          if (result) {
            return new Promise((resolve, reject) => {
              bcrypt.compare(password, result.password, (err, res) => {
                if (err) reject()
                else resolve(result)
              });
            })
          } else {
            return Promise.reject('用户不存在')
          }
        })
        .then(result => {
          return { ret: 0,
            user: {
              id: result._id,
              account: result.account,
              nickname: result.nickname,
              friends: result.friends
            }
          }
        })
        .catch(err => {
          console.log(err)
          return { ret: -1, user: null }
        })
    },
    search: (nickname) => {
      return users.findOne({ nickname: nickname })
        .then(result => {
          if (result) {
            return {
              ret: 0,
              user: {
                id: result._id,
                account: result.account,
                nickname: result.nickname
              }
            }
          } else {
            return {
              ret: 0,
              user: null
            }
          }
        })
    },
    addContact: (mastername, nickname) => {
      return users.updateOne({ nickname: nickname}, { $addToSet: { applicants: mastername } })
        .then(result => {
          if (result) return { ret: 0, userid: result._id }
          else return { ret: -1 }
        })
        .catch(err => {
          return { ret: -1 }
        })
    }
  }
}
