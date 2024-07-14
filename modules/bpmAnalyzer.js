const RealtimeBpmAnalyzer = require("realtime-bpm-analyzer");
const { startAudioStream, audioStreamEmitter } = require("./stream-audio-src");

const bpmAnalyzer = new RealtimeBpmAnalyzer();

audioStreamEmitter.on("audioData", (audioData) => {
  bpmAnalyzer
    .analyze(audioData)
    .then((bpm) => {
      console.log("bpm: ", bpm);
    })
    .catch((err) => {
      console.error("BPM analysis error:", err);
    });
});

startAudioStream();
