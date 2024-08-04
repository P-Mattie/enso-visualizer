const { ipcRenderer } = require("electron");
const module1 = require("./modules/renderer/audio-analysis/fft");
const module2 = require("./modules/renderer/audio-visualisation/frequency-spectrum");
// -----------------------

const startAudioMonitorBtn = document.querySelector("#startAudioMonitor");

startAudioMonitorBtn.addEventListener("click", function () {
  ipcRenderer.send("start-audio-stream");
});

//-----------------------

const srcsList = document.querySelector(".audioSrc_Select");
const refreshListBtn = document.querySelector(".refresh-list-btn");

refreshListBtn.addEventListener("click", function () {
  ipcRenderer.send("getAudioSrcs");
});

ipcRenderer.on("audioSrcs", (event, data) => {
  srcsList.innerHTML = "";
  data.forEach((item) => {
    const newLi = document.createElement("li");
    newLi.textContent = item;
    newLi.classList.add("srcListLis");
    srcsList.appendChild(newLi);
    isDoubleClick(newLi, srcsLiDoubleClick);
  });
});

const srcsLiDoubleClick = (event) => {
  const srcName = event.target.innerText;
  updateAudioSrc(srcName);
  const sinkUl = event.target.parentElement;
  const sinkLis = Array.from(sinkUl.children);
  sinkLis.forEach((li) => {
    li.style.color = "";
  });
  event.target.style.color = "green";
};

//   handle rest in main !!!!!!!!!!!!!!!!!
function updateAudioSrc(srcName) {
  ipcRenderer.send("updateAudioSrc", srcName);
}

// -----------------------

const isDoubleClick = (target, onDoubleClick) => {
  let clicks = 0;
  let timer = null;

  const handleClick = () => {
    clicks++;
    if (clicks === 1) {
      timer = setTimeout(() => {
        clicks = 0;
      }, 200);
    } else if (clicks === 2) {
      clearTimeout(timer);
      clicks = 0;
      onDoubleClick(event);
    }
  };

  target.addEventListener("click", handleClick);
};

// -----------------------
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

//-----------------------------------------------
