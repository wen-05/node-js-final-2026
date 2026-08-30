const express = require('express')
const cors = require('cors')

const app = express()
const indexRouter = require('./routes/index')

app.use(cors())
app.use(express.json())


app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK')
})

app.use('/api', indexRouter);

app.use((req, res) => {
  res.status(404).json({ status: 'failed', message: '無此路由' })
})

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const status = err.status || 'error'
  const message = err.message || '伺服器錯誤'

  res.status(statusCode).json({ status, message })
})

module.exports = app