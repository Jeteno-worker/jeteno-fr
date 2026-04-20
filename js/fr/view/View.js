import {SVG_PATHS_FACE_MASK, SVG_PATHS_BACKGROUND_MASK} from './svgPaths.js'

export class FrView {
    constructor() {
        this.cameraContainer = document.getElementById('cameraContainer');
        this.frContainer = document.getElementById('frContainer');
        this._presenter = undefined
        this.resetButton = undefined
    }

    createVideoBlock() {
        const video = document.createElement('video');
        video.className = 'camera-container__video'

        video.autoplay = true;

        this.cameraContainer.appendChild(video);

        return video;
    }

    createMaskVideo() {
        const maskContainer = document.createElement('div');
        maskContainer.className = 'camera-container__mask';

        const frame = this.createSvgElement('svg', {
            viewBox: '0 0 386 524',
            class: 'frame-mask'
        }, [
            {
                tag: 'path',
                attributes: {
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': '5.006',
                    d: SVG_PATHS_FACE_MASK
                }
            }
        ]);

        const frameBackground = this.createSvgElement('svg', {
            viewBox: '0 0 1280 720',
            preserveAspectRatio: 'xMidYMid slice',
            class: 'frame-background-mask'
        }, [
            {
                tag: 'path',
                attributes: {
                    fill: '#FFF',
                    'fill-opacity': '0.7',
                    'fill-rule': 'evenodd',
                    d: SVG_PATHS_BACKGROUND_MASK
                }
            }
        ]);

        maskContainer.appendChild(frame);
        maskContainer.appendChild(frameBackground);

        this.cameraContainer.appendChild(maskContainer);

        return maskContainer;
    }

    createSvgElement(tag, attributes = {}, children = []) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tag);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value)
        })

        children.forEach(child => {
            if (child instanceof Node) {
                element.appendChild(child)
            } else {
                element.appendChild(this.createSvgElement(child.tag, child.attributes, child.children));
            }
        })

        return element
    }

    createInfoBlock() {
        const infoBlock = document.createElement("div");
        infoBlock.classList.add("info__block");

        const titleBlock = document.createElement("h3");
        titleBlock.classList.add("info__title");

        infoBlock.appendChild(titleBlock)
        this.cameraContainer.appendChild(infoBlock);
    }

    updateInfoBlockMessage(message) {
        const titleBlock = document.querySelector('.info__title');
        if (titleBlock) {
            titleBlock.textContent = message;
        }
    }

    createResetButton() {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Пройти проверку заново';
        resetButton.className = 'reset__button';

        this.frContainer.appendChild(resetButton);

        resetButton.addEventListener('click', () => {
            this._presenter.resetAndRestart()
        })

        this.resetButton = resetButton;
    }

    showResetButton(show) {
        if (this.resetButton) {
            this.resetButton.style.display = show ? 'block' : 'none';
        }
    }

    setPresenter(presenter) {
        this._presenter = presenter;
    }
}