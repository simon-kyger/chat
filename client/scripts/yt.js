export default function(){
	let yttag = document.createElement('script');
	yttag.id = 'iframe-demo';
	yttag.src = 'https://www.youtube.com/iframe_api';
	let firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(yttag, firstScriptTag);
	function onYouTubeIframeAPIReady(divid, videoid){
	    if (!divid)
	        return;
	    let player = new YT.Player(divid, {
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
	    this.ytplayers.push(player);
	}();
}