function toArray(htmlCollection) {
  return new Array(htmlCollection.length).fill(0).map((ignore, index) => htmlCollection[index]);
}

let listening = true;
browser.storage.sync.get({ 'cys-key-listen': true }).then((items) => {
  if (typeof items['cys-key-listen'] == 'boolean') {
    listening = items['cys-key-listen'];
  } else {
    listening = items['cys-key-listen'] != 'false';
  }
}).catch((err) => console.error(err));

function loadDefault() {
  browser.storage.sync.get({ 'cys-default-speed': 1 }).then((items) => {
    let speed = Number(items['cys-default-speed']);
    let videos = document.getElementsByTagName('video');
    console.log(items);
    toArray(videos).map((video) => {
      if (video) {
        video.playbackRate = speed;
        console.log(`Set speed to loaded default: ${speed}`);
        chrome.runtime.sendMessage(
          { message: 'options-loaded', from: 'cys', speed: speed },
          function (response) {
            if (response && response.ok) {
              console.log('UI Updated for loaded options');
            }
            // else {
            //   console.error(response);
            // }
          });
      }
    });
  }).catch((error) => console.error(error));
}

function togglePause(videoElt) {
  if (videoElt.paused) {
    videoElt.play();
  } else {
    videoElt.pause();
  }
}
let child;
let timeout;

function showStatus(status) {
  if (!child) {
    child = document.createElement('div');
    child.classList.add('cys-show-status-popup');
    document.body.appendChild(child);
  }
  if (timeout) {
    clearTimeout(timeout);
  }
  child.removeAttribute('hidden');
  child.textContent = `Speed: ${status.toFixed(2)}`;
  timeout = setTimeout(() => {
    child.setAttribute('hidden', true);
    timeout = null;
  }, 750);
}

function setHandler() {
  document.addEventListener('keypress', function (event) {
    toArray(document.getElementsByTagName('video')).map((video) => {
      if (video && listening) {
        if (event.key == ']') {
          video.currentTime += (10 * video.playbackRate);
        } else if (event.key == '[') {
          video.currentTime -= (10 * video.playbackRate);
        } else if (event.key == 'Enter') {
          togglePause(video);
        } else if (event.key == '`') {
          video.playbackRate = 1;
          showStatus(video.playbackRate);
        }

        if (['+', '-', '*', '/'].includes(event.key)) {
          let rateChange = 0;
          if (event.key == '+') {
            rateChange = +(event.shiftKey ? 0.05 : 0.1);
          } else if (event.key == '-') {
            rateChange = -(event.shiftKey ? 0.05 : 0.1);
          } else if (event.key == '*') {
            rateChange = +(event.shiftKey ? 0.5 : 1);
          } else if (event.key == '/') {
            rateChange = -(event.shiftKey ? 0.5 : 1);
          }
          if (((video.playbackRate + rateChange) <= 8.0) && ((video.playbackRate + rateChange) >= 0.1)) {
            video.playbackRate += rateChange;
          }
          showStatus(video.playbackRate);
        }
      }
    });
  });
}

chrome.runtime.sendMessage({}, function (response) {
  setHandler();

  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      loadDefault();

      chrome.runtime.onMessage.addListener(function (
        request, sender, sendRepsonse) {
        if (request.from === 'cys' && request.message === 'is-listening') {
          sendRepsonse({ status: 'ok', listening: listening, message: 'Listening status' });
        }
        if (request.from === 'cys' && request.message === 'toggle-listening') {
          listening = !listening;
          // already negated
          chrome.storage.sync.set({ 'cys-key-listen': listening }, function () {
            console.log("Toggled keylistening");
            sendRepsonse({ status: 'ok', listening: listening, message: 'Toggled listening' })
          });
          return true;
        }
        if (request.from === 'cys' && request.message === 'speed-change') {
          let speed = Number(request.speed);
          let videos = document.getElementsByTagName('video');
          if (!videos) {
            sendRepsonse({ ok: false, reason: 'Video element not found' });
          } else {
            for (let video of videos) video.playbackRate = speed;
            sendRepsonse({ ok: true });
          }
        }
        if (request.from === 'cys' && request.message === 'speed-query') {
          let video = document.getElementsByTagName('video')[0];
          if (video) {
            sendRepsonse({ ok: true, 'current-speed': video.playbackRate });
          } else {
            sendRepsonse({ ok: false, reason: 'No video element found' });
          }
        }
        if (request.from === 'cys' && request.message === 'speed-save') {
          let speed = document.getElementsByTagName('video')[0].playbackRate;
          console.log('Attempting save');
          chrome.storage.sync.set(
            { 'cys-default-speed': Number(speed) }, function () {
              console.log('Sending response');
              sendRepsonse({ ok: true, speed: speed });
            });
          return true;
        }
      });

      console.log('Listener ready!');
    }
  }, 10);
});
