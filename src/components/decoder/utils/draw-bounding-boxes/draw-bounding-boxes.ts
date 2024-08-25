import { encoderOutput, inputImageData } from 'src/lib';
import { get } from 'svelte/store';

interface DetectionResult {
    boxes: number[][];
    scores: number[];
    classes: number[];
}

const COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
    'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
    'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
    'hair drier', 'toothbrush'
];

const drawBoundingBoxes = (canvas: HTMLCanvasElement, detectionThreshold: number = 0.5) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    //const output = encoderOutput.get();
    //const imageData = inputImageData.get();

    const output = get(encoderOutput);
    const imageData = get(inputImageData);

    if (!output || !imageData) return;

    const detectionResult: DetectionResult = {
        boxes: output.boxes.data as number[][],
        scores: output.scores.data as number[],
        classes: output.classes.data as number[]
    };

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the original image
    ctx.putImageData(imageData, 0, 0);

    // Draw bounding boxes
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.font = '16px Arial';
    ctx.fillStyle = 'red';

    for (let i = 0; i < detectionResult.boxes.length; i++) {
        const score = detectionResult.scores[i];
        if (score > detectionThreshold) {
            const [y1, x1, y2, x2] = detectionResult.boxes[i];
            const width = x2 - x1;
            const height = y2 - y1;

            ctx.strokeRect(x1, y1, width, height);

            const classId = detectionResult.classes[i];
            const className = COCO_CLASSES[classId];
            const label = `${className}: ${score.toFixed(2)}`;

            ctx.fillText(label, x1, y1 > 20 ? y1 - 5 : y1 + 20);
        }
    }
};

export default drawBoundingBoxes;