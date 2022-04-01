import socketIO from "socket.io";
import * as THREE from "three";
import Jimp from 'jimp';
import { OBJLoader } from "./OBJLoader.js"
import fs from "fs"
import path from "path"
import { PointerLockControls } from "./PointerLockControls";

class RendererScene {
    private renderer;
    private mesh = new THREE.Mesh();
    private scene = new THREE.Scene();
    private camera;
    private clock = new THREE.Clock();
    private controls;

    constructor(
        private socket: socketIO.Socket,
        private gl: any,
        private width: number,
        private height: number
    ) {
        this.renderer = new THREE.WebGL1Renderer({ context: gl });
        this.renderer.setSize(width, height);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);

        this.buildScene();
        this.controls = new PointerLockControls(this.camera, this.socket);

        setInterval(() => {
            this.render()
        }, 100)
    }

    buildScene() {
        const planeGeometry = new THREE.PlaneGeometry(100, 100, 50, 50)
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        })
        const plane = new THREE.Mesh(planeGeometry, material)
        plane.rotateX(-Math.PI / 2)
        this.scene.add(plane)

        const cubes: THREE.Mesh[] = []
        for (let i = 0; i < 50; i++) {
            const geo = new THREE.BoxGeometry(
                Math.random() * 4,
                Math.random() * 16,
                Math.random() * 4
            )
            const mat = new THREE.MeshBasicMaterial({ wireframe: true })
            switch (i % 3) {
                case 0:
                    mat.color = new THREE.Color(0xff0000)
                    break
                case 1:
                    mat.color = new THREE.Color(0xffff00)
                    break
                case 2:
                    mat.color = new THREE.Color(0x0000ff)
                    break
            }
            const cube = new THREE.Mesh(geo, mat)
            cubes.push(cube)
        }
        cubes.forEach((c) => {
            c.position.x = Math.random() * 100 - 50
            c.position.z = Math.random() * 100 - 50
            c.geometry.computeBoundingBox()
            c.position.y =
                ((c.geometry.boundingBox as THREE.Box3).max.y -
                    (c.geometry.boundingBox as THREE.Box3).min.y) /
                2
            this.scene.add(c)
        })

        this.camera.position.y = 1;
        this.camera.position.z = 2;
    }

    private render = () => {
        this.renderer.render(this.scene, this.camera);

        var bitmapData = new Uint8Array(this.width * this.height * 4)
        this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, bitmapData)

        new Jimp(this.width, this.height, (err: object, image: any) => {
            image.bitmap.data = bitmapData;
            image.getBuffer("image/png", (err: object, buffer: Uint8Array) => {
                this.socket.emit('image', Buffer.from(buffer));
            });
        })
    }
};

export { RendererScene };