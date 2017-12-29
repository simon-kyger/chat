export default function(socket){
    //properties
    this.socket = socket;
    this.ytplayers = [];
    this.chat = $(`<div id='chat' class='chat'>`);
    this.tools = $(`<div class='tools' style='background-color: rgba(0, 0, 0, 0);'>`);
    this.maximizer = $(`<div class='icondisplay iconmaximize'>🗖</div>`);
    this.maximizer.appendTo(this.tools);
    this.tools.appendTo(this.chat);
    this.chat.draggable({
        containment: 'body',
    });
    this.chat.resizable({
        handles: 'all'
    });
    this.cgroup = $(`<div id='cgroup' class='cgroup'>`);
    this.cgroup.appendTo(this.chat);
    this.maincgroup = $(`<div id='maincgroup' class='tab' style='width: 10%';>Main</div>`);
    this.maincgroup.appendTo(this.cgroup);
    this.curtab = 'Main';
    this.msgs = {};
    this.msgs[this.curtab] = $(`<div id='${this.curtab}' class='msgs'>`);
    this.msgs[this.curtab].appendTo(this.chat);
    this.onlineusers = $(`<div id='onlineusers' class='onlineusers'></div>`);
    this.onlineusers.appendTo(this.chat);
    this.welcome = $(`<div class='redshadow'>Welcome to the proper lunch chat channel!</br></div>`);
    this.welcome.appendTo(this.msgs[this.curtab]);
    this.githublink = $(`<div>&nbsp; &nbsp; github --> <a href='https://github.com/simon-kyger/chat' target='_blank'>https://github.com/simon-kyger/chat</a></br></div>`)
    this.githublink.appendTo(this.msgs[this.curtab]);
    this.commandlist = $(`<div>&nbsp; &nbsp; <i>Commandlist: /? or /help</i></br></div>`);
    this.commandlist.appendTo(this.msgs[this.curtab]);
    this.imagepreview = $(`<div id='imagepreview' class='imagepreview'>`)
    this.imagepreview.appendTo(this.chat);
    this.imagepreviewcvs = $(`<canvas id='cvs'>`);
    this.imagepreviewcvs.appendTo(this.imagepreview);
    this.imagepreviewX = $(`<div class='tabX' style='float:right;'>X</div>`);
    this.imagepreviewX.appendTo(this.imagepreview);
    this.imagepreview.hide();
    this.inputcontainer = $(`<div id='inputcontainer' class='inputcontainer'>`);
    this.inputcontainer.appendTo(this.chat);
    this.config = $(`<div id='config' class='config'>`);
    this.config.appendTo(this.chat);
    this.videotoggle = $(`<input id='videotoggle' class='videotoggle' type='checkbox'>Hide Videos<br>`);
    this.videotoggle.appendTo(this.config);
    this.imagetoggle = $(`<input id='imagetoggle' class='imagetoggle' type='checkbox'>Hide Images<br>`);
    this.imagetoggle.appendTo(this.config);
    this.autoplayvideos = $(`<input id='autoplayvideos' class='autoplayvideos' type='checkbox'>Autoplay Videos<br>`);
    this.autoplayvideos.appendTo(this.config);
    this.stopallvideos = $(`<button id='stopallvideos' class='stopallvideos' type='button'>Stop All Videos Now!</button><br>`);
    this.stopallvideos.appendTo(this.config);
    this.istyping = $(`<div class='istyping'></div>`);
    this.istyping.appendTo(this.inputcontainer);
    this.textarea = $(`<textarea id='chatinput' class='chatinput blackphtext' placeholder='Chat here! or /? for a list of commands.' autofocus='autofocus'></textarea>`);
    this.textarea.appendTo(this.inputcontainer);
    this.cfg = $(`<div id='cfg' class='cfg'>&#x2699;</div>`);
    this.cfg.appendTo(this.inputcontainer);
    this.posts = [];
    this.position = 0;
    //storage for current blob
    this.blob = {};
    this.cfg.expanded = false;
    //youtube autoplay config
    this.autoplay = false;

    //methods
    this.maincgroup.on('click', (e)=> this.tabclick(e));
    this.textarea.on('change keydown input paste', (e)=> this.submitmsg(e));
    this.cfg.on('click', ()=> this.cfgexpand());
    this.videotoggle.on('change', ()=> this.videotoggler());
    this.imagetoggle.on('change', ()=> this.imagetoggler());
    this.autoplayvideos.on('change', ()=> this.autoplay = !this.autoplay);
    this.stopallvideos.on('click', ()=> {
        $.each(this.ytplayers, function() {
            if (this.getPlayerState() == YT.PlayerState.PLAYING) {
                this.pauseVideo();
            }
        });
    });
    this.chatmaximized = false;
    this.maximizer.on('click', ()=>{
        if (!this.chatmaximized){
            this.chatolddimensions = {
                top: this.chat.css('top'),
                left: this.chat.css('left'),
                width: this.chat.css('width'),
                height: this.chat.css('height'),
            }
            //animate both the container and the canvas container but not the canvas
            this.chat.animate({
                top: 0,
                left: 0,
                height: `${window.innerHeight}px`,
                width: `${window.innerWidth}px`,
            });
            this.chatmaximized = true;
        } else {
            this.chat.animate({
                top: this.chatolddimensions.top,
                left: this.chatolddimensions.left,
                height: this.chatolddimensions.height,
                width: this.chatolddimensions.width,
            });
            this.chatmaximized = false;
        }
    })

    //apply self to body and apply any after effects or transitions
    this.chat.appendTo($('body'));
    this.randomizedstartinganimation(0, 0);
    this.redheader();
}
