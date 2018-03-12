const express = require('express');
const router = express.Router();
const controller = require('../controller/user')

/* GET users listing. */
router.post('/login', (req, res, next) => {
  const result = controller.login(req.body)
  res.send(result)
});

router.get('/search', (req, res, next) => {
  const result = controller.search(req.query)
  res.send(result)
})

module.exports = router;
