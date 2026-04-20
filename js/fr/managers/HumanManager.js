export class HumanManager {
    constructor(videoElement) {
        this.human = null;
        this.videoElement = videoElement;
        this.faceData = null;
    }

    async init () {
        this.human = new Human.Human({
            debug: false,
            backend: 'webgl',
            modelBasePath: './public/models',
            face: {
                enabled: true,
                detector: { rotation: false },
                mesh: { enabled: true },
                attention: { enabled: false },
                iris: { enabled: true },
                description: { enabled: false },
                emotion: { enabled: true },
                antispoof: { enabled: false },
                liveness: { enabled: false }
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
        this.faceData = this.human.result.face[0];

        const isSmiling = this.checkSmile();

        const isBlinking = this.checkBlink();

        return {
            distance: this.faceData.distance,
            box: this.faceData.box,
            isSmiling: isSmiling,
            isBlinking: isBlinking
        }
    }

    checkSmile() {
        const happyEmotion = this.faceData.emotion.find(e => e.emotion === 'happy');
        return happyEmotion && happyEmotion.score > 0.6
    }

    checkBlink() {
        const {leftEyeUpper0, leftEyeLower0, rightEyeUpper0, rightEyeLower0} = this.faceData.annotations;

        const leftEyeOpenness = this.calculateEyeOpenness(leftEyeUpper0, leftEyeLower0);
        const rightEyeOpenness = this.calculateEyeOpenness(rightEyeUpper0, rightEyeLower0);

        const BLINK_THRESHOLD = 8;

        const isLeftBlinking = leftEyeOpenness < BLINK_THRESHOLD;
        const isRightBlinking = rightEyeOpenness < BLINK_THRESHOLD;

        return isLeftBlinking && isRightBlinking
    }

    calculateEyeOpenness(upperPoints, lowerPoints) {
        const upperCenter = upperPoints[Math.floor(upperPoints.length / 2)];
        const lowerCenter = lowerPoints[Math.floor(lowerPoints.length / 2)];

        return Math.abs(upperCenter[1] - lowerCenter[1]);
    }
}