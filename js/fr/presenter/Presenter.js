export class Presenter {
    constructor(view, model) {
        this.view = view
        this.model = model
        this.isSmileDetected = false;
        this.smileCheckInterval = null;
        this.facePositionInterval = null;
    }

    async initStream() {
        const stream = await this.model.startStream()

        if (!stream) return

        const videoElement = this.view.createVideoBlock()

        videoElement.addEventListener('loadeddata', () => {
            this.view.createMaskVideo()
            this.view.createInfoBlock()

            this.facePositionCheck()
        });

        this.model.setVideo(videoElement)

        await this.model.init()//передать сюда videoElement
    }

    smileCheck() {
        const infoTitle = document.querySelector('.info__title');

        this.smileCheckInterval = setInterval(() => {
            if (infoTitle) {
                const isSmiling = this.model.smileCheck();
                if (isSmiling && !this.isSmileDetected) {
                    this.isSmileDetected = true;
                    this.view.updateInfoBlockMessage('Спасибо, проверка прошла');
                    this.stopSmileChecking();
                } else if (!isSmiling && !this.isSmileDetected) {
                    this.view.updateInfoBlockMessage('Пожалуйста, улыбнитесь');
                }
            }
        }, 1000);
    }

    stopSmileChecking() {
        if (this.smileCheckInterval) {
            clearInterval(this.smileCheckInterval);
            this.smileCheckInterval = null;
        }
    }

    facePositionCheck() {
        const faceMask = document.querySelector('.frame-mask');

        this.facePositionInterval = setInterval(() => {
            if (faceMask) {
                const {faceCenterX, faceCenterY, distance} = this.model.facePosition()
                const rect = faceMask.getBoundingClientRect();

                const normalizedX = faceCenterX / rect.width;
                const normalizedY = faceCenterY / rect.height;
                console.log("normalizedX: ", normalizedX)
                console.log("normalizedY: ", normalizedY)

                const maskZone = {
                    xMin: 0.34,
                    xMax: 0.37,
                    yMin: 0.65,
                    yMax: 0.68
                };

                const distanceZone = {
                    min: 0.57,
                    max: 0.62
                }

                const isWithinX = normalizedX >= maskZone.xMin && normalizedX <= maskZone.xMax;
                const isWithinY = normalizedY >= maskZone.yMin && normalizedY <= maskZone.yMax;
                const isDistanceZone = distance >= distanceZone.min && distance <= distanceZone.max;
                console.log("distanceZone: ", distanceZone);
                console.log("isWithinX: ", isWithinX);
                console.log("isWithinY: ", isWithinY);

                let positionMessage = '';
                if (!isWithinX && !isWithinY && !isDistanceZone) {
                    positionMessage = 'Пожалуйста, поместите лицо в центр кадра';
                } else if (!isDistanceZone) {
                    positionMessage = distance < distanceZone.min ? 'Отдалите камеру' : 'Приблизьте камеру';
                } else if (!isWithinX) {
                    positionMessage = normalizedX < maskZone.xMin ? 'Сместитесь влево' : 'Сместитесь вправо';
                } else if (!isWithinY) {
                    positionMessage = normalizedY < maskZone.yMin ? 'Опустите голову ниже' : 'Поднимите голову выше';
                } else {
                    positionMessage = 'Лицо в зоне маски';
                    this.stopFacePositionChecking()
                    this.smileCheck();
                }

                this.view.updateInfoBlockMessage(positionMessage)
            }
        }, 1000)
    }

    stopFacePositionChecking() {
        if (this.facePositionInterval) {
            clearInterval(this.facePositionInterval);
            this.facePositionInterval = null;
        }
    }
}