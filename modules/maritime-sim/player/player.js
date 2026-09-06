import { Config, PixelStreaming } from "@epicgames-ps/lib-pixelstreamingfrontend-ue5.8";

const params = new URLSearchParams(location.search);
const parentOrigin = params.get("parentOrigin");
const root = document.getElementById("stream");
const config = new Config({ useUrlParams: true, initialSettings: {
  ss: "ws://127.0.0.1:8888", AutoConnect: false, AutoPlayVideo: true,
  StartVideoMuted: true, HoveringMouse: true,
} });
const stream = new PixelStreaming(config, { videoElementParent: root });
document.getElementById("play").addEventListener("click", () => stream.play());
let lastTime = -1;
setInterval(() => {
  const video = root.querySelector("video");
  const playing = !!video && !video.paused && video.readyState >= 2 && video.currentTime !== lastTime;
  document.getElementById("play").hidden = playing;
  if (playing && parentOrigin) window.parent.postMessage({ type: "maritime-stream", status: "playing" }, parentOrigin);
  lastTime = video?.currentTime ?? -1;
}, 1000);
window.addEventListener("pagehide", () => stream.disconnect());
stream.connect();
