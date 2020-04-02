function getVideoSpeed() {
  let video = document.getElementsByTagName('video')[0];
  if (!video) {
    return null;
  } else {
    return video.playbackRate;
  }
}

let currentSpeed = Number(getVideoSpeed() || 1);
let element = document.getElementById('cys-speedRange');
element.value = currentSpeed;
let d = document.getElementById('cys-speedDiv');
d.innerHTML = currentSpeed;

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
