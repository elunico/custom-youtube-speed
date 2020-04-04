let element = document.getElementById('cys-speedRange');

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
          }
          if (!response.ok) {
            console.error(`Invalid Response! ${response.reason}`);
          }
        });
  });
};
