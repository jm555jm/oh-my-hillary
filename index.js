const axios = require('axios').default
const fs = require('fs')
const express = require('express')
var session = require('express-session')

const app = express()

app.use(express.urlencoded({ extended: true }))
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
  if (!req.session || !req.session.access_token) {
    res.send('Fuck you 希拉蕊不歡迎你')
    return
  }

  const profileResponse = await axios.get('https://api.line.me/v2/profile', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${req.session.access_token}`
    }
  })
  const { userId, displayName, pictureUrl } = profileResponse.data
  req.session.userId = userId
  let data = fs.readFileSync('src/home.html', 'utf8')
  res.send(
    data
      .replace('_{name}_', displayName)
      .replace('_{picture}_', pictureUrl)
      .replace('_{state}_', genState())
      .replace('_{welcome}_', req.session.welcome)
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

      req.session.access_token = tokenResponse.data.access_token
      req.session.welcome = '希拉蕊後援會歡迎你'
      res.redirect('/home')
    } catch (err) {
      res.send('Fuck you 希拉蕊不歡迎你')
      console.log(err)
    }
  }
})
app.post('/subscription', async function (req, res) {
  const { code, state, error } = req.body
  if (error || !consumeState(state)) {
    res.send('Fuck you 希拉蕊不歡迎你')
  } else {
    try {
      const tokenResponse = await axios.post(
        'https://notify-bot.line.me/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'https://oh-my-hillary.herokuapp.com/subscription',
          client_id: 'a4qQdoKW9Rnbj5P3WfqsXP',
          client_secret: 'Co9hTRzbARlC0KPtm767HUYPjA0xB6oeT8D52v13XlY'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      subscriptions[req.session.userId] = tokenResponse.data.access_token
      req.session.welcome = '今晚希拉蕊會跟你說晚安^^'
      res.redirect('/home')
    } catch (err) {
      res.send('Fuck you 希拉蕊不歡迎你')
      console.log(err)
    }
  }
})
app.get('/revoke', async function (req, res) {
  if (!req.session.userId) {
    req.session.welcome = '祝你今晚惡夢'
    res.redirect('/home')
    return
  }
  try {
    await axios.post('https://notify-api.line.me/api/revoke', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${subscriptions[req.session.userId]}`
      }
    })

    delete subscriptions[req.session.userId]
    req.session.welcome = '祝你今晚惡夢'
    res.redirect('/home')
  } catch (err) {
    res.send('Fuck you 希拉蕊不歡迎你')
    console.log(err)
  }
})

app.get('/resetSubsciption', async function (req, res) {
  subscriptions = {}
  res.redirect('/admin')
})

app.get('/admin', function (req, res) {
  let data = fs.readFileSync('src/admin.html', 'utf8')
  res.send(
    data
      .replace('_{state}_', genState())
      .replace('_{welcome}_', '跟大家說晚安吧！')
  )
})
app.post('/admin', async function (req, res) {
  const { message, state } = req.body
  if (!consumeState(state)) {
    res.send('有些地方出錯惹~')
    return
  }
  try {
    let verifiedsubscriptions = {}
    for (const user in subscriptions) {
      try {
        await axios.get('https://notify-api.line.me/api/status', {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${subscriptions[user]}`
          }
        })
        verifiedsubscriptions[user] = subscriptions[user]
      } catch (err) {
        console.log(err)
      }
    }
    subscriptions = verifiedsubscriptions
    for (const user in subscriptions) {
      await axios.post(
        'https://notify-api.line.me/api/notify',
        new URLSearchParams({
          message
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${subscriptions[user]}`
          }
        }
      )
    }

    let data = fs.readFileSync('src/admin.html', 'utf8')
    res.send(
      data.replace('_{state}_', genState()).replace('_{welcome}_', '大家晚安！')
    )
  } catch (err) {
    res.send('有些地方出錯惹~')
    console.log(err)
  }
})
let subscriptions = {}
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
