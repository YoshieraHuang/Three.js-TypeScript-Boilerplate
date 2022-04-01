import express from "express";
import path from "path";
import http from "http";
import socketIO from "socket.io";
import { JSDOM } from "jsdom";
import { RendererScene } from "./scene";

const { window } = new JSDOM();
global.document = window.document;

const port: number = 3000;

class App {
    private server: http.Server
    private io: socketIO.Server
    private clients: any = {}
    private width = 1280
    private height = 720
    private gl = require('gl')(this.width, this.height, { preserveDrawingBuffer: true }); //headless-gl
    constructor(private port: number) {
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))

        this.server = new http.Server(app);

        this.io = new socketIO.Server(this.server);

        this.io.on('connection', (socket: socketIO.Socket) => {
            this.clients[socket.id] = new RendererScene(socket, this.gl, this.width, this.height);

            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id)
                if (this.clients && this.clients[socket.id]) {
                    console.log("deleting " + socket.id)
                    delete this.clients[socket.id]
                }
            })

            socket.on("clientTimestamp", (t: number) => {
                if (this.clients[socket.id]) {
                    socket.emit("timestampResponse", t);
                }
            })
        })
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()
