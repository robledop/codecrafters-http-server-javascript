import {createServer} from "net";

const server = createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });

    socket.on("error", (err) => {
        console.error(err);
        socket.end();
        socket.close();
    })

    socket.on("data", (data) => {
        console.log("RECEIVED:", data.toString());

        const lines = data.toString().split("\r\n");
        const firstLine = lines[0];
        const [method, path, protocol] = firstLine.split(" ");

        console.log(`METHOD: ${method}, PATH: ${path}, PROTOCOL: ${protocol}`);

        let response;
        if (path === "/") {
            response = "HTTP/1.1 200 OK\r\n\r\n";
        } else if (path.startsWith("/echo/")) {
            const message = path.substring(6);
            response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`;
        } else if (path === "/user-agent") {
            const userAgentLine = lines.find(x => x.startsWith("User-Agent: "));
            const userAgent = userAgentLine.substring(12);
            response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;

        } else {
            response = "HTTP/1.1 404 Not Found\r\n\r\n";
        }

        socket.write(response);
    });
});

server.listen(4221, "localhost");

