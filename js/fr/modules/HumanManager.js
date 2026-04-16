export class HumanManager {
    constructor(videoElement) {
        this.human = null;
        this.videoElement = videoElement;
    }

    async init () {
        this.human = new Human.Human({
            debug: true,
            backend: 'webgl',
            modelBasePath: 'https://vladmandic.github.io/human-models/models/',
            face: {
                enabled: true,
                detector: { rotation: false },
                mesh: { enabled: true },
                attention: { enabled: false },
                iris: { enabled: true },
                description: { enabled: true },
                emotion: { enabled: true },
                antispoof: { enabled: true },
                liveness: { enabled: true }
            },
        })

        this.human.draw.options.drawPoints = false;

        await this.human.load();
        await this.human.warmup();
        await this.detectionLoop();
    }

    setElement(videoElement) {
        this.videoElement = videoElement;
    }

    async detectionLoop () {
        await this.human.detect(this.videoElement)
        requestAnimationFrame(() => this.detectionLoop());
    }

    getFaceData () {
        const face = this.human.result.face[0];

        return {
            age: face.age,
            gender: face.gender,
            emotion: face.emotion,
            real: face.real,
            live: face.live,
            distance: face.distance,
            rotation: face.rotation,
            meshRaw: face.meshRaw,
            box: face.box,
        }
    }
}