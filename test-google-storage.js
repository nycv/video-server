// import express from 'express'
// import expressWS from 'express-ws'
// import log from './logger'
// import child_process from 'child_process'
import fs from 'fs'

const {Storage} = require('@google-cloud/storage')
const storage = new Storage ({
  keyFilename: './keyfile.json',
  projectId: 'nycv-217819'
})
// console.log('storage', storage)
const myBucket = storage.bucket('nycv-test-bucket');

const file = myBucket.file('test-file.mp4');


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

fs.createReadStream('./test.mp4')
  .pipe(file.createWriteStream())
