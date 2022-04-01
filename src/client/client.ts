const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let isLocked = false;

const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

resizeCanvas();

window.addEventListener('resize', resizeCanvas, false);

const socket: SocketIOClient.Socket = io()
socket.on("connect", () => {
    setInterval(() => {
        socket.emit("clientTimestamp", Date.now())
    }, 1000)
})

socket.on("disconnect", () => {
    detach();
});

const lockButton = document.getElementById("lockButton") as HTMLButtonElement;
lockButton.addEventListener("click", () => { attach(); }, false);

let blob: Blob
let url: string
const img = new Image();
const pingPongMs = document.getElementById("pingPongMs") as HTMLSpanElement

socket.on("image", function (buffer: ArrayBuffer) {
    if (buffer.byteLength) {
        blob = new Blob([buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);

        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        img.src = url;
    }
});

socket.on("timestampResponse", function (t: number) {
    pingPongMs.innerText = (Date.now() - t).toString()
})

const onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
        case 'KeyW':
            socket.emit("moveForward", {distance: 0.25});
            break;
        case 'KeyS':
            socket.emit("moveBackward", {distance: 0.25});
            break;
        case 'KeyA':
            socket.emit("moveLeft", {distance: 0.25});
            break;
        case 'KeyD':
            socket.emit("moveRight", {distance: 0.25});
            break;
        case 'KeyQ':
            socket.emit("moveDown", {distance: 0.25});
            break;
        case 'KeyE':
            socket.emit("moveUp", {distance: 0.25});
            break;
    }
}
document.addEventListener('keydown', onKeyDown, false);

const onMouseMove = (event: MouseEvent) => {
    let { movementX, movementY } = event;
    socket.emit("mousemove", { movementX, movementY});
};

const onPointerLockChange = () => {
    if (canvas.ownerDocument.pointerLockElement == canvas) {
        socket.emit("lock");
        isLocked = true;
        canvas.ownerDocument.addEventListener('mousemove', onMouseMove);
    } else {
        socket.emit("unlock");
        canvas.ownerDocument.removeEventListener('mousemove', onMouseMove);
        isLocked = false;
    }
};

const onPointerLockError = () => {
    socket.emit("lockError");
}

const attach = () => {
    canvas.requestPointerLock();
    canvas.ownerDocument.addEventListener('pointerlockchange', onPointerLockChange);
    canvas.ownerDocument.addEventListener('pointerlockerror', onPointerLockError);
}

const detach= () => {
    canvas.ownerDocument.exitPointerLock();
    canvas.ownerDocument.removeEventListener('pointerlockchange', onPointerLockChange);
    canvas.ownerDocument.removeEventListener('pointerlockerror', onPointerLockError);
}
