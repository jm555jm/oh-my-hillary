const axios = require('axios').default
const express = require('express')
const app = express()
app.use('/img', express.static(__dirname + '/img'))

app.get('/', function (req, res) {
  res.sendFile('src/login.html', { root: __dirname })
})
app.get('/auth', function (req, res) {
  const { code, state, error } = req.query
  if (error) {
    res.send('Fuck you 希拉蕊不歡迎你')
  } else {
    axios
      .post(
        'https://api.line.me/oauth2/v2.1/token',
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'https://oh-my-hillary.herokuapp.com/auth',
          client_id: '1657006910',
          client_secret: 'fa79619c9372bb5d03c10de98cec99dd'
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      .then((response) => {
        res.send(JSON.stringify(response.data))
      })
      .catch((err) => {
        res.send('Fuck you 希拉蕊不歡迎你')
        console.log(JSON.stringify(err))
      })
  }
})

app.listen(process.env.PORT || 3000)
