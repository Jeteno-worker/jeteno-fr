import { FilesetResolver, FaceLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';

export class MediaPipeManager {
    constructor(videoElement) {
        this.faceLandmarker = null;
        this.videoElement = videoElement;
        this.faceData = null;
    }

    async init() {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        this.faceLandmarker = await FaceLandmarker.createFromOptions(
            filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "VIDEO",
                numFaces: 1
            }
        )

        console.log('MediaPipe инициализирован');

        await this.detectionLoop();
    }

    setElement(videoElement) {
        this.videoElement = videoElement;
    }

    async detectionLoop() {
        const timestamp = performance.now();

        this.faceData = await this.faceLandmarker.detectForVideo(this.videoElement, timestamp);
        requestAnimationFrame(() => this.detectionLoop());
    }

    getFaceData() {
        const landmarks = this.faceData.faceLandmarks[0];
        const blendshapes = this.faceData.faceBlendshapes?.[0];

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const point of landmarks) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        const videoWidth = this.videoElement?.videoWidth;
        const videoHeight = this.videoElement?.videoHeight;

        const box = [
            Math.floor(minX * videoWidth),
            Math.floor(minY * videoHeight),
            Math.floor((maxX - minX) * videoWidth),
            Math.floor((maxY - minY) * videoHeight)
        ];

        const faceWidth = (maxX - minX) * videoWidth;
        const distance = Math.min(0.8, Math.max(0.2, 0.8 - (faceWidth - 100) / 500));

        const isSmiling = this.checkSmile(blendshapes);

        const isBlinking = this.checkBlink(blendshapes);

        return {
            hasFace: true,
            distance: distance,
            box: box,
            isSmiling: isSmiling,
            isBlinking: isBlinking
        };
    }

    checkSmile(blendshapes) {
        if (!blendshapes || !blendshapes.categories) return false;

        const scores = {};
        for (const cat of blendshapes.categories) {
            scores[cat.categoryName] = cat.score;
        }

        const leftSmile = scores.mouthSmileLeft || 0;
        const rightSmile = scores.mouthSmileRight || 0;

        return leftSmile > 0.5 || rightSmile > 0.5;
    }

    checkBlink(blendshapes) {
        if (!blendshapes || !blendshapes.categories) return false;

        const scores = {};
        for (const cat of blendshapes.categories) {
            scores[cat.categoryName] = cat.score;
        }

        const leftBlink = scores.eyeBlinkLeft || 0;
        const rightBlink = scores.eyeBlinkRight || 0;

        return leftBlink > 0.6 && rightBlink > 0.6;
    }
}