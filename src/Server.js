import express from 'express'
import expressWS from 'express-ws'
import log from './logger'
import child_process from 'child_process'

export default class Server {
  constructor(params) {
    this.port = params.port
    if (!this.port) throw 'include httpPort in Server params'

    // init express app
    this.app = express()
    this.websocket = expressWS(this.app)


    // websocket express endpoint
    this.app.ws('/ws', (ws, req) => {
      this.spawnFFMPEG()
      ws.on('message', (msg) => {
        this.handleVideoBlob(msg)
      })

      ws.on('close', () => {
        this.ffmpeg.kill('SIGINT')
      })
    })

    this.app.get('/test', (req, res) => {
      log('rest', req)
      res.send('smoke weed everday')
    })

    this.app.get('/test2', (req, res) => {
      log(req)
      res.send('lets go')
    })

    // startup listener on specified port
    this.app.listen(this.port, () => console.log(`server listening on port ${this.port}`))
  }

  handleVideoBlob = (blob) => {
    console.log('blob', blob, typeof blob)
    //const buff = new Buffer(blob).toString('base64')
    this.ffmpeg.stdin.write(blob)
  }


  spawnFFMPEG = () => {
    this.ffmpeg = child_process.spawn('ffmpeg',
      [
        '-f', 'lavfi', '-i', 'anullsrc',
        '-i', '-',
        '-shortest', '-vcodec', 'copy',
        '-f', 'avi',
        'test.avi'
      ]
    )

    this.ffmpeg.on('close', (code, signal) => {
      console.log('ffmpeg closed..')
    })

    this.ffmpeg.stderr.on('data', (data) => {
      console.log('FFmpeg STDERR', data.toString())
    })

    this.ffmpeg.stdin.on('error', (err) => console.log('error in ffmpeg stdin', err))

  }
}
