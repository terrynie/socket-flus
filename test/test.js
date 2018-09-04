const SocketFlus = require('../lib/index');
const client = require('socket.io-client');
const server = require('http').createServer();
const io = require('socket.io')(server, {
  path: '/',
  serveClient: false
});

before((done) => {
  let i = 0;
  io.on('connection', (socket) => {
    socket.on('trackPush', (msg, cb) => {
      cb(null, 'ok');
    })
  })
  server.listen(9000);
  done();
});

describe('socket connect test', () => {
  it('should be ok', (done) => {
    let options = {
      url: 'http://localhost:9000/',
      connectCount: 100
    }
    let sf = new SocketFlus(options)
    sf.connTest()
      .then((res) => {
        done();
      })
      .catch((err) =>{
        done(err);
      })
  });
});

describe('socket connect test by time', () => {
  it('should be ok', (done) => {
    let options = {
      url: 'http://localhost:9000/',
      requestCount: 2000,
      connectCount: 10,
      duration: 10
    }
    let sf = new SocketFlus(options)
    sf.messageTest('trackPush', 'hello')
      .then((res) => {
        done();
      })
      .catch((err) =>{
        done(err);
      })
  });
});

