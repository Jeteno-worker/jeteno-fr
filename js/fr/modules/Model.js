export class FrModel {
    constructor(faceManager) {
        this.stream = null;
        this.videoElement = null;
        this.faceManager = faceManager;
        this.initialized = false;
        this.pollingInterval = null;
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

    async init () {
        if (!this.faceManager) {
            console.error('FaceManager не установлен');
        }
        if (!this.videoElement) return

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

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        //переделать на рекурсивный таймаут
        this.pollingInterval = setInterval(() => {
            if (this.initialized && this.faceManager) {
                const faceData = this.faceManager.getFaceData();
                this.setFaceData(faceData);
                console.log('faceData: ', faceData);
            }
        }, 2000);
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
        if (!this.faceData) return

        if (this.faceData.emotion) {
            const happyEmotion = this.faceData.emotion.find(e => e.emotion === 'happy');
            if (happyEmotion && happyEmotion.score > 0.6) {
                return true;
            }
        }
    }

    facePosition() {
        if (!this.faceData) return

        const [x, y, width, height] = this.faceData.box;
        const distance = this.faceData.distance;
        const faceCenterX = x + width / 2;
        const faceCenterY = y + height / 2;

        return {faceCenterX, faceCenterY, distance}
    }
}