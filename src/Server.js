import express from 'express'
import expressWS from 'express-ws'
import log from './logger'
import child_process from 'child_process'
import { Storage } from '@google-cloud/storage'
import crypto from 'crypto'

export default class Server {
  constructor(params) {
    this.port = params.port
    if (!this.port) throw 'include httpPort in Server params'
    

    // init express app
    this.app = express()
    this.websocket = expressWS(this.app)

    // init google cloud storage
    this.storage = new Storage({
      keyFilename: './keyfile.json',
      projectId: 'nycv-217819',
    })
    
    // point at bucket
    const bucket = this.storage.bucket('nycv-test-bucket')  
    this.file = bucket.file('sean-test-2.mp4')

    // websocket express endpoint
    this.app.ws('/ws', (ws, req) => {
      this.spawnFFMPEG()
      ws.on('message', (msg) => {
        console.log('received msg', msg)
        this.handleVideoBlob(msg)
      })
      
      ws.on('close', () => {
        this.ffmpeg.kill('SIGINT')
      })
    })

    // startup listener on specified port
    this.app.listen(this.port, () => console.log(`server listening on port ${this.port}`))
  }
  
  handleVideoBlob = (blob) => {
    this.ffmpeg.stdin.write(blob)
  }

  
  spawnFFMPEG = () => {
    /*
      FFMPEG child process
      webm --> mp4
      pipe in, pipe out
    */
    this.ffmpeg = child_process.spawn('ffmpeg',
      [
        '-i', '-', // pipe into stdin
       // '-vcodec', 'copy', // cpu optimization
        '-movflags', 'frag_keyframe+empty_moov',
        '-f', 'mp4', // conver webm to mp4
        'pipe:1', // pipe to stdout 
      ]
    )

    // handle ffmpeg child process stdout stream
    this.ffmpeg.stdout.pipe(this.file.createWriteStream())
    
    // handle ffmpeg child process close
    this.ffmpeg.on('close', (code, signal) => {
      console.log('ffmpeg closed..')
    })
    
    // handle ffmpeg errors
    this.ffmpeg.stderr.on('data', (data) => {
      console.log('FFmpeg STDERR', data.toString())
    })
    
    // handle erros piping into ffmpeg stdin
    this.ffmpeg.stdin.on('error', (err) => console.log('error in ffmpeg stdin', err))
  }
  
  // creates 8 byte unique identifier for client session
  createUniqueId = () => {
    return new Promise((res, rej) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) rej(err)
        res(buf.toString('hex'))
      })  
    })
  }
}
