import {createServer} from "net";

const server = createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });

    socket.on("data", (data) => {
        console.log("RECEIVED:", data.toString());

        const lines = data.toString().split("\r\n");
        const firstLine = lines[0];
        const [method, path, protocol] = firstLine.split(" ");

        console.log(`METHOD: ${method}, PATH: ${path}, PROTOCOL: ${protocol}`);

        if (path === "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else if (path.startsWith("/echo/")) {
            const message = path.substring(6);
            const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`;

            socket.write(response);
        } else {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
    });
});

server.listen(4221, "localhost");

