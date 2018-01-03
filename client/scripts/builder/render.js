export default {
    renderText: function(tab, args){
        let div =   `<div class='msg' style='background-color:${args.bgcolor};'>
                        <span style='text-shadow: 2px 2px 5px black;'>${args.date}</span>
                        <span style='text-shadow: 2px 2px 5px black; color:${args.color};'>${args.name}</span>
                        <span style='color: ${args.color};'>${args.msg}</span>
                    </div>`;
        this.msgs[tab].append(div);
    },
    renderImage: function(tab, args){
        let img =   `<a href='${args.msg}' target='_blank'>
                        <img class='imgs' src='${args.msg}' target='_blank' style='width: auto; max-width: 350px; min-width: 350px; max-height: 250px; min-height:250px; border-radius: 10px;'></img>
                    </a>`;
        let link = `<a href='${args.msg}' target='_blank'>${args.msg}</a>`;
        let div =   `<div class='msg' style='background-color:${args.bgcolor};'>
                        <span style='text-shadow: 2px 2px 5px black;'>${args.date}</span>
                        <span style='text-shadow: 2px 2px 5px black; color:${args.color};'>${args.name}</span>
                        <span>${link}</span>
                        <br>
                        ${img}
                    </div>`;
        this.msgs[tab].append(div);
        this.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
        //lolfun $('.imgs').draggable({containment: $('.msgs')});
    },
    renderStaticImage: function(tab, args){
        let img =   `<img class='imgs' src='data:image/png;base64,${args.image}' style='width: auto; max-width: 350px; min-width: 350px; max-height: 250px; min-height:250px; border-radius: 10px;'></img>`;
        let div =   `<div class='msg' style='background-color:${args.bgcolor}';>
                        <span style='text-shadow: 2px 2px 5px black;'>${args.date}</span>
                        <span style='text-shadow: 2px 2px 5px black; color:${args.color};'>${args.name}</span>
                        <br>
                        ${img}
                    </div>`;
        this.msgs[tab].append(div);
        this.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
    },
    renderCodeBlock: function(tab, args){
        let div =   `<div class='msg' style='background-color:${args.bgcolor}';>
                        <span style='text-shadow: 2px 2px 5px black;'>${args.date}</span>
                        <span style='text-shadow: 2px 2px 5px black; color:${args.color};'>${args.name}</span>
                        <span>CODEBLOCK:</span>
                    </div>
                    <pre style='white-space: pre-wrap;'>
                        <code class='code' style='border-radius: 10px;'>${args.msg}</code>
                    </pre>`;
        this.msgs[tab].append(div);
        $('.code').each(function(i, block) {
          hljs.highlightBlock(block);
        });
    },
    renderVideo: function(tab, args){
        let url = `https://www.youtube.com/watch?v=${args.msg}`;
        let embed = `https://www.youtube.com/embed/${args.msg}`;
        let link = `<a href='${url}'>${url}</a>`;
        let id = Math.random().toString(36).substring(2, 15)+(new Date()).getTime().toString(36);
        let converted = `<div id='${id}'></div>`;
        let div =   `<div class='msg'>
                        <span style='text-shadow: 2px 2px 5px black;'>${args.date}</span>
                        <span style='text-shadow: 2px 2px 5px black; color:${args.color};'>${args.name}</span>
                        <span>${link}</span>
                        <br>
                        ${converted}
                    </div>`;
        this.msgs[tab].append(div);
        let player;
        let players = this.ytplayers;
        let autoplay = this.autoplay;
		function onYouTubeIframeAPIReady(divid, videoid) {
			player = new YT.Player(divid, {
				playerVars: { 
					'autoplay': autoplay
				},
				videoId: videoid,
				height: `250px`,
				width: `350px`,
				events: {
					'onStateChange': function(e){
						if (e.data == YT.PlayerState.PLAYING) {
        					$.each(players, function() {
            					if (this.getPlayerState() == YT.PlayerState.PLAYING && this.getIframe().id != e.target.getIframe().id) { 
                					this.pauseVideo();
            					}
        					});
    					}
					}
				}
			});
		}
		onYouTubeIframeAPIReady(id, args.msg);
		this.ytplayers.push(player);
        this.videotoggle ? $('iframe').show() : $('iframe').hide();
    },
    renderBlob: function(tab, args){
        let URLObj = window.URL || window.webkitURL;
        let blob = new Blob([args.blob], {type: "image/png"});
        let img = `<img class='blob imgs' style='max-width: ${this.msgs[tab].width()}px; min-width: 350px; max-height: 250px; min-height:250px;' src='${URLObj.createObjectURL(blob)}'/>`;
        let div =   `<div class='msg' style='background-color:${args.bgcolor};'>
                        <span style='text-shadow: 2px 2px 5px black;'>${args.date}</span>
                        <span style='text-shadow: 2px 2px 5px black; color:${args.color};'>${args.name}</span>
                        <span style='color: ${args.color};'>${args.msg}</span>
                        <br>
                        <span class='redshadow'>IMAGEDRAW:</span>
                        <br>
                        ${img}
                    </div>`;
        this.msgs[tab].append(div);
        $(div).resizable();
        this.imagepreview.hide();
        this.blob = {};
        $('.blob').on('click', (e)=>{
        	this.drawings(e, blob);
        });
        this.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
    }
};