const dataBase = {
  list: [
    {
      name: '蝙蝠侠',
      description: '民风淳朴哥谭市',
      gameId: 1000,
      cover: 'http://localhost:3000/assets/1000/cover.png'
    },
    {
      name: '开心消消乐',
      description: '恶贯满盈消消乐',
      gameId: 1001,
      cover: 'http://localhost:3000/assets/1001/cover.png'
    },
    {
      name: '蝙蝠侠',
      description: '民风淳朴哥谭市',
      gameId: 1000,
      cover: 'http://localhost:3000/assets/1000/cover.png'
    },
    {
      name: '开心消消乐',
      description: '恶贯满盈消消乐',
      gameId: 1001,
      cover: 'http://localhost:3000/assets/1001/cover.png'
    }
  ]
}

module.exports = {
  getList: () => {
    return dataBase.list
  }
}
