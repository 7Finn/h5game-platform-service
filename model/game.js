
module.exports = (db) => {
  let users = db.collection('users');
  let games = db.collection('games')
  return {
    getFavorites: (account) => {
      return users.findOne({ account: account })
        .then(result => {
          if (result && result.favorites) {
            return Promise.all(result.favorites.map((gameId => {
              return games.findOne({ game_id: gameId }).then(result => {
                return { 
                  gameId: result.game_id,
                  entry: result.entry,
                  name: result.name,
                  cover: result.cover,
                  banner: result.banner
                }
              })
            })))
          } else {
            return Promise.resolve([])
          }
        })
    },
    getStoreGames: () => {
      return new Promise((resolve, reject) => {
        games.find().toArray((err, items) => {
          resolve(items.map(game => {
            return {
              gameId: game.game_id,
              entry: game.entry,
              name: game.name,
              cover: game.cover,
              banner: game.banner
            }
          }))
        })
      })
    },
    getStoreGamesDetail: (gameId) => {
      return games.findOne({ game_id: gameId })
    }
  }
}
