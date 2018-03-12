let model = require('../model/user');

module.exports = (db) => {
  let users = db.collection('users')
  return {
    login: (body) => {
      const { account, password } = body
      return model.login(account, password)
    },
    search: (query) => {
      const { key } = query
      return model.search(key)
    }
  }
}