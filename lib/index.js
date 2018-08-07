const socket = require('socket.io-client');
const util = require('./util');

const Mode = {
  'REQUESTBYCOUNT': 0,
  'REQUESTBYDURATION': 1
}

module.exports = class SocketFlus {
  constructor(options) {
    if (typeof options != 'object') {
      return console.log('options should be a object');
    }
    if (!options.url) {
      return console.log('url is required');
    }
    if (typeof options.url != 'string') {
      return console.log('url is required');
    }
    this.url = options.url;
    this.connectCount = options.connectCount || 10;
    this.requestCount = options.requestCount;
    this.duration = options.duration || 10;
    this.sockets = [];

    return this;
  }

  // connect test
  connTest() {
    let that = this;
    return new Promise(function(resolve, reject) {
      let startAt = Date.now();
      let endAt = null;
      let errCount = 0;
      connect(that.url, that.connectCount)
        .then(function(result) {
          endAt = Date.now();
          that.sockets = result.sockets;
          errCount = result.errNum;
        })
        .then(function() {
          let result = {
            start: new Date(startAt),
            finish: new Date(endAt),
            url: that.url,
            duration: endAt - startAt,
            connected: that.sockets.length,
            failed: errCount
          }
          resolve(result);
        })
        .catch(function(err) {
          reject(err);
        })
    })
  }

  messageTest(event, message) {
    let that = this;
    return new Promise(async (resolve, reject) => {
      if(that.sockets.length < that.connectCount) {
        let conn = await connect(that.url, that.connectCount);
        that.sockets = conn.sockets;
      } 
      let mode = null;
      let result = null;
      if (that.requestCount) {
        mode = Mode.REQUESTBYCOUNT;
      } else if (that.duration) {
        mode = Mode.REQUESTBYDURATION;
      }

      let options = {
        mode,
        count: that.requestCount,
        duration: that.duration,
        url: that.url,
        
      }

      send(event, message, that.sockets, options)
        .then((res) => {
          result = res;
        })
        .then(() => {
          return analyse.call(result);
        })
        .then((report) => {
          resolve(report);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}

function connect(url, num) {
  return new Promise((resolve, reject) => {
    let sockets = [];
    let errNum = 0;
    for (let i = 0; i < num; i++) {
      try {
        let s = socket.connect(url, {
          transports: ['websocket'],
          forceNew: true
        });
        s.on('connect', () => {
          sockets.push(s);
          if (sockets.length == num) {
            resolve({sockets, errNum});
          }
        });
        s.on('error', (err) => {
          errNum++;
          if (sockets.length == num) {
            resolve({sockets, errNum});
          }
        });
      } catch (err) {
        reject(err);
      }
    };
  });
}


function send(event, message, sockets, options) {
  let that = this;
  return new Promise((resolve, reject) => {
    let result = {
      options,
      success: 0,
      failed: 0,
      start: Date.now(),
      finish: null,
      _count: options.count,
      _requestSent: 0,
      _requests: {},
      _response: [],
      _countPerSecond: []
    };
    if (options.mode === Mode.REQUESTBYCOUNT) {
      for (let i = 0; i < options.count; i++) {
        let item = sockets[i % sockets.length];
        result._requests[item.id] = result._requests[item.id] || [];
        result._requests[item.id].push(Date.now());
        result._requestSent += 1;
        item.emit(event, message, (err, res) => {
          resHandler.call(result, err, res, item);
          if (result._requestSent >= options.count) {
            result.finish = Date.now();
            resolve(result);
          }
        })
      }
    } else if (options.mode === Mode.REQUESTBYDURATION) {
      for (let i = 0; Date.now() - result.start < options.duration * 1000; i++) {
        let item = sockets[i % sockets.length];
        result._requests[item.id] = result._requests[item.id] || [];
        result._requests[item.id].push(Date.now());
        result._requestSent += 1;
        item.emit(event, message, (err, res) => {
          resHandler.call(result, err, res, item);
          if (Date.now() - result.start < duration * 1000) {
            result.finish = Date.now();
            resolve(result);
          }
        })
      }
    }
  });
}

function resHandler(err, result, socket) {
  let that = this;
  if (!err) {
    that.success++;
  } else {
    that.failed++;
  }
  that._response.push(Date.now() - that._requests[socket.id].shift());
}

function analyse() {
  let that = this;
  let filterBySecond = util.filterBySecond;
  return new Promise((resolve) => {
    let result = {}
    that._response = util.mergeSort(that._response);
    that._countPerSecond = util.mergeSort(filterBySecond.call(that._requests));
    result.url = that.options.url;
    result.connection = Object.keys(that._requests).length;
    result.duration = that.finish - that.start;
    result.requests = {
      average: that._requestSent / result.duration * 1000,
      min: that._countPerSecond[0] || that._requestSent,
      max: that._countPerSecond[that._countPerSecond.length - 1] || that._requestSent,
      total: that._requestSent
    };
    result.latency = {
      average: util.sum(that._response) / that._response.length,
      min: that._response[0],
      max: that._response[that._response.length - 1],
      p50: Math.floor(that._response[Math.floor(that._response.length * 0.5) - 1]),
      p75: Math.floor(that._response[Math.floor(that._response.length * 0.75) - 1]),
      p90: Math.floor(that._response[Math.floor(that._response.length * 0.9) - 1]),
      p99: Math.floor(that._response[Math.floor(that._response.length * 0.99) - 1])
    };
    result.start = new Date(that.start);
    result.finish = new Date(that.finish);
    resolve(result);
  });
}