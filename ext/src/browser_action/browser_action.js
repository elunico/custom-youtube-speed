let element = document.getElementById('cys-speedRange');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.from = 'cys' && request.message == 'options-loaded') {
    let speed = Number(request.speed);
    element.value = speed;
    let d = document.getElementById('cys-speedDiv');
    d.innerHTML = `${speed}`;
    console.log(`UI updated for speed ${speed}`);
    sendResponse(
        {ok: true, reason: `Updated UI for speed ${speed}`, speed: speed});
  }
});

let presetButtons = document.getElementsByClassName('btn-preset');
let saveButton = document.getElementById('btn-save-speed');

saveButton.onclick = () => {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    chrome.tabs.sendMessage(
        tabs[0].id, {from: 'cys', message: 'speed-save'}, function(response) {
          let d = document.getElementById('save-status');
          if (response && response.ok) {
            d.innerHTML = `Saved default speed as ${response.speed}`;
          } else {
            d.innerHTML = 'Error could not save!';
          }
          setTimeout(() => {d.innerHTML = ''}, 800);
        });
  });
};

chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
  chrome.tabs.sendMessage(
      tabs[0].id, {from: 'cys', message: 'speed-query'}, function(response) {
        let d = document.getElementById('cys-speedDiv');
        if (!response || !response.ok) {
          element.value = 0;
          d.innerHTML = '&lt;No Video&gt;';
          element.setAttribute('disabled', 'true');
        } else {
          element.removeAttribute('disabled');
          element.value = Number(response['current-speed'] || 1);
          d.innerHTML = Number(response['current-speed'] || 1);
        }
      });
});

for (let button of presetButtons) {
  button.onclick = () => {
    let btnValue = Number(button.value.substring(0, button.value.length - 1));
    let d = document.getElementById('cys-speedDiv');
    d.innerHTML = button.value;
    element.value = btnValue;
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      chrome.tabs.sendMessage(
          tabs[0].id, {from: 'cys', message: 'speed-change', speed: btnValue},
          function(response) {
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
  d.innerHTML = element.value;

  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'cys', message: 'speed-change', speed: element.value},
        function(response) {
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
