const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '../models/source_models');
const outputDir = path.resolve(__dirname, '../models/split_models');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const modelSizes = ['tiny', 'small', 'base_plus'];
const chunkSize = 9 * 1024 * 1024; // 9 MB in bytes

function splitModel(fileName, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Size of ${fileName}: ${fileBuffer.length} bytes`);

  const chunks = [];
  for (let i = 0; i < fileBuffer.length; i += chunkSize) {
    chunks.push(fileBuffer.slice(i, i + chunkSize));
  }

  // Save chunks to disk
  chunks.forEach((chunk, index) => {
    const chunkName = `${fileName.replace('.ort', '')}.part${index + 1}.onnx`;
    fs.writeFileSync(path.join(outputDir, chunkName), chunk);
  });

  console.log(`Split ${fileName} into ${chunks.length} parts`);
}

modelSizes.forEach((size) => {
  const fileName = `sam2_hiera_${size}.decoder.onnx`;
  const filePath = path.join(sourceDir, fileName);
  splitModel(fileName, filePath);
});
