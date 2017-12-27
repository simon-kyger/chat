const yt = () => {
  let yttag = document.createElement('script');
  yttag.id = 'iframe-demo';
  yttag.src = 'https://www.youtube.com/iframe_api';
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(yttag, firstScriptTag);
  var ytplayers = [];
  function onYouTubeIframeAPIReady(divid, videoid){
      if (!divid)
          return;
      let player = new YT.Player(divid, {
          // playervars : {
          //     'origin': 'http://youtube.com'
          // },
          width: `350px`,
          height: `250px`,
          videoId: videoid,
          events : {
              'onStateChange' : function(e){
  	            if (e.data == YT.PlayerState.PLAYING) {
  			        $.each(ytplayers, function() {
  			            if (this.getPlayerState() == YT.PlayerState.PLAYING && this.getIframe().id != e.target.getIframe().id) {
  			                this.pauseVideo();
  			            }
  			        });
  			    }
              }
          }
      });
      ytplayers.push(player);
  };

  return {
    yt: onYouTubeIframeAPIReady,
    ytplayers
  }

}

export default yt;
