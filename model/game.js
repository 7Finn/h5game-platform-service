const dataBase = {
  gameMaps: {
    1000: 'puzzle/index.html'
  }
}

module.exports = {
  getGameUrl: (id) => {
    return dataBase.gameMaps[id]
  }
}
