// @ts-ignore
import * as ONNX_WEBGPU from 'onnxruntime-web/webgpu';
import * as tf from '@tensorflow/tfjs';
import {
  encoderOutput,
  inputImageData,
  currentStatus,
  fetchModel,
  initialImageDims,
} from 'src/lib';

const processImage = async (img: HTMLImageElement, modelSize: string) => {
  currentStatus.set(
    `Uploaded image is ${img.width}x${img.height}px. Loading the encoder model (~28 MB).`,
  );
  initialImageDims.update(() => [img.width, img.height]);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    let sourceX, sourceY, sourceWidth, sourceHeight;
    if (img.width > img.height) {
      sourceWidth = img.height;
      sourceHeight = img.height;
      sourceX = (img.width - img.height) / 2;
      sourceY = 0;
    } else {
      sourceWidth = img.width;
      sourceHeight = img.width;
      sourceX = 0;
      sourceY = (img.height - img.width) / 2;
    }

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 1024, 1024);

    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    // Update inputImageData to notify subscribers
    inputImageData.update((current) => imageData);

    const rgbData = [];

    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < imageData.data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const pixelValue = imageData.data[i + j] / 255.0;
        const normalizedValue = (pixelValue - mean[j]) / std[j];
        rgbData.push(normalizedValue);
      }
    }
    // Create a tensor with shape [1024, 1024, 3]
    const tensor = tf.tensor3d(rgbData, [1024, 1024, 3]);

    // Transpose and reshape to [1, 3, 1024, 1024]
    const batchedTensor = tf.tidy(() => {
      const transposed = tf.transpose(tensor, [2, 0, 1]);
      return tf.expandDims(transposed, 0);
    });

    try {
      const model = await fetchModel({ isEncoder: true, modelSize });
      const session = await ONNX_WEBGPU.InferenceSession.create(model, {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'disabled',
      });

      const feeds = {
        image: new ONNX_WEBGPU.Tensor(batchedTensor.dataSync(), batchedTensor.shape),
      };

      const start = Date.now();
      const results = await session.run(feeds);
      const end = Date.now();
      const time_taken = (end - start) / 1000;

      console.log({ results });
      // Update encoderOutput to notify subscribers
      encoderOutput.update((current) => ({ ...current, ...results }));

      inputImageData.set(imageData);
      currentStatus.set(
        `Embedding generated in ${time_taken} seconds. Click on the image to generate a mask.`,
      );
    } catch (error) {
      console.error(error);
      currentStatus.set(`Error: ${error}`);
    } finally {
    }
  }
};

export default processImage;
