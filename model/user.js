const bcrypt = require('bcrypt-nodejs');


function getProfileFromDoc (doc) {
  return {
    id: doc._id,
    account: doc.account,
    nickname: doc.nickname,
    friends: doc.friends,
    applicants: doc.applicants,
    avatar: doc.avatar
  }
}

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
            user: getProfileFromDoc(result)
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
            return { ret: 0,
              user: {
                id: result._id,
                account: result.account,
                nickname: result.nickname,
                avatar: result.avatar
              }
            }
          } else {
            return { ret: 0, user: null }
          }
        })
    },
    addContact: (nickname, account) => {
      return users.findOneAndUpdate({ nickname: nickname }, { $addToSet: { applicants: account } }, { returnOriginal: false })
        .then(result => {
          if (result) return { ret: 0, account: result.value.account }
          else return { ret: -1 }
        })
        .catch(err => {
          return { ret: -1 }
        })
    },
    getApplicants: (account) => {
      return users.findOne({ account: account })
        .then(result => {
          if (result) {
            return Promise.all(result.applicants.map((account => {
              return users.findOne({ account: account }).then(result => {
                return { account: result.account, nickname: result.nickname, avatar: result.avatar }
              })
            })))
          } else {
            return Promise.resolve([])
          }
        })
    },
    approveApplication: (account, targetAccount) => {
      return users.updateOne({ account: account }, { $pull: { applicants: targetAccount }, $addToSet: { friends: targetAccount } })
        .then(result => {
          return { ret: 0 }
        })
        .catch(err => {
          return { ret: -1 }
        })
    },
    neglectApplication: (account, targetAccount) => {
      return users.updateOne({ account: account }, { $pull: { applicants: targetAccount } })
        .then(result => {
          return { ret: 0 }
        })
        .catch(err => {
          return { ret: -1 }
        })
    },
    getFriends: (account) => {
      return users.findOne({ account: account })
        .then(result => {
          if (result) {
            return Promise.all(result.friends.map((account => {
              return users.findOne({ account: account }).then(result => {
                return { account: result.account, nickname: result.nickname, avatar: result.avatar }
              })
            })))
          } else {
            return Promise.resolve([])
          }
        })
    },
    updateProfile: (account, profile) => {
      return users.findOneAndUpdate({ account: account }, { $set: {nickname: profile.nickname, avatar: profile.avatar}}, { returnOriginal: false })
        .then(result => {
          return {
            ret: 0,
            user: getProfileFromDoc(result.value)
          }
        })
        .catch(err => {
          return { ret: -1, user: null }
        })
    }
  }
}
