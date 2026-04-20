export class FrModel {
    constructor(faceManager) {
        this.stream = null;
        this.videoElement = null;
        this.faceManager = faceManager;
        this.initialized = false;
        this.pollingTimeout = null;
        this.faceData = null;
    }

    async startStream() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true
            })

            return this.stream
        } catch (error) {
            console.error(`Доступ к камере запрещен: ${error}`)
        }
    }

    async init (videoElement) {
        if (!this.faceManager) {
            console.error('FaceManager не установлен');
        }
        if (!videoElement) return

        this.setVideo(videoElement)

        try {
            this.faceManager.setElement(this.videoElement);
            await this.faceManager.init()
            this.setInitialized(true)

            this.getFaceData()
        } catch (error) {
            console.log('Ошибка инициализации: ', error);
        }
    }

    getFaceData() {
        if (!this.initialized) return

        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout);
        }

        const polling = () => {
            if (this.initialized && this.faceManager) {
                const faceData = this.faceManager.getFaceData();
                this.setFaceData(faceData);
                this.eyeCheck()
            }

            this.pollingTimeout = setTimeout(polling, 100);
        }

        polling()
    }

    setVideo(videoElement) {
        this.videoElement = videoElement
        if (this.stream) {
            this.videoElement.srcObject = this.stream
        }
    }

    setInitialized(initialized) {
        this.initialized = initialized
    }

    setFaceData(data) {
        this.faceData = data
    }

    smileCheck() {
        if (!this.faceData || !this.faceData.emotion) return

        const happyEmotion = this.faceData.emotion.find(e => e.emotion === 'happy');
        return happyEmotion && happyEmotion.score > 0.6
    }

    facePosition() {
        if (!this.faceData) return

        const [x, y, width, height] = this.faceData.box;
        const distance = this.faceData.distance;
        const faceCenterX = x + width / 2;
        const faceCenterY = y + height / 2;

        return {faceCenterX, faceCenterY, distance}
    }

    eyeCheck() {
        if (!this.faceData) return

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

    reset() {
        this.faceData = null;

        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout);
            this.pollingTimeout = null;
        }

        this.getFaceData();
    }
}