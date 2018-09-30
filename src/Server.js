import express from 'express'
import expressWS from 'express-ws'
import log from './logger'
import child_process from 'child_process'


const {Storage} = require('@google-cloud/storage')
const storage = new Storage ({
  keyFilename: './keyfile.json'
})
console.log('storage', storage)
const myBucket = storage.bucket('nycv-test-bucket');
const file = myBucket.file('test-file');

// // Process the file upload and upload to Google Cloud Storage.
// app.post("/upload", m.single("file"), (req, res, next) => {
//   const blob = bucket.file(req.file.originalname);
//   const blobStream = blob.createWriteStream({
//     metadata: {
//       contentType: req.file.mimetype
//     }
//   });
//   blobStream.on("error", err => {
//   });
//   blobStream.on("finish", () => {
//   });
// });



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

    // this.ffmpeg.stdout.on('data', res => {
    //   console.log('data', res)
    //
    //   try {
    //   file.createWriteStream(res)
    // }
    //   catch (err) {
    //     console.log(err)
    //   }
    // })
    this.ffmpeg.stdout.pipe(process.stdout)

    process.stdout.pipe(
      file.createWriteStream()
        .on('error', function(err) { console.log("createWriteStream error: ", err)}))


    this.ffmpeg.on('close', (code, signal) => {
      console.log('ffmpeg closed.. ')
      //     fs.createReadStream('./test.avi')
      //       .pipe(file.createWriteStream())
      //       .on('error', function(err) {})
      //       .on('finish', function() {
      //   // The file upload is complete.
      // });
    })

    this.ffmpeg.stderr.on('data', (data) => {
      console.log('FFmpeg STDERR', data.toString())
    })


    this.ffmpeg.stdin.on('error', (err) => console.log('error in ffmpeg stdin', err))

  }

}
