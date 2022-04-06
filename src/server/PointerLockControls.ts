import {
	Camera,
	Euler,
	EventDispatcher,
	Vector3
} from 'three';
import socketIO from "socket.io";

const direction = new Vector3( 0, 0, - 1 );

const _PI_2 = Math.PI / 2;

interface movementEvent {
	movementX: number;
	movementY: number;
}

class PointerLockControls extends EventDispatcher {
	private euler = new Euler( 0, 0, 0, 'YXZ');
	private vector = new Vector3();
	public isLocked = false;
	public minPolarAngle = 0;
	public maxPolarAngle = Math.PI;
	private pointerSpeed = 1.0;

	constructor( private camera: Camera, private socket: socketIO.Socket) {
		super();
		this.connect();
	}

	onMouseMove = (event: movementEvent) => {
		if ( this.isLocked === false ) return;

		const movementX = event.movementX || 0;
		const movementY = event.movementY || 0;

		this.euler.setFromQuaternion( this.camera.quaternion );

		this.euler.y -= movementX * 0.002 * this.pointerSpeed;
		this.euler.x -= movementY * 0.002 * this.pointerSpeed;

		this.euler.x = Math.max( _PI_2 - this.maxPolarAngle, Math.min( _PI_2 - this.minPolarAngle, this.euler.x ) );

		this.camera.quaternion.setFromEuler( this.euler );
	}

	public lock = () => {
		this.socket.on( 'mousemove', this.onMouseMove );
		this.isLocked = true;
	}

	public unlock = () => {
		this.socket.off( 'mousemove', this.onMouseMove );
		this.isLocked = false;
	}

	onPointerlockError = () => {
		console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );
		this.disconnect();
	}

	public connect() {
		this.socket.on( 'lock', this.lock );
		this.socket.on( 'unlock', this.unlock );
		this.socket.on( 'pointerlockerror', this.onPointerlockError );
		this.socket.on( 'moveForward', this.moveForward);
		this.socket.on( 'moveBackward', this.moveBackward);
		this.socket.on( 'moveLeft', this.moveLeft);
		this.socket.on( 'moveRight', this.moveRight);
		this.socket.on( 'moveUp', this.moveUp);
		this.socket.on( 'moveDown', this.moveDown);
	};

	public disconnect() {
		this.socket.off( 'lock', this.lock );
		this.socket.off( 'unlock', this.unlock );
		this.socket.off( 'pointerlockerror', this.onPointerlockError );
		this.socket.off( 'moveForward', this.moveForward);
		this.socket.off( 'moveBackward', this.moveBackward);
		this.socket.off( 'moveLeft', this.moveLeft);
		this.socket.off( 'moveRight', this.moveRight);
		this.socket.off( 'moveUp', this.moveUp);
		this.socket.off( 'moveDown', this.moveDown);
	};

	public dispose() {
		this.disconnect();
	};

	public getObject(){ // retaining this method for backward compatibility
		return this.camera;
	};

	public getDirection(v: Vector3) {
		return v.copy( direction ).applyQuaternion( this.camera.quaternion );
	};

	public moveForward = ({ distance }: {distance: number}) => {
		let { vector, camera } = this;

		vector.setFromMatrixColumn( camera.matrix, 2 );
		vector.negate();

		camera.position.addScaledVector( vector, distance );

	};

	public moveBackward = ({ distance }: {distance: number}) => {
		this.moveForward({ distance: -distance });
	};

	public moveRight = ( { distance }: {distance: number} ) => {
		let { vector, camera} = this;

		vector.setFromMatrixColumn( camera.matrix, 0 );

		camera.position.addScaledVector(vector, distance );

	};

	public moveLeft = ( { distance }: {distance: number}) => {
		this.moveRight({ distance: -distance });
	};

	public moveUp = ({ distance }: {distance: number} ) => {
		let {vector, camera} = this;

		vector.setFromMatrixColumn( camera.matrix, 1);
		vector.negate();

		camera.position.addScaledVector(vector, distance );
	}

	public moveDown = ( { distance }: {distance: number} ) => {
		this.moveUp({ distance: -distance});
	};

	public reset = (position: Vector3) => {
		this.camera.position.set(position.x, position.y, position.z);
		this.camera.quaternion.setFromEuler(new Euler(0, 0, 0, "YXZ"));
	}
	// public lock() {
	// 		this.domElement.requestPointerLock();
	// 	};

	// public unlock() {
	// 		this.domElement.ownerDocument.exitPointerLock();
	// 	};

}

export { PointerLockControls };