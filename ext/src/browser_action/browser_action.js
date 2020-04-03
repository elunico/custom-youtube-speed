let element = document.getElementById('cys-speedRange');

chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
  chrome.tabs.sendMessage(
      tabs[0].id, {from: 'cys', message: 'speed-query'}, function(response) {
        if (!response) {
          throw 'Empty Response!'
        }
        if (!response.ok) {
          throw `Invalid Response! ${response.reason}`;
        }
        element.value = Number(response['current-speed'] || 1);
        let d = document.getElementById('cys-speedDiv');
        d.innerHTML = Number(response['current-speed'] || 1);
      });
});


element.oninput = () => {
  let d = document.getElementById('cys-speedDiv');
  d.innerHTML = element.value;

  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'cys', message: 'speed-change', speed: element.value},
        function(response) {
          if (!response) {
            throw 'Empty Response!'
          }
          if (!response.ok) {
            throw `Invalid Response! ${response.reason}`;
          }
        });
  });
};
