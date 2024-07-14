const { ipcMain } = require("electron");
const { exec } = require("child_process");
const { getMainWindow } = require("./utils");

ipcMain.on("getAudioSrcs", (event) => {
  sendAudioSrcs();
});

function getAudioSrcs() {
  return new Promise((resolve, reject) => {
    exec(
      "LANG=C pactl list | grep -A2 'Source #' | grep 'Name: ' | cut -d\" \" -f2",
      (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing pactl:", error);
          reject(error);
          return;
        }
        if (stderr) {
          console.error("stderr output:", stderr);
          reject(new Error(stderr));
          return;
        }

        const audioSrcs = stdout
          .split("\n")
          .filter((line) => line.trim() !== "");
        resolve(audioSrcs);
      }
    );
  });
}

function sendAudioSrcs() {
  const mainWindow = getMainWindow(); // Get mainWindow reference
  if (!mainWindow) {
    console.error("Main window is not defined.");
    return;
  }

  getAudioSrcs()
    .then((audioSrcs) => {
      // console.log(audioSrcs);
      mainWindow.webContents.send("audioSrcs", audioSrcs);
    })
    .catch((error) => {
      console.log("error fetching audio sources:", error);
    });
}

module.exports = {
  sendAudioSrcs,
};
