import {FrModel} from "./fr/models/Model.js";
import {FrView} from "./fr/view/View.js";
import {Presenter} from "./fr/presenter/Presenter.js";
import {HumanManager} from "./fr/managers/HumanManager.js";
import {MediaPipeManager} from "./fr/managers/MediaPipeManager.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentPresenter = null;
    let currentModel = null;
    let currentView = null;

    const engineSelect = document.getElementById('engineSelect');
    const applyBtn = document.getElementById('applyEngineBtn');

    function createManager(type) {
        switch (type) {
            case 'human':
                return new HumanManager();
            case 'mediapipe':
                return new MediaPipeManager();
            default:
                return new HumanManager();
        }
    }

    async function stopCurrentPresenter() {
        if (currentPresenter) {
            currentPresenter.stop();
        }

        if (currentModel) {
            currentModel.stop();
        }
    }

    async function initWithEngine(engineType) {
        await stopCurrentPresenter();

        const cameraContainer = document.getElementById('cameraContainer');
        cameraContainer.innerHTML = '';

        const oldResetButton = document.querySelector('.reset__button');
        if (oldResetButton) {
            oldResetButton.remove();
        }

        currentView = new FrView();

        const faceManager = createManager(engineType);
        currentModel = new FrModel(faceManager);
        currentPresenter = new Presenter(currentView, currentModel);

        await currentPresenter.initStream();
    }

    applyBtn.addEventListener('click', async () => {
        const selectedEngine = engineSelect.value;
        console.log(`Переключение на движок: ${selectedEngine}`);
        await initWithEngine(selectedEngine);
    });

    initWithEngine('human');
})