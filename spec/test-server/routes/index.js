var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  res.send("1,2,3,4,5,6,7");
});

module.exports = router;
