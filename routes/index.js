const express = require('express')
const fs = require('fs')
const path = require('path')
let multer  = require('multer')
let upload = multer({ dest: 'public/' })
let util = require('../tools/utils')
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

router.get('/template', function(req, res, next) {
  res.render('template')
})

router.post('/upload', upload.single('file'), function (req, res, next) {
  const file = req.file
  if (util.isZipFile(file)) {
    const { gameId } = req.body
    const idDir = path.join(__dirname, `../public/${gameId}`)
    const destPath = path.join(idDir, `/${file.originalname}`)
    if (!fs.existsSync(idDir)) fs.mkdirSync(idDir)
    fs.renameSync(file.path, destPath)
    res.send({ ret: 0 })
  } else {
    res.send({ ret: -1 })
  }
  // req.file 是 `avatar` 文件的信息  
  // req.body 将具有文本域数据，如果存在的话
})

module.exports = router;
