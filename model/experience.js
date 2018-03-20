
module.exports = (db) => {
  let users = db.collection('users');
  let games = db.collection('games');
  let experience = db.collection('experience');
  return {
    addPlayTime: (account, gameId, win) => {
      experience.updateOne({ account: account, game_id: gameId }, { $inc: { play_time: 1, win_time: win ? 1 : 0} })
    },
    getExperience: (account, gameId) => {
      return experience.findOne({ account: account, game_id: gameId })
    }
  }
}