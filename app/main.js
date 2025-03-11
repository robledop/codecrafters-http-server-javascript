import {createServer} from "net";
import {readFileSync, existsSync, writeFileSync} from "fs";

let directory = null;
if (process.argv.length === 4 && process.argv[2] === "--directory") {
    directory = process.argv[3];
}

if (directory !== null) {
    console.log(`Serving files from ${directory}`);
}

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
        if (method === "GET") {
            if (path === "/") {
                response = "HTTP/1.1 200 OK\r\n\r\n";
            } else if (path.startsWith("/echo/")) {
                const message = path.substring(6);
                const acceptEncodingLine = lines.find(x => x.startsWith("Accept-Encoding: "));
                if (acceptEncodingLine) {
                    const acceptEncodings = acceptEncodingLine.substring(17).split(', ');
                    if (acceptEncodings.some(x => x === "gzip")) {
                        response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${message.length}\r\n\r\n${message}`;
                    } else {
                        response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`;
                    }
                } else {
                    response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`;
                }
            } else if (path === "/user-agent") {
                const userAgentLine = lines.find(x => x.startsWith("User-Agent: "));
                const userAgent = userAgentLine.substring(12);
                response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
            } else if (path.startsWith("/files/")) {
                if (directory === null) {
                    response = "HTTP/1.1 404 Not Found\r\n\r\n";
                } else {
                    const file_name = path.substring(7);
                    const file_path = `${directory}/${file_name}`;
                    if (existsSync(file_path)) {
                        const file = readFileSync(file_path);
                        response = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length}\r\n\r\n${file}`;
                    } else {
                        response = "HTTP/1.1 404 Not Found\r\n\r\n";
                    }
                }
            } else {
                response = "HTTP/1.1 404 Not Found\r\n\r\n";
            }
        } else if (method === "POST") {
            if (path.startsWith("/files/")) {
                const file_name = path.substring(7);
                const file_path = `${directory}/${file_name}`;
                const body = data.toString().substring(data.toString().indexOf("\r\n\r\n") + 4);

                writeFileSync(file_path, body);

                response = "HTTP/1.1 201 Created\r\n\r\n";
            }
        }

        socket.write(response);
    });
});

server.listen(4221, "localhost");

