const log = (msg) => {
 const remoteIP = msg.connection.remoteAddress
 console.log(`received msg from client ${remoteIP}`)
}

export default log
