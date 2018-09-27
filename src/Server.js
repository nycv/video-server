import express from 'express'
import expressWS from 'express-ws'
import log from './logger'

export default class Server {
  constructor(params) {
    this.port = params.port
    if (!this.port) throw 'include httpPort in Server params'

    // init express app
    this.app = express()
    this.websocket = expressWS(this.app)


    // websocket express endpoint
    this.app.ws('/', (ws, req) => {
      ws.on('message', (msg) => {
        console.log('msg', msg)
      })
    })

    this.app.get('/test', (req, res) => {
      log(req)
      res.send('smoke weed everday')
    })

    this.app.get('/test2', (req, res) => {
      log(req)
      res.send('lets go')
    })

    // startup listener on specified port
    this.app.listen(this.port, () => console.log(`server listening on port ${this.port}`))
  }
}
