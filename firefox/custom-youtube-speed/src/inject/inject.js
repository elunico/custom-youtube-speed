function toArray(htmlCollection) {
  return new Array(htmlCollection.length).fill(0).map((ignore, index) => htmlCollection[index]);
}

let prevdef;
let stopprop;
let allowintext;
let musiccheck;
let speedSetting = 1.0;
let speedWasSet = false;
let listening = true;
let child;
let timeout;
let bindings;

const successKeys = (reason) => { return { from: 'cys', ok: true, reason }; };
const failKeys = (reason) => { return { from: 'cys', ok: false, reason }; };

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
  'pause': 'Start and stop the video',
};

class StorageKeys {
  static CYS_USER_PRESETS_KEY = 'cys-user-presets';
  static CYS_DEFAULT_SPEED_KEY = 'cys-default-speed';
  static CYS_KEY_LISTEN_KEY = 'cys-key-listen-key';
  static CYS_KEY_PREV_DEF = 'prevdef';
  static CYS_KEY_STOP_PROP = 'stopprop';
  static CYS_KEY_ALLOW_IN_TEXT = 'allowintext';
  static CYS_MUSIC_CHECK = 'musiccheck';
}

function boolOrStringToBool(bors) {
  if (typeof bors == 'boolean') {
    return bors;
  } else {
    return bors.strip().toLowerCase() == 'true';
  }
}

function togglePause(videoElt) {
  if (videoElt.paused) {
    videoElt.play();
  } else {
    videoElt.pause();
  }
}

function killEvent(event) {
  if (stopprop) event.stopImmediatePropagation();
  if (prevdef) event.preventDefault();
}

function keybind_matches(event, code) {
  if (event.key == code) {
    return true;
  }

  return event.key.toLowerCase() == code.toLowerCase();
}

function notifiyPresetButtons() {
  chrome.storage.sync.get({
    [StorageKeys.CYS_USER_PRESETS_KEY]: defaultPresets
  }, function (items) {
    chrome.runtime.sendMessage({
      ...successKeys('user-presets-load'),
      presets: items,
    }, function (response) {
      console.log(response);
    });
  });
}

function setVideosSpeed(speed) {
  speedSetting = speed;
  toArray(document.getElementsByTagName('video')).map((video) => {
    if (video) {
      video.playbackRate = speedSetting;
    }
  });
}

function userOverrideDefaultSpeed(speed) {
  speedWasSet = true;
  setVideosSpeed(speed);
}

function reportLoaded() {
  chrome.runtime.sendMessage({
    ...successKeys('options-loaded'),
    speed: speedSetting
  },
    function (response) {
      if (response && response.ok) {
        console.log('UI Updated for loaded options');
      }
    });
}

function _loadUserDefaultSpeed() {
  chrome.storage.sync.get({
    [StorageKeys.CYS_DEFAULT_SPEED_KEY]: 1
  }, function (items) {
    let speed = Number(items[StorageKeys.CYS_DEFAULT_SPEED_KEY]);
    function local() {
      elts = document.querySelectorAll('#upload-info ytd-badge-supported-renderer.ytd-channel-name');
      for (let elt of elts) {
        let child = elt.querySelector('*[aria-label="Official Artist Channel"]');
        if (child && musiccheck) {
          setVideosSpeed(speedWasSet ? speedSetting : 1);
          reportLoaded();
          return true;
        }
      }
      setVideosSpeed(speedWasSet ? speedSetting : speed);
      reportLoaded();
      return false;
    }

    let interval = setInterval(() => {
      local();
    }, 250);


    return true;
  });
}

function loadUserSettings() {
  chrome.storage.sync.get({
    [StorageKeys.CYS_KEY_PREV_DEF]: false,
    [StorageKeys.CYS_KEY_STOP_PROP]: false,
    [StorageKeys.CYS_KEY_ALLOW_IN_TEXT]: false,
    [StorageKeys.CYS_KEY_LISTEN_KEY]: true,
    [StorageKeys.CYS_MUSIC_CHECK]: false,
    ...defaultOptions
  }, function (items) {
    prevdef = items[StorageKeys.CYS_KEY_PREV_DEF];
    stopprop = items[StorageKeys.CYS_KEY_STOP_PROP];
    allowintext = items[StorageKeys.CYS_KEY_ALLOW_IN_TEXT];
    console.log(`loaded value ${items[StorageKeys.CYS_MUSIC_CHECK]}`);
    musiccheck = boolOrStringToBool(items[StorageKeys.CYS_MUSIC_CHECK]);
    listening = boolOrStringToBool(items[StorageKeys.CYS_KEY_LISTEN_KEY]);
    bindings = items;
  });
  _loadUserDefaultSpeed();
  return true;
}

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
          userOverrideDefaultSpeed(1);
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
            // video.playbackRate += rateChange;
            userOverrideDefaultSpeed(video.playbackRate + rateChange);
          }
          killEvent(event);
          showStatus(video.playbackRate);
        }
      }
    });
  });
}

