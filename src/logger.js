const log = (type, msg) => {
 switch (type) {
   case 'rest':
     logRest(msg)
     break
   case 'ws':
     logWS(msg)
     break
   default:
    console.log(msg)
    break
 }
}

const logRest = (msg) => {
  const remoteIP = msg.connection.remoteAddress
  console.log(`received msg from client ${remoteIP}`)
}

const logWS = (msg) => {
  const remoteIP = ws._socket.address()
  console.log(`received msg from client ${remoteIP}`)
}

export default log
