import fs from 'fs'

import { Storage } from '@google-cloud/storage'

const main = async () => {
  const storage = new Storage({
    keyFilename: './keyfile.json',
    projectId: 'nycv-217819',
  })

  const bucket = storage.bucket('nycv-test-bucket')
  const file = bucket.file('sean-test.mp4')

  fs.createReadStream('./test.mp4')
    .pipe(file.createWriteStream())
}

main()
