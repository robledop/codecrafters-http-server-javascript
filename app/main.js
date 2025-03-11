import {createServer} from "net";

const server = createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });
  
    socket.on("data", (data) => {
        console.log("RECEIVED: ", data.toString());
        
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
    });
});

server.listen(4221, "localhost");

