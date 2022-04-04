const axios = require('axios').default
const express = require('express')
const app = express()
app.use('/img', express.static(__dirname + '/img'))

app.get('/', function (req, res) {
  res.sendFile('src/login.html', { root: __dirname })
})
app.get('/auth', async function (req, res) {
  const { code, state, error } = req.query
  if (error) {
    res.send('Fuck you 希拉蕊不歡迎你')
  } else {
    try {
      const token = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'https://oh-my-hillary.herokuapp.com/auth',
          client_id: '1657006910',
          client_secret: 'fa79619c9372bb5d03c10de98cec99dd'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      res.send(JSON.stringify(token.data))
    } catch (err) {
      res.send('Fuck you 希拉蕊不歡迎你')
      console.log(err)
    }
  }
})

app.listen(process.env.PORT || 3000)
