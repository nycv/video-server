import express from 'express'
import expressWS from 'express-ws'
import log from './logger'
import child_process from 'child_process'
import fs from 'fs'

const { Transform } = require('stream');

const {Storage} = require('@google-cloud/storage')
const storage = new Storage ({
  keyFilename: './keyfile.json',
  projectId: 'nycv-217819'
})

console.log('storage', storage)

const myBucket = storage.bucket('nycv-test-bucket');
const file = myBucket.file('test-file.avi');

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



    //test-ping for server
    this.app.get('/test', (req, res) => {
      log('rest', req)
      res.send('smoke weed everday')
    })


    storage
      .getBuckets()
      .then((results) => {
        const buckets = results[0];

        console.log('Buckets:');
        buckets.forEach((bucket) => {
          console.log(bucket.name);
        });
      })
      .catch((err) => {
        console.error('ERROR:', err);
      });
    //construct duplex stream
  //   function xxcreateDuplexStream(){
  //     return new stream.Transform({
  //       writableObjectMode: true,
  //       transform: transformFunc
  //     });
  //
  //   function transformFunc(chunk, encoding, callback){
  //     let data = chunk;
  //
  //     callback(null, data);
  //   }
  // }
  //
  // let myDupelexStream = xxcreateDuplexStream();

    // startup listener on specified port
    this.app.listen(this.port, () => console.log(`server listening on port ${this.port}`))



  }

  handleVideoBlob = (blob) => {
    //console.log('blob', blob, typeof blob) //logging front end blobs
    //const buff = new Buffer(blob).toString('base64')
    this.ffmpeg.stdin.write(blob)
    console.log(process.stdout)
  }

  captureOutput = (data) => {
    console.log('received data', data)
    return data
  }
  spawnFFMPEG = () => {
    this.ffmpeg = child_process.spawn('ffmpeg',
      [
        '-f', 'lavfi', '-i', 'anullsrc',
        '-i', '-',
        '-shortest', '-vcodec', 'copy',
        '-f', 'avi',
        "pipe:1"
      ]
    )


    this.ffmpeg.stdout.pipe(this.file.createWriteStream())

    this.ffmpeg.on('close', (code, signal) => {
      console.log('ffmpeg closed.. ')

    })

    this.ffmpeg.stderr.on('data', (data) => {
      console.log('FFmpeg STDERR', data.toString())
    })


    this.ffmpeg.stdin.on('error', (err) => console.log('error in ffmpeg stdin', err))

  }


}
