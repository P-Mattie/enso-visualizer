const { ipcRenderer } = require("electron");

ipcRenderer.on("audioData", (event, data) => {
  const canvas = document.getElementById("visualization");
  const context = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgb(0, 0, 0)";
  context.fillRect(0, 0, width, height);

  context.lineWidth = 2;
  context.strokeStyle = "rgb(0, 255, 0)";
  context.beginPath();

  const sliceWidth = (width * 1.0) / data.length;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    const y = ((v + 1) * height) / 2;

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += sliceWidth;
  }

  context.lineTo(canvas.width, canvas.height / 2);
  context.stroke();
});
