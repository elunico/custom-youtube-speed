function toArray(htmlCollection) {
  return new Array(htmlCollection.length).fill(0).map((ignore, index) => htmlCollection[index]);
}

let prevdef;
let stopprop;
let allowintext;

const defaultPresets = ['1', '2', '2.25', '2.5', '2.75', '3', '3.5'];

const defaultOptions = {
  'skip-forward': ']',
  'skip-backward': '[',
  'speed-up': '+',
  'slow-down': '-',
  'big-speed-up': '*',
  'big-slow-down': "/",
  'reset-speed': '`',
  'pause': 'Enter',
};

const optionsDescriptions = {
  'skip-forward': 'Skip forward in video',
  'skip-backward': 'Skip backward in video',
  'speed-up': 'Speed up by <code>0.1x</code>',
  'slow-down': 'Slow down by <code>0.1x</code>',
  'big-speed-up': 'Speed up by <code>1.0x</code>',
  'big-slow-down': 'Slow down by <code>1.0x</code>',
  'speed-modifier': 'Multiplies all speed increments by <code>1/2</code>',
  'reset-speed': 'Set speed to <code>1.0x</code>',
  'pause': 'Start and stop the video'
};



let speedSetting = 1.0;
let listening = true;
chrome.storage.sync.get({
  'cys-key-listen': true
}, function (items) {
  if (typeof items['cys-key-listen'] == 'boolean') {
    listening = items['cys-key-listen'];
  } else {
    listening = items['cys-key-listen'] != 'false';
  }
});

chrome.storage.sync.get({
  'cys-user-presets': defaultPresets
}, function (items) {
  chrome.extension.sendMessage({
    message: 'user-presets-load',
    presets: items,
    from: 'cys'
  }, function (response) {
    console.log(response);
  });
});

function killEvent(event) {
  if (stopprop) event.stopImmediatePropagation();
  if (prevdef) event.preventDefault();
}

