const { ipcRenderer } = require("electron");

const canvas = document.getElementById("visualizer");
const context = canvas.getContext("2d");

ipcRenderer.on("audioData", (event, data) => {
  // Convert the raw audio data to an array of floating-point numbers
  const audioData = new Float32Array(data.buffer);

  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the waveform
  drawWaveform(audioData);
});

function drawWaveform(audioData) {
  const step = Math.ceil(audioData.length / canvas.width);
  const amp = canvas.height / 2;

  context.beginPath();
  for (let i = 0; i < canvas.width; i++) {
    const min = -1;
    const max = 1;
    const x = i;
    const y = audioData[i * step] * amp + amp;
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.strokeStyle = "blue";
  context.lineWidth = 2;
  context.stroke();
}
