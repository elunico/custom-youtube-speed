let element = document.getElementById('cys-speedRange');

let presetButtons = document.getElementsByClassName('btn-preset');
let saveButton = document.getElementById('btn-save-speed');
let disableKeysButton = document.getElementById('btn-disable-keys');
let changePresetButton = document.getElementById('change-presets-button');
let presetFields = document.getElementsByClassName('preset-field');
let submitPresetsButton = document.getElementById('submit-presets');
let showingChangePreset = false;


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.from == 'cys' && request.message == 'options-loaded') {
    let speed = Number(request.speed);
    element.value = speed;
    let d = document.getElementById('cys-speedDiv');
    d.textContent = speed.toFixed(2).toString(); // `${speed}`;
    console.log(`UI updated for speed ${speed}`);
    sendResponse({
      ok: true,
      reason: `Updated UI for speed ${speed}`,
      speed: speed
    });
  }

  if (request.from == 'cys' && request.message == 'user-presets-load') {
    // todo: remove this
    // ignore this its probably fine
    console.log('Uh Oh uncomment lines 28 to 38 in browser_action.js')
    //   let idx = 0;
    //   for (let preset of request.presets) {
    //     console.log(preset);
    //     presetButtons[idx].value = preset + 'x';
    //     idx++;
    //   }
    //   sendResponse({
    //     ok: true,
    //     reason: `Updated UI for presets`,
    //     presets: presets
    //   });
    // }
  }
});

changePresetButton.onclick = function () {
  if (showingChangePreset) {
    return;
  }

  showingChangePreset = true;
  let container = document.getElementById('mainPopup');
  container.style.setProperty('height', '450px');

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
    presets[idx] = preset
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
    }, function (response) {
      if (response) {
        console.log("Response recevied: " + JSON.stringify(response.presets));
      }
    });
  });
}

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
        if (response && response.ok) {
          d.textContent = `Saved default speed as ${response.speed.toFixed(2)}`;
        } else {
          d.textContent = 'Error could not save!';
        }
        setTimeout(() => {
          d.innerHTML = ''
        }, 800);
      });
  });
};

chrome.tabs.query({
  currentWindow: true,
  active: true
}, function (tabs) {
  let tab = tabs[0];
  chrome.tabs.sendMessage(tab.id, {
    from: 'cys',
    message: 'is-listening'
  }, function (response) {
    if (response) {
      let listening = response.listening;
      disableKeysButton.value = `${listening ? 'Disable' : 'Enable'} keyboard controls`;
    }
  });
});

disableKeysButton.onclick = () => {
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
    let tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {
      from: 'cys',
      message: 'toggle-listening'
    }, function (response) {
      if (response) {
        let listening = response.listening;
        disableKeysButton.value = `${listening ? 'Disable' : 'Enable'} keyboard controls`;
      }
    });
  });
}

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
        element.value = 0;
        d.innerHTML = '&lt;No Video&gt;';
        element.setAttribute('disabled', 'true');
      } else {
        element.removeAttribute('disabled');
        element.value = Number(response['current-speed'] || 1);
        d.textContent = Number(response['current-speed'] || 1).toFixed(2).toString();
      }
    });
});

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
      if (!response) {
        return ;
      }
      const {
        presets
      } = response;
      console.log(presets);
      let idx = 0;
      for (let preset of presets) {
        console.log(preset);
        presetButtons[idx].value = preset + 'x';
        idx++;
      }

    });
});

for (let button of presetButtons) {
  button.onclick = () => {
    let btnValue = Number(button.value.substring(0, button.value.length - 1));
    let d = document.getElementById('cys-speedDiv');
    d.textContent = button.value;
    element.value = btnValue;
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id, {
          from: 'cys',
          message: 'speed-change',
          speed: btnValue
        },
        function (response) {
          if (!response) {
            console.error('No Response');
            return;
          }
          if (!response.ok) {
            console.error(`Invalid Response! ${response.reason}`);
            return;
          }
        });
    });
  }
}

element.oninput = () => {
  let d = document.getElementById('cys-speedDiv');
  d.textContent = element.value;

  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id, {
        from: 'cys',
        message: 'speed-change',
        speed: element.value
      },
      function (response) {
        if (!response) {
          console.error('No response');
          return;
        }
        if (!response.ok) {
          console.error(`Invalid Response! ${response.reason}`);
          return;
        }
      });
  });
};