function loadDefault() {
  chrome.storage.sync.get({
    'prevdef': false,
    'stopprop': false,
    'allowintext': false,
    ...defaultOptions
  }, function (items) {
    prevdef = items.prevdef;
    stopprop = items.stopprop;
  });
  chrome.storage.sync.get({
    'cys-default-speed': 1
  }, function (items) {
    let speed = Number(items['cys-default-speed']);
    speedSetting = speed;
    toArray(document.getElementsByTagName('video')).map((video) => {
      if (video) {
        video.playbackRate = speed;
        console.log(`Set speed to loaded default: ${speed}`);
        chrome.runtime.sendMessage({
          message: 'options-loaded',
          from: 'cys',
          speed: speed
        },
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
    setInterval(() => {
      toArray(document.getElementsByTagName('video')).map((video) => {
        if (video) {
          video.playbackRate = speedSetting;
        }
      });
    }, 350);
  });
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

function keybind_matches(event, code) {
  if (event.key == code) {
    return true;
  }

  return event.key.toLowerCase() == code.toLowerCase();
}

let bindings;
get_user_settings().then(settings => {
  bindings = settings;
  prevdef = settings.prevdef;
  stopprop = settings.stopprop;
  allowintext = settings.allowintext;

});

function setHandler() {
  document.addEventListener('keypress', function (event) {
    // todo: prevent default in async is maybe not going to work

    if (!bindings) bindings = defaultOptions;

    toArray(document.getElementsByTagName('video')).map((video) => {
      if (video && listening) {
        let elt = document.activeElement;
        let name = elt.tagName.toLowerCase();
        if (!allowintext && (name == 'input' || name == 'textarea' || elt.hasAttribute('contenteditable'))) {
          return;
        }

        if (keybind_matches(event, (bindings['skip-forward']))) {
          video.currentTime += (10 * video.playbackRate);
          killEvent(event);
        } else if (keybind_matches(event, (bindings['skip-backward']))) {
          video.currentTime -= (10 * video.playbackRate);
          killEvent(event);
        } else if (keybind_matches(event, (bindings['pause']))) {
          togglePause(video);
          killEvent(event);
        } else if (keybind_matches(event, (bindings['reset-speed']))) {
          speedSetting = 1;
          video.playbackRate = 1;
          showStatus(video.playbackRate);
          killEvent(event);
        }

        let rateChange = 0;
        if (keybind_matches(event, bindings['speed-up'])) {
          rateChange = +(event.shiftKey ? 0.05 : 0.1);
        } else if (keybind_matches(event, bindings['slow-down'])) {
          rateChange = -(event.shiftKey ? 0.05 : 0.1);
        } else if (keybind_matches(event, bindings['big-speed-up'])) {
          rateChange = +(event.shiftKey ? 0.5 : 1);
        } else if (keybind_matches(event, bindings['big-slow-down'])) {
          rateChange = -(event.shiftKey ? 0.5 : 1);
        }
        if (rateChange != 0) {
          if (((video.playbackRate + rateChange) <= 8.0) && ((video.playbackRate + rateChange) >= 0.1)) {
            video.playbackRate += rateChange;
            speedSetting = video.playbackRate;
          }
          killEvent(event);
          showStatus(video.playbackRate);
        }
      }
    });
    get_user_settings().then(settings => bindings = settings);
  });
}

chrome.extension.sendMessage({}, function (response) {
  setHandler();

  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      loadDefault();

      chrome.runtime.onMessage.addListener(function (
        request, sender, sendRepsonse) {
        if (request.from === 'cys' && request.message === 'is-listening') {
          sendRepsonse({
            status: 'ok',
            listening: listening,
            message: 'Listening status'
          });
        }
        if (request.from === 'cys' && request.message === 'toggle-listening') {
          listening = !listening;
          // already negated
          chrome.storage.sync.set({
            'cys-key-listen': listening
          }, function () {
            console.log("Toggled keylistening");
            sendRepsonse({
              status: 'ok',
              listening: listening,
              message: 'Toggled listening'
            });
          });
          return true;
        }
        if (request.from === 'cys' && request.message === 'speed-change') {
          let speed = Number(request.speed);
          speedSetting = speed;
          let videos = document.getElementsByTagName('video');
          if (!videos) {
            sendRepsonse({
              ok: false,
              reason: 'Video element not found'
            });
          } else {
            for (let video of videos) video.playbackRate = speed;
            sendRepsonse({
              ok: true
            });
          }
        }
        if (request.from === 'cys' && request.message === 'speed-query') {
          let video = document.getElementsByTagName('video')[0];
          if (video) {
            sendRepsonse({
              ok: true,
              'current-speed': video.playbackRate
            });
          } else {
            sendRepsonse({
              ok: false,
              reason: 'No video element found'
            });
          }
        }
        if (request.from === 'cys' && request.message === 'presets-query') {
          chrome.storage.sync.get({
            'cys-user-presets': ['1', '2', '2.25', '2.5', '2.75', '3', '3.5']
          }, function (items) {
            sendRepsonse({
              presets: items['cys-user-presets']
            });
          });
          return true;
        }
        if (request.from === 'cys' && request.message === 'speed-save') {
          let speed = document.getElementsByTagName('video')[0].playbackRate;
          console.log('Attempting save');
          chrome.storage.sync.set({
            'cys-default-speed': Number(speed)
          }, function () {
            console.log('Sending response');
            sendRepsonse({
              ok: true,
              speed: speed
            });
          });
          return true;
        }
        if (request.from === 'cys' && request.message === 'update-presets') {
          console.log("Saving presets");
          console.log(request.presets);
          chrome.storage.sync.set({
            'cys-user-presets': request.presets
          }, function () {
            sendRepsonse({
              ok: true,
              presets: request.presets
            });
          });
          return true;
        }
      });

      console.log('Listener ready!');
    }
  }, 10);
});

function get_user_settings() {
  return new Promise((res, rej) => {
    chrome.storage.sync.get({
      ...defaultOptions,
      stopprop: false,
      prevdef: false,
      allowintext: false
    }, function (items) {
      res(items);
    });
  });
}
