function loadDefault() {
  chrome.storage.sync.get({'cys-default-speed': 1}, function(items) {
    let speed = Number(items['cys-default-speed']);
    let video = document.getElementsByTagName('video')[0];
    if (video) {
      video.playbackRate = speed;
      console.log(`Set speed to loaded default: ${speed}`);
      chrome.runtime.sendMessage(
          {message: 'options-loaded', from: 'cys', speed: speed},
          function(response) {
            if (response && response.ok) {
              console.log('UI Updated for loaded options');
            } else {
              console.error(response);
            }
          });
    }
  });
}

function setHandler() {
  document.addEventListener('keypress', function(event) {
    let video = document.getElementsByTagName('video')[0];
    console.log(event);
    console.log(event.key);
    if (video) {
      if (event.key == ']') {
        video.currentTime += (10 * video.playbackRate);
      } else if (event.key == '[') {
        video.currentTime -= (10 * video.playbackRate);
      } else if (event.key == 'Enter') {
        video.pause();
      }
    }
  });
}

chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      loadDefault();

      setHandler();

      chrome.runtime.onMessage.addListener(function(
          request, sender, sendRepsonse) {
        if (request.from === 'cys' && request.message === 'speed-change') {
          let speed = Number(request.speed);
          let video = document.getElementsByTagName('video')[0];
          if (!video) {
            sendRepsonse({ok: false, reason: 'Video element not found'});
          } else {
            video.playbackRate = speed;
            sendRepsonse({ok: true});
          }
        }
        if (request.from === 'cys' && request.message === 'speed-query') {
          let video = document.getElementsByTagName('video')[0];
          if (video) {
            sendRepsonse({ok: true, 'current-speed': video.playbackRate});
          } else {
            sendRepsonse({ok: false, reason: 'No video element found'});
          }
        }
        if (request.from === 'cys' && request.message === 'speed-save') {
          let speed = document.getElementsByTagName('video')[0].playbackRate;
          console.log('Attempting save');
          chrome.storage.sync.set(
              {'cys-default-speed': Number(speed)}, function() {
                console.log('Sending response');
                sendRepsonse({ok: true, speed: speed});
              });
          return true;
        }
      });

      console.log('Listener ready!');
    }
  }, 10);
});
