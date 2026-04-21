export class FrModel {
    constructor(faceManager) {
        this.stream = null;
        this.videoElement = null;
        this.faceManager = faceManager;
        this.initialized = false;
        this.faceData = null;
        this.animationId = null;
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

        if (this.initialized && this.faceManager) {
            const faceData = this.faceManager.getFaceData();
            this.setFaceData(faceData);
            this.eyeCheck()
        }

        this.animationId = requestAnimationFrame(() => this.getFaceData());
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
        return this.faceData?.isSmiling || false;
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
        return this.faceData?.isBlinking || false;
    }

    reset() {
        this.faceData = null;

        this.getFaceData();
    }

    stop() {
        this.initialized = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.faceManager && this.faceManager.stop) {
            this.faceManager.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}