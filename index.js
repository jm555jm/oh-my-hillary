const axios = require('axios').default
const fs = require('fs')
const express = require('express')
const app = express()
var session = require('express-session')
app.use(
  session({
    secret: 'HillaryILoveYou!',
    resave: false,
    saveUninitialized: false
  })
)
app.use('/img', express.static(__dirname + '/img'))

app.get('/', function (req, res) {
  let data = fs.readFileSync('src/login.html', 'utf8')
  res.send(data.replace('_{state}_', genState()))
})
app.get('/home', async function (req, res) {
  if (!req.session || !req.session.id_token) {
    res.send('Fuck you 希拉蕊不歡迎你')
    return
  }

  const profileResponse = await axios.post(
    'https://api.line.me/oauth2/v2.1/verify',
    new URLSearchParams({
      id_token: req.session.id_token,
      client_id: '1657006910'
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  const { name, picture } = profileResponse.data
  let data = fs.readFileSync('src/home.html', 'utf8')
  res.send(
    data
      .replace('_{name}_', name)
      .replace('_{picture}_', picture)
      .replace('_{state}_', genState())
  )
})
app.get('/auth', async function (req, res) {
  const { code, state, error } = req.query
  if (error || !consumeState(state)) {
    res.send('Fuck you 希拉蕊不歡迎你')
  } else {
    try {
      const tokenResponse = await axios.post(
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

      req.session.id_token = tokenResponse.data.id_token
      res.redirect('/home')
    } catch (err) {
      res.send('Fuck you 希拉蕊不歡迎你')
      console.log(err)
    }
  }
})
app.post('/submission', async function (req, res) {
  console.log(JSON.stringify(req.body))
  res.send(JSON.stringify(req.body))
})
const states = {}
const genState = () => {
  const s = new Date().getTime()
  states[s] = true
  return s
}
const consumeState = (s) => {
  if (states[s]) {
    delete states[s]
    return true
  }
  return false
}

app.listen(process.env.PORT || 3000)
