export class Presenter {
    constructor(view, model) {
        this.view = view
        this.model = model
        this.isSmileDetected = false;
        this.isBlinkDetected = false;
        this.checkTimeout = null;
        this.currentStage = 'position';
    }

    async initStream() {
        const stream = await this.model.startStream()
        this.view.setPresenter(this);

        if (!stream) return

        const videoElement = this.view.createVideoBlock()

        videoElement.addEventListener('loadeddata', () => {
            this.view.createMaskVideo()
            this.view.createInfoBlock()
            this.view.updateInfoBlockMessage('Пожалуйста, подождите, идет настройка модели');
            this.view.createResetButton()
        });

        await this.model.init(videoElement)
        this.view.updateInfoBlockMessage('Модель успешно настроена');

        this.facePositionCheck()
    }

    facePositionCheck() {
        const faceMask = document.querySelector('.frame-mask');

        this.facePositionInterval = setInterval(() => {
            if (faceMask) {
                const {faceCenterX, faceCenterY, distance} = this.model.facePosition()
                const rect = faceMask.getBoundingClientRect();

                const normalizedX = faceCenterX / rect.width;
                const normalizedY = faceCenterY / rect.height;

                const maskZone = {
                    xMin: 0.15,
                    xMax: 0.45,
                    yMin: 0.40,
                    yMax: 0.65
                };

                const distanceZone = {
                    min: 0.25,
                    max: 0.45
                }

                const isWithinX = normalizedX >= maskZone.xMin && normalizedX <= maskZone.xMax;
                const isWithinY = normalizedY >= maskZone.yMin && normalizedY <= maskZone.yMax;
                const isDistanceZone = distance >= distanceZone.min && distance <= distanceZone.max;

                if (this.currentStage === 'position') {
                    let positionMessage = '';
                    if (!isWithinX && !isWithinY && !isDistanceZone) {
                        positionMessage = 'Пожалуйста, поместите лицо в центр кадра';
                    } else if (!isDistanceZone) {
                        positionMessage = distance < distanceZone.min ? 'Отдалите камеру' : 'Приблизьте камеру';
                    } else if (!isWithinX) {
                        positionMessage = normalizedX < maskZone.xMin ? 'Сместитесь влево' : 'Сместитесь вправо';
                    } else if (!isWithinY) {
                        positionMessage = normalizedY < maskZone.yMin ? 'Опустите голову ниже' : 'Поднимите голову выше';
                    }

                    this.view.updateInfoBlockMessage(positionMessage)
                }

                const isInPosition =  isWithinX && isWithinY && isDistanceZone
                if (isInPosition && this.currentStage === 'position') {
                    this.determineAndStartStage();
                }

                if (!isInPosition && this.currentStage !== 'position' && this.currentStage !== 'complete') {
                    this.currentStage = 'position';
                    this.stopTimeoutChecking();
                    this.view.updateInfoBlockMessage('Верните лицо в рамку');
                }
            }
        }, 100)
    }

    smileCheck() {
        const check = () => {
            if (this.currentStage !== 'smile') return;

            const isSmiling = this.model.smileCheck();

            if (isSmiling && !this.isSmileDetected) {
                this.isSmileDetected = true;
                this.stopTimeoutChecking();
                this.view.updateInfoBlockMessage('Спасибо, проверка прошла');
            } else if (!isSmiling && !this.isSmileDetected) {
                this.view.updateInfoBlockMessage('Пожалуйста, улыбнитесь');
            }

            this.checkTimeout = setTimeout(check, 100)
        }

        check()
    }

    blinkCheck() {
        const check = () => {
            if (this.currentStage !== 'blink') return;

            const isBlinking = this.model.eyeCheck();
            if (isBlinking && !this.isBlinkDetected) {
                this.isBlinkDetected = true
                this.stopTimeoutChecking();
            } else if (!isBlinking && !this.isBlinkDetected) {
                this.view.updateInfoBlockMessage('Пожалуйста, моргните');
            }

            this.checkTimeout = setTimeout(check, 100)
        }

        check()
    }

    stopTimeoutChecking() {
        if (this.checkTimeout) {
            clearTimeout(this.checkTimeout);
            this.checkTimeout = null;
        }
    }

    determineAndStartStage() {
        this.stopTimeoutChecking();

        if (this.isBlinkDetected) {
            this.currentStage = 'complete';
            this.view.updateInfoBlockMessage('Проверка пройдена!');
            this.view.showResetButton(true);
        } else if (this.isSmileDetected && !this.isBlinkDetected) {
            this.currentStage = 'blink';
            this.blinkCheck();
        } else {
            this.currentStage = 'smile';
            this.smileCheck();
        }
    }

    resetAndRestart() {
        this.isSmileDetected = false;
        this.isBlinkDetected = false;
        this.currentStage = 'position';

        this.stopTimeoutChecking()

        this.model.reset();
        this.view.showResetButton(false);
        this.facePositionCheck()
    }
}