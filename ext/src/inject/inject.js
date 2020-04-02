chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

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
      });

      console.log('Listener ready!');
    }
  }, 10);
});
