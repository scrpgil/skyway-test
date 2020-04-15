const Peer = window.Peer;

const getQueryVariable = (variable = "") => {
  const query = window.location.search.substring(1);
  const vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    if (pair[0] === variable) {
      return pair[1];
    }
  }
};
(async function main() {
  const localVideo = document.getElementById("js-local-stream");
  const localId = document.getElementById("js-local-id");
  const callTrigger = document.getElementById("js-call-trigger");
  const closeTrigger = document.getElementById("js-close-trigger");
  const remoteVideo = document.getElementById("js-remote-stream");
  const remoteId = document.getElementById("js-remote-id");
  // const meta = document.getElementById('js-meta');
  // const sdkSrc = document.querySelector('script[src*=skyway]');

  // meta.innerText = `
  //   UA: ${navigator.userAgent}
  //   SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  // `.trim();

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3
  }));
  const peerOn = remoteId => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId, localStream);

    mediaConnection.on("stream", async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once("close", () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener("click", () => mediaConnection.close(true));
  };

  // Register caller handler
  callTrigger.addEventListener("click", () => {
    peerOn(remoteId.value);
  });

  peer.once("open", id => {
    localId.textContent = "https://kickoffionic.web.app/?id=" + id;
    // localId.textContent = "http://127.0.0.1:8100/?id=" + id;
    const remoteId = getQueryVariable("id");
    console.log(remoteId);
    if (remoteId) {
      const localIdHtml = document.getElementById("local-id");
      localIdHtml.style.display = "none";
      setTimeout(() => {
        console.log("true");
        peerOn(remoteId);
      }, 500);
    }
  });

  // Register callee handler
  peer.on("call", mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on("stream", async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once("close", () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener("click", () => mediaConnection.close(true));
  });

  peer.on("error", console.error);
})();