class EventResponder {

  constructor(sendRepsonse) {
    this.sendRepsonse = sendRepsonse;
  }

  updatePresetButtons(presets) {
    console.log("Saving presets");
    console.log(presets);
    chrome.storage.sync.set({
      [StorageKeys.CYS_USER_PRESETS_KEY]: presets
    }, () => {
      this.sendRepsonse({
        ...successKeys(),
        presets: presets
      });
    });
    return true;
  }

  saveSpeed() {
    let speed = document.getElementsByTagName('video')[0].playbackRate;
    console.log('Attempting save with speed: ' + speed);
    chrome.storage.sync.set({
      [StorageKeys.CYS_DEFAULT_SPEED_KEY]: Number(speed)
    }, () => {
      console.log('Sending response');
      this.sendRepsonse({
        ...successKeys(),
        speed: speed
      });
    });
    return true;

  }

  gotQueryPresets() {
    chrome.storage.sync.get({
      [StorageKeys.CYS_USER_PRESETS_KEY]: ['1', '2', '2.25', '2.5', '2.75', '3', '3.5']
    }, (items) => {
      this.sendRepsonse({
        ...successKeys(),
        presets: items[StorageKeys.CYS_USER_PRESETS_KEY]
      });
    });
    return true;
  }

  gotQuerySpeed() {
    let video = document.getElementsByTagName('video')[0];
    if (video) {
      this.sendRepsonse({
        ...successKeys(),
        'current-speed': video.playbackRate
      });
    } else {
      this.sendRepsonse({
        ...failKeys('No video element found')
      });
    }
  }

  changeSpeedTo(speed) {
    userOverrideDefaultSpeed(speed);
    let videos = document.getElementsByTagName('video');
    if (!videos) {
      this.sendRepsonse({
        ...failKeys('No video element found')
      });
    } else {
      // for (let video of videos) video.playbackRate = speed;
      setVideosSpeed(speed);
      this.sendRepsonse({
        ...successKeys(),
      });
    }
  }

  toggleListening() {
    listening = !listening;
    // already negated
    chrome.storage.sync.set({
      [StorageKeys.CYS_KEY_LISTEN_KEY]: listening
    }, () => {
      console.log("Toggled keylistening");
      this.sendRepsonse({
        ...successKeys('Toggled listening'),
        listening: listening,
      });
    });
    return true;
  }

  gotQueryListening() {
    this.sendRepsonse({
      ...successKeys('Listening status'),
      listening: listening,
    });
  }
}

chrome.runtime.sendMessage({}, function (response) {
  setHandler();

  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      loadUserSettings();
      console.log(`music check is ${musiccheck}`);
      console.log(speedSetting);
      notifiyPresetButtons();

      chrome.runtime.onMessage.addListener(function (request, sender, sendRepsonse) {
        if (request.from === 'cys') {
          let responder = new EventResponder(sendRepsonse);
          if (request.message === 'is-listening') {
            return responder.gotQueryListening();
          }
          if (request.message === 'toggle-listening') {
            return responder.toggleListening();
          }
          if (request.message === 'speed-change') {
            let speed = Number(request.speed);
            return responder.changeSpeedTo(speed);
          }
          if (request.message === 'speed-query') {
            return responder.gotQuerySpeed();
          }
          if (request.message === 'presets-query') {
            return responder.gotQueryPresets();
          }
          if (request.message === 'speed-save') {
            return responder.saveSpeed();
          }
          if (request.message === 'update-presets') {
            return responder.updatePresetButtons(request.presets);
          }
        }
      });

      console.log('Listener ready!');
    }
  }, 10);
  return true;
});
