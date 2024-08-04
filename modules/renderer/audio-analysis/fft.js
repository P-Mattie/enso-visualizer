const { ipcRenderer } = require("electron");
const FFT = require("fft.js");

//-----------------------------------------------------------------------------------------

const fftSize = 2048; // Match this with the chunk size used in the main process
const fft = new FFT(fftSize);
let audioDataBuffer = [];

// Apply Hamming window function to reduce spectral leakage
function applyWindowFunction(data) {
  const window = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (data.length - 1));
  }
  return data.map((value, index) => value * window[index]);
}

function performFFT(inputData) {
  if (inputData.length !== fftSize) {
    console.warn("Input data length does not match FFT size");
    return new Float32Array(0);
  }

  // Apply window function
  const windowedData = applyWindowFunction(inputData);

  const complexArray = fft.createComplexArray();
  const spectrum = fft.createComplexArray();

  // Copy the windowed data into the complex array
  for (let i = 0; i < windowedData.length; i++) {
    complexArray[2 * i] = windowedData[i];
    complexArray[2 * i + 1] = 0; // Imaginary part
  }

  // Perform the FFT
  fft.transform(spectrum, complexArray);

  const dbValues = new Float32Array(windowedData.length / 2);

  // Calculate the magnitudes of the FFT results
  for (let i = 0; i < windowedData.length / 2; i++) {
    const magnitude = Math.sqrt(
      spectrum[2 * i] * spectrum[2 * i] +
        spectrum[2 * i + 1] * spectrum[2 * i + 1]
    );
    dbValues[i] = 20 * Math.log10(magnitude);
  }

  return dbValues;
}

//-----------------------------------------------------------------------------------------

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const minDB = -60; // Minimum dB value to display
const maxDB = 0; // Maximum dB value to display

function drawSpectrum(dBValues) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const numBins = dBValues.length;
  const binWidth = canvas.width / numBins; // Bin width for each frequency bin
  const sampleRate = 44100;

  // Logarithmic scale settings
  const minFreq = 20; // Minimum frequency to display
  const maxFreq = 10000; // Maximum frequency to display
  const minX = 0; // Minimum x position
  const maxX = canvas.width; // Maximum x position

  // Function to get x position based on frequency
  function getXPosition(frequency) {
    // Log scale transformation
    return (
      (Math.log10(frequency / minFreq) / Math.log10(maxFreq / minFreq)) *
      (maxX - minX)
    );
  }

  function calculateFrequency(binIndex, numBins, sampleRate) {
    // Map bin index to frequency on a logarithmic scale
    return Math.pow(
      10,
      (Math.log10(maxFreq) - Math.log10(minFreq)) * (binIndex / (numBins - 1)) +
        Math.log10(minFreq)
    );
  }

  ctx.fillStyle = "green";
  for (let i = 0; i < numBins; i++) {
    const dB = dBValues[i];
    const frequency = calculateFrequency(i, numBins, sampleRate);
    const x = getXPosition(frequency); // Get x position using logarithmic scale
    const y = (1 - (dB - minDB) / (maxDB - minDB)) * canvas.height;
    ctx.fillRect(x, y, binWidth, canvas.height - y);
  }
}

//-----------------------------------------------------------------------------------------

function update() {
  if (audioDataBuffer.length > 0) {
    const audioData = audioDataBuffer.shift(); // Get the next chunk of audio data
    const magnitudes = performFFT(audioData); // Perform FFT
    drawSpectrum(magnitudes); // Draw the spectrum
  }
  requestAnimationFrame(update); // Repeat
}

ipcRenderer.on("audioData", (event, data) => {
  // Ensure the buffer doesn't grow indefinitely
  if (audioDataBuffer.length > 10) {
    audioDataBuffer.shift(); // Remove the oldest data if buffer is too full
  }
  audioDataBuffer.push(data);
});

// Start the update loop
update();
