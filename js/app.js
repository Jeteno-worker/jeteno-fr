import {FrModel} from "./fr/models/Model.js";
import {FrView} from "./fr/view/View.js";
import {Presenter} from "./fr/presenter/Presenter.js";
import {HumanManager} from "./fr/managers/HumanManager.js";
import {MediaPipeManager} from "./fr/managers/MediaPipeManager.js";

document.addEventListener('DOMContentLoaded', () => {
    const faceManager = new HumanManager();
    // const faceManager = new MediaPipeManager();
    const model = new FrModel(faceManager);
    const view = new FrView();
    const presenter = new Presenter(view, model);

    presenter.initStream()
})