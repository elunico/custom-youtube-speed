// Elements in the browser action page
let speedBarElement = document.getElementById('cys-speedRange');
let presetButtons = document.getElementsByClassName('btn-preset');
let saveButton = document.getElementById('btn-save-speed');
let disableKeysButton = document.getElementById('btn-disable-keys');
let keysButton = document.getElementById('btn-keybindings');
let changePresetButton = document.getElementById('change-presets-button');
let presetFields = document.getElementsByClassName('preset-field');
let submitPresetsButton = document.getElementById('submit-presets');
let showingChangePreset = false;

function responseCheckOk(response) {
  if (!response) {
    console.error('No Response');
    return false;;
  }
  if (!response.ok) {
    console.error(`Invalid Response! ${response.reason}`);
    return false;
  }
  return true; // response is ok
}

function delayClear(element, timeout = 1000) {
  setTimeout(function () {
    element.innerHTML = '';
  }, timeout);
}

// event assignments for browser action page
keysButton.onclick = () => chrome.runtime.openOptionsPage();

changePresetButton.onclick = function () {
  if (showingChangePreset) {
    return;
  }

  showingChangePreset = true;
  let container = document.getElementById('mainPopup');
  container.style.setProperty('height', '400px');

  let optionArea = document.getElementById('edit-preset-span');
  optionArea.removeAttribute('hidden');

  let idx = 0;
  for (let button of presetButtons) {
    presetFields[idx++].value = button.value.substring(0, button.value.length - 1);
  }
};

submitPresetsButton.onclick = function () {
  let idx = 0;
  let presets = [];
  for (let presetField of presetFields) {
    let preset = presetField.value;
    presets[idx] = preset;
    presetButtons[idx].value = preset + 'x';
    idx++;
  }

  let container = document.getElementById('mainPopup');
  container.style.setProperty('height', '300px');

  let optionArea = document.getElementById('edit-preset-span');
  optionArea.setAttribute('hidden', true);

  showingChangePreset = false;

  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
    let tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {
      from: 'cys',
      message: 'update-presets',
      presets: presets
    }, response => responseCheckOk(response) && console.log(`Updated presets to ${presets}`));

  });
};

saveButton.onclick = () => {
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id, {
      from: 'cys',
      message: 'speed-save'
    },
      function (response) {
        let d = document.getElementById('save-status');
        responseCheckOk(response) ? d.textContent = `Saved default speed as ${response.speed.toFixed(2)}` : d.textContent = 'Error could not save';
        delayClear(d);
      });
  });
};

function updateKeysEnabled(response) {
  return responseCheckOk(response) ?
    disableKeysButton.value = `${response.listening ? 'Disable' : 'Enable'} keyboard controls` :
    console.error('Error could not toggle listening');
}

disableKeysButton.onclick = () => {
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
    let tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {
      from: 'cys',
      message: 'toggle-listening'
    }, response => updateKeysEnabled(response));
  });
};

speedBarElement.oninput = () => {
  let d = document.getElementById('cys-speedDiv');
  d.textContent = speedBarElement.value;

  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id, {
      from: 'cys',
      message: 'speed-change',
      speed: speedBarElement.value
    }, responseCheckOk);
  });
};


// setting values for preset speed buttons
for (let button of presetButtons) {
  button.onclick = () => {
    let btnValue = Number(button.value.substring(0, button.value.length - 1));
    let d = document.getElementById('cys-speedDiv');
    d.innerHTML = button.value;
    speedBarElement.value = btnValue;
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id, {
        from: 'cys',
        message: 'speed-change',
        speed: btnValue
      }, responseCheckOk);
    });
  };
}

// loading options from injected script
function optionsDidLoad(speed) {
  speed = Number(speed);
  speedBarElement.value = speed;
  let d = document.getElementById('cys-speedDiv');
  d.textContent = speed.toFixed(2).toString();
  console.log(`UI updated for speed ${speed}`);
  sendResponse({
    ok: true,
    reason: `Updated UI for speed ${speed}`,
    speed: speed
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.from == 'cys' && request.message == 'options-loaded') {
    optionsDidLoad(request.speed);
  }
});

// check if listening is enabled at all in injected script
chrome.tabs.query({
  currentWindow: true,
  active: true
}, function (tabs) {
  let tab = tabs[0];
  chrome.tabs.sendMessage(tab.id, {
    from: 'cys',
    message: 'is-listening'
  }, response =>
    updateKeysEnabled(response)
  );
});

// determine the currently set speed in the injected script
chrome.tabs.query({
  currentWindow: true,
  active: true
}, function (tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id, {
    from: 'cys',
    message: 'speed-query'
  },
    function (response) {
      let d = document.getElementById('cys-speedDiv');
      if (!response || !response.ok) {
        speedBarElement.value = 0;
        d.textContent = '<No Video>';
        speedBarElement.setAttribute('disabled', 'true');
      } else {
        speedBarElement.removeAttribute('disabled');
        speedBarElement.value = Number(response['current-speed'] || 1);
        d.textContent = Number(response['current-speed'] || 1).toFixed(2).toString();
      }
    });
});

// find the user defined presets in the injected script
chrome.tabs.query({
  currentWindow: true,
  active: true
}, function (tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id, {
    from: 'cys',
    message: 'presets-query'
  },
    function (response) {
      if (!response || !response.ok) {
        return;
      }
      console.log(JSON.stringify(response));
      const {
        presets
      } = response;
      let idx = 0;
      for (let preset of presets) {
        console.log(preset);
        presetButtons[idx].value = preset + 'x';
        idx++;
      }

    });
});
