let element = document.getElementById('cys-speedRange');
let presetButtons = document.getElementsByClassName('btn-preset');

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
          })
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
