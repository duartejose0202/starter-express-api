var express = require('express');
var router = express.Router();
const axios = require('axios');
const {BASE_URL} = require('../config')

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const functionUrl = `${BASE_URL}/reserve-link`; // Replace with your Firebase function URL
    console.log(functionUrl)
    const response = await axios.post(functionUrl, {
      headers: { 'Content-Type': 'application/json' },
      data: { username: 'pgvjjpcgzz' } // Replace with any parameters required by the Firebase function
    });
    res.status(200).send(response.data);
    console.log("success")
  } catch (error) {
    console.error("error");
    res.status(500).send(error.message);
  }
});


module.exports = router;
