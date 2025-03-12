import {createServer} from "net";
import {existsSync, readFileSync, writeFileSync} from "fs";
import * as zlib from "zlib";

let directory = null;
if (process.argv.length === 4 && process.argv[2] === "--directory") {
    directory = process.argv[3];
}

if (directory !== null) {
    console.log(`Serving files from ${directory}`);
}

/**
 * Handles GET
 * @param path {string}
 * @param lines {string[]}
 * @param socket {Socket}
 */
function handleGetRequest(path, lines, socket) {
    let response = null;

    if (path === "/") {
        response = "HTTP/1.1 200 OK\r\n\r\n";
    } else if (path.startsWith("/echo/")) {
        const message = path.substring(6);
        const acceptEncodingLine = lines.find(x => x.startsWith("Accept-Encoding: "));
        if (acceptEncodingLine) {
            const acceptEncodings = acceptEncodingLine.substring(17).split(', ');
            if (acceptEncodings.some(x => x === "gzip")) {
                const encoded = zlib.gzipSync(message);
                let headers = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${encoded.length}\r\n\r\n`;
                socket.write(headers);
                socket.write(encoded);
                socket.end();
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

    if (response != null) {
        socket.write(response);
        socket.end();
    }
}

/**
 * Handles POST
 * @param path {string}
 * @param data {Buffer}
 * @param socket {Socket}
 */
function handlePostRequest(path, data, socket) {
    let response;
    if (path.startsWith("/files/") && directory !== null) {
        const file_name = path.substring(7);
        const file_path = `${directory}/${file_name}`;
        const dataString = data.toString();
        const bodyStartIndex = dataString.indexOf("\r\n\r\n") + 4;
        const body = dataString.substring(bodyStartIndex);

        writeFileSync(file_path, body);

        response = "HTTP/1.1 201 Created\r\n\r\n";
    } else {
        response = "HTTP/1.1 404 Not Found\r\n\r\n";
    }

    socket.write(response);
    socket.end();
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

    socket.on("data", async (data) => {
        console.log("RECEIVED:", data.toString());

        const lines = data.toString().split("\r\n");
        const [method, path] = lines[0].split(" ");

        switch (method) {
            case "GET":
                handleGetRequest(path, lines, socket);
                break;
            case "POST":
                handlePostRequest(path, data, socket);
                break;
            default:
                socket.write("HTTP/1.1 405 Method Not Allowed\r\n\r\n");
                socket.end();
        }
    });
});

server.listen(4221, "localhost");


