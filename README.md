# socket-flus

A third repo for socket load test.

### Get Start

```JavaScript
let options = {
  url: array<string> | string, // the websocket url, like 'http://localhost:3000/chatroom'
  connectionCount: number,     // optional
  durationCount: number,       // optional
  duration: number             // optional, default is 10s
};

let socket_flus = new SocketFlus(options);
socket_flus.connTest().then((report) => {
  console.log(report);
});

socket_flus.messageTest(event, message).then((report) => {
  console.log(report);
});
```
