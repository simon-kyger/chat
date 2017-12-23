import _ from 'lodash';
import spencer from './fun';


//$(document).ready(function(){

//globals
    spencer();
    let socket = io();
    let builder = function(){
        //properties
        this.chat = $(`<div id='chat' class='chat'>`);
        this.chatresizer = $(`<div id='chatresizer' class='resizer ui-resizable-handl ui-resizable-ne'>`);
        this.chatresizer.appendTo(this.chat);
        this.chat.draggable({
            containment: 'body'
        });
        this.chat.resizable({
            handles: {
                'ne': this.chatresizer
            }
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
        this.imagetoggle = $(`<input id='imagetoggle' class='imagetoggle' type='checkbox'>Hide Images</input>`);
        this.imagetoggle.appendTo(this.config);
        this.cfg = $(`<div id='cfg' class='cfg'>&#x2699;</div>`);
        this.cfg.appendTo(this.inputcontainer);
        this.istyping = $(`<div class='istyping'></div>`);
        this.istyping.appendTo(this.inputcontainer);
        this.textarea = $(`<textarea id='chatinput' class='chatinput blackphtext' placeholder='Chat here! or /? for a list of commands.' autofocus='autofocus'></textarea>`);
        this.textarea.appendTo(this.inputcontainer);
        this.posts = [];
        this.position = 0;
        this.blob = {};
        this.cfg.expanded = false;

        //methods
        this.maincgroup.on('click', (e)=> this.tabclick(e));
        this.textarea.on('change keydown input paste', (e)=> this.submitmsg(e));
        this.cfg.on('click', ()=> this.cfgexpand());
        this.videotoggle.on('change', ()=> this.videotoggler());
        this.imagetoggle.on('change', ()=> this.imagetoggler());

        //create this instance to the body
        this.chat.appendTo($('body'));
    }
    builder.prototype.imagetoggler = function(){
        this.imagetoggle ? $('.imgs').hide() : $('.imgs').show();
        this.imagetoggle = !this.imagetoggle;
        this.scrollBottom();
    }
    builder.prototype.videotoggler = function(){
        this.videotoggle ? $('.iframe').hide() : $('.iframe').show();
        this.videotoggle = !this.videotoggle;
        this.scrollBottom();
    }
    builder.prototype.cfgexpand = function(){
        if (this.cfg.expanded){
            this.config.animate({
                width: '0%',
                height: '0%',
                opacity: 0,
                fontSize: '0',
                borderWidth: '20px'
            }, 500 );
            this.cfg.expanded = false;
        } else {
            this.config.animate({
                width: '20%',
                height: '30%',
                opacity: 0.8,
                fontSize: '14',
                borderWidth: '2px'
            }, 500 );
            this.cfg.expanded = true;
        }
    }
    builder.prototype.submitmsg = function(e){
    	//paste
		if (e.type =='paste'){
			let items = e.originalEvent.clipboardData.items;
			if(!items)
				return;
            let blob;
			for (var i = 0; i < items.length; i++) {
				if (items[i].type.indexOf("image") == -1) continue;
				blob = items[i].getAsFile();
			}
			if (!blob)
				return;
			this.imagepreview.show();
			let ctx = this.imagepreviewcvs[0].getContext('2d');
            ctx.clearRect(0, 0, this.imagepreviewcvs[0].width, this.imagepreviewcvs[0].height);
			let img = new Image();
			img.onload = (e) => {
				this.imagepreview[0].width = Math.sqrt(img.width)*5;
				this.imagepreview[0].height = Math.sqrt(img.height)*5;
				ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, Math.sqrt(img.width)*5, Math.sqrt(img.height)*5);
			};
			let URLObj = window.URL || window.webkitURL;
			img.src = URLObj.createObjectURL(blob);
            this.blob = blob;
            this.imagepreviewX.on('click', (e) => {
                $(e.target).parent().hide();
                this.blob = {};
            });
		}
        //up
        if (e.which == 38 && e.target.selectionStart == 0){
            this.position--;
            if (this.position < 0)
                this.position = 0;
            e.target.value = this.posts[this.position] || '';
        }
        //down
        if (e.which == 40 && e.target.selectionEnd == e.target.value.length){
            this.position++;
            if (this.position >= this.posts.length)
                this.position = this.posts.length;
            e.target.value = this.posts[this.position] || '';
        }

        //delete
        if (e.which == 8 && e.target.selectionStart == 0){
            this.imagepreview.hide();
            this.blob = {};
        }

        //enter
        if (e.which == 13 && !e.shiftKey)
            e.preventDefault();
        if (e.which == 13 && !e.shiftKey && (e.target.value.trim().length>0 || !$.isEmptyObject(this.blob))) {
            e.preventDefault();
            let msg = e.target.value.trim();
            socket.emit('chatMsg', {
                msg: msg,
                blob: this.blob,
                curtab: this.curtab
            });
            this.posts.push(msg);
            this.position = this.posts.length;
            e.target.value = ''; // CLEAR TEXTAREA
            this.scrollBottom();
            socket.chatting = false;
        }
        //any other key
        if (e.target.value.length){
            socket.emit('istyping', 1);
        } else{
            socket.emit('istyping', 0);
        }
    }
    builder.prototype.newtab = function(args){
        this.tab = $(`<div id='tab${args.curtab}' class='tab'>${args.curtab}</div>`);
        this.tab.appendTo(this.cgroup);
        if (args.sposition){
            this.tab.height = this.tab.css('height');
            this.tab.css('position', 'absolute');
            this.tab.left = this.tab.css('left');
            this.tab.top = this.tab.css('top');
            this.tab.width = this.tab.css('width');
            let dist = `${Object.keys(this.msgs).length*10}%`;
            this.tab.animate({
                top: $(args.sposition).parent().position().top,
                left: $(args.sposition).parent().position().left,
                width: '800px',
                height: '800px',
            },0).animate({
                top: 0,
                left: dist,
                width: `10%`,
                height: `10%`,
            }, function(){
                $(this).css('position', 'static');
                $(this).css('left', 0);
                $(this).css('height', '100%');
            });
        }
        this.tab.css('backgroundColor', this.textarea.css('backgroundColor'));
        this.tab.css('color', this.textarea.css('color'));
        this.tabX = $(`<div id='tabX${args.curtab}' class='tabX'>X</div>`);
        this.tabX.appendTo(this.tab);
        this.tab.on('click', (e)=> this.tabclick(e));
        this.tabX.on('click', (e) => this.tabXclick(e));
    }
    builder.prototype.tabclick = function(e){
        if (e.target !== e.currentTarget)
            return;
        this.cgroup.children().css('backgroundColor', this.textarea.css('backgroundColor'));
        this.cgroup.children().css('color', this.textarea.css('color'));
        e.target.style.backgroundColor = this.msgs.Main[0].style.backgroundColor;
        e.target.style.color = this.msgs.Main[0].style.color;
        e.target.innerText.slice(-1) !== 'X' ? this.curtab = 'Main' : this.curtab = e.target.innerText.slice(0, -1);
        for (let msgsgrp in this.msgs){
            this.msgs[msgsgrp].hide();
        }
        this.msgs[this.curtab].show();
        this.textarea.focus();
        let shouldscroll = this.msgs[this.curtab].scrollTop() >= (this.msgs[this.curtab][0].scrollHeight - this.msgs[this.curtab][0].offsetHeight);
        if (shouldscroll)
            this.scrollBottom();
    }
    builder.prototype.tabXclick = function(e){
        let el = this.cgroup.children().toArray()
        if (e.target.parentElement.innerText.slice(0, -1) == this.curtab){
            if ($(e.target.parentElement).is(':last-child')){
                el[el.length-2].click();
            } else {
                let index = el.indexOf(e.target.parentElement);
                el[index + 1].click();
            }
        }
        e.target.parentElement.remove();
        for (let msgsgrp in this.msgs){
            if(msgsgrp == e.target.id.substr(4)){
                chat.msgs[msgsgrp].remove();
                delete this.msgs[msgsgrp];
            }
        }
    }
    builder.prototype.scrollBottom = function() {
        this.msgs[this.curtab].stop().animate({
            scrollTop: this.msgs[this.curtab][0].scrollHeight
        }, 1000); // SET SCROLLER TO BOTTOM DOESNT WORK WITH DOUBLE YOUTUBE SEND :(
    }
    builder.prototype.getTheme = function(args) {
        let bgformatted;
        let shadow;
        let text;
        let cinput;
        if (args > 0)
            text = 'black';
        else
            text = 'white';

        let randomrgb = [((Math.floor(Math.random()*150)+55)+args), ((Math.floor(Math.random()*150)+55)+args), ((Math.floor(Math.random()*150)+55)+args)];
        let darker = [];
        let darkest = [];
        for(let i=0; i<randomrgb.length; i++){
            randomrgb[i] < 0 ? randomrgb[i] = 0 : randomrgb[i];
            randomrgb[i] > 255 ? randomrgb[i] = 255 : randomrgb[i];
            randomrgb[i]-30 < 0 ? darker.push(0) : darker.push(randomrgb[i]-30);
            randomrgb[i]-50 < 0 ? darkest.push(0) : darkest.push(randomrgb[i]-50);
        }
        bgformatted = `rgb(${randomrgb[0]},${randomrgb[1]},${randomrgb[2]})`;
        shadow = `0 0 10px 10000px rgb(${darker[0]},${darker[1]},${darker[2]})`;
        cinput = `rgb(${darkest[0]},${darkest[1]},${darkest[2]})`;
        let ret = {
            bgformatted: bgformatted,
            shadow: shadow,
            cinput: cinput,
            text: text
        }
        return ret;
    }
    builder.prototype.randomizedstartinganimation = function(args, start) {
        //dragons be here
        args = this.getTheme(args);
        let st = this.msgs[this.curtab].scrollTop();
        this.chat.stop().animate({
            top: `${Math.floor(Math.random()*99)}%`,
            left: `${Math.floor(Math.random()*99)}%`,
            width: '15px',
            height: '15px',
            opacity: '1.0',
        }, start, null, ()=> {
            this.chat.stop().animate({
                top: `${Math.floor(Math.random()*99)}%`,
                left: `${Math.floor(Math.random()*99)}%`,
                backgroundColor: args.bgformatted,
            }, 1000, null, ()=> {
                this.textarea.stop().animate({
                    backgroundColor: '#e5e5e5'
                }, 1500);
                this.imagepreview.stop().animate({
                    backgroundColor: args.cinput
                });
                this.msgs[this.curtab].stop().animate({
                	scrollTop: st
                }, 1000); //this 1000 timelimit needs to match the following lines 1000 time limit, else the window may scroll irregularly
                this.chat.stop().animate({
                    top: '10%',
                    left: '10%',
                    height: '75%',
                    width: '75%',
                }, 1000, null, ()=> { // see above comment about modifying this 1000 time limit.
                    this.msgs[this.curtab].stop().animate({
                        boxShadow: `1 1 1000px 100px 'silver'`
                    },400, null, ()=>{
                        //scrollbar crap
                        document.styleSheets[0].cssRules[0].style.background = args.bgformatted;
                        document.styleSheets[0].cssRules[1].style.background = args.cinput;
                        this.chat.stop().animate({
                            boxShadow: args.shadow
                        },2000);
                        //for some reason using stop on msgs here gets squirley with above stylesheet changes
                        //leave this in without .stop()
                        $('.msgs').animate({
                            color: args.text,
                            backgroundColor: args.bgformatted
                            //doesn't work shamefully
                            //textShadow: args.shadow
                        },2000);
                        this.cgroup.stop().animate({
                            backgroundColor: args.shadow,
                        });
                        //this is shit but its a quick fix for v1.0
                        for (let i =0; i<this.cgroup.children().length; i++){
                            let temp = this.cgroup.children()[i];
                            let temp2 = 'Main';
                            let lastchar = temp.innerText[temp.innerText.length-1];
                            if (lastchar == 'X')
                                temp2 = temp.innerText.slice(0, -1);
                            if (temp2 !== this.curtab)
                                temp.style.backgroundColor = args.cinput;
                            else
                                temp.style.backgroundColor = args.bgformatted;
                            if (args.text == 'white')
                                temp.style.color = 'white';
                            else
                                temp.style.color = 'black';
                        }
                        this.inputcontainer.stop().animate({
                            backgroundColor: args.shadow
                        });
                        this.istyping.stop().animate({
                            color: args.text,
                            backgroundColor: args.bgformatted
                        });
                    });
                    this.textarea.stop().animate({
                        backgroundColor: 'white'
                    },150, null, ()=>{
                        this.textarea.stop().animate({
                            backgroundColor: args.cinput,
                            color: args.text
                        });
                        if(args.text == 'white'){
                            this.textarea.removeClass('blackphtext');

                        } else {
                            this.textarea.removeClass('whitephtext');
                        }
                        this.textarea.addClass(`${args.text}phtext`);
                    });
                    this.config.stop().animate({
                        backgroundColor: args.bgformatted,
                        color: args.text
                    });
                    this.onlineusers.stop().animate({
                        opacity: 1,
                        backgroundColor: args.shadow,
                        color: args.text
                    }, 1500);
                });
            });
        });
    }
    builder.prototype.render = {
        renderText: function(tab, args){
            let div = `<div class='msg' style='background-color:${args.bgcolor}; text-shadow: ${args.textshadow};'>${args.date} <span style='color:${args.color};'>${args.name} ${args.msg}</span></div>`;
            this.msgs[tab].append(div);
        },
        renderImage: function(tab, args){
            let img = `<a href='${args.msg}' target='_blank'><img class='imgs' src='${args.msg}' target='_blank' style='width: auto; max-height: 300px; max-width: 300px;border-radius: 10px;'></img></a>`;
            let link = `<a href='${args.msg}' target='_blank'>${args.msg}</a>`;
            let div = $(`<div class='msg'>${args.date} <span style='color:${args.color}'>${args.name} ${link} </span><br>${img}</div>`);
            this.msgs[tab].append(div);
            this.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
            //lolfun $('.imgs').draggable({containment: $('.msgs')});
        },
        renderStaticImage: function(tab, args){
            let img = `<img class='imgs' src='data:image/png;base64,${args.image}' style='width: auto; max-height: 300px; max-width: 300px;border-radius: 10px;'></img>`;
            let div = `<div class='msg'>${args.date} <span style='color:${args.color}'>${args.name} ${img} </span></div>`
            this.msgs[tab].append(div);
            this.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
        },
        renderCodeBlock: function(tab, args){
            let div = `<div class='msg''>${args.date} <span style='color:${args.color}'>${args.name} CODEBLOCK: </span>
                      </div><pre style='white-space: pre-wrap;'><code class='code' style='border-radius: 10px;'>${args.msg}</code></pre>`;
            this.msgs[tab].append(div);
            $('.code').each(function(i, block) {
              hljs.highlightBlock(block);
            });
        },
        renderVideo: function(tab, args){
            let url = `https://www.youtube.com/watch?v=${args.msg}`;
            let embed = `https://www.youtube.com/embed/${args.msg}`;
            let link = `<a href='${url}'>${url}</a>`;
            let iframe = `<iframe class='iframe' style='height: 300px; width: 400px' src='${embed}' allowfullscreen></iframe>`;
            let div = `<div class='msg'>${args.date} <span style='${args.color}'>${args.name} ${link} </span><br>${iframe}</div>`;
            this.msgs[tab].append(div);
            this.videotoggle ? $('.iframe').show() : $('.iframe').hide();
        },
        renderVideoLink: function(tab, args){
            let url = args.msg;
            let link = `<a href='${url}'>${url}</a>`;
            let id = url.substr(32);
            let iframe = `<iframe class='iframe' style='height: 300px; width: 400px' src='//www.youtube.com/embed/${id}' allowfullscreen></iframe>`;
            let div = `<div class='msg'>${args.date} <span style='${args.color}'>${args.name} ${link}</span><br>${iframe}</div>`;
            this.msgs[tab].append(div);
            this.videotoggle ? $('.iframe').show() : $('.iframe').hide();
        },
        renderBlob: function(tab, args){
            let URLObj = window.URL || window.webkitURL;
            let blob = new Blob([args.blob], {type: "image/png"});
            let img = `<img class='blob' style='max-width: ${this.msgs[tab].width()}px;' src='${URLObj.createObjectURL(blob)}'/>`;
            let div = `<div class='msg'>${args.date} <span style='${args.color}'>${args.name} ${args.msg}</span><br>${img}</div>`;
            this.msgs[tab].append(div);
            $('.blob').on('click', function(){
                //do some other crazy shenanigans later :P
            });
            $(div).resizable();
            this.imagepreview.hide();
            this.blob = {};
        //to create a new canvas and render the image to that instead (for later purposes)
            // var canvas = $('<canvas/>');
            // canvas.addClass('msg');
            // let ctx = canvas[0].getContext('2d');
            // let img = new Image();
            // img.onload = (e) => {
            //     canvas.width = Math.sqrt(img.width)*5;
            //     canvas.height = Math.sqrt(img.height)*5;
            //     ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, Math.sqrt(img.width)*5, Math.sqrt(img.height)*5);
            // };
            // let URLObj = window.URL || window.webkitURL;
            // let blob = new Blob([args.blob], {type: "image/png"});
            // img.src = URLObj.createObjectURL(blob);
            // let div = $(`<div class='msg'>${args.date} <span style='${args.color}'>${args.name} COLAB:</span><br></div>`);
            // canvas.appendTo(div);
            // this.msgs[tab].append(div);
            // this.imagepreview.hide();
            // this.blob = {};
        }
    };
    let chat = new builder();

//a glorified animation
    chat.randomizedstartinganimation(0, 0);
    //glowing red text for banner and online users
    setInterval(()=> {
        $('.redshadow').animate({
            opacity: 1.0
        }, 500).animate({
            opacity: .2
        });
    }, 1000);

//net
    //data expects data.chatmessages[].properties
    socket.on('addToChat', (data) => {
        if(data.curtab == undefined)
            data.curtab = 'Main';
        //boolers is a check to see if tab exists
        let boolers = false;
        for (let msgsgrp in chat.msgs){
            if (msgsgrp == data.curtab)
                boolers = true;
        }
        //if the tab doesn't exist create one and append a new message window
        if(!boolers){
        	//create the tab
            chat.newtab({curtab: data.curtab});
            //format the tab
            //no real sense to do this at this time because
            //create the window
            chat.msgs[data.curtab] = $(`<div id='${data.curtab}' class='msgs'>`);
            chat.msgs[data.curtab].appendTo(chat.chat);
            //format the window
            chat.msgs[data.curtab].css("color", chat.msgs['Main'][0].style.color);
            chat.msgs[data.curtab].css("backgroundColor", chat.msgs['Main'].css('backgroundColor'));
            //hide the window because we don't care about pms unless we click on it later.
            chat.msgs[data.curtab].hide();
        }
        let shouldscroll = chat.msgs[chat.curtab].scrollTop() >= (chat.msgs[chat.curtab][0].scrollHeight - chat.msgs[chat.curtab][0].offsetHeight);
        for (let i=0; i<data.chatmessages.length; i++){
            //evil dragons be here
            chat.render[data.chatmessages[i].action].call(chat, data.curtab, data.chatmessages[i]);
        }
        if (shouldscroll)
            chat.scrollBottom();
    });

    //data expects array
    socket.on('updateUsers', (data) => {
        chat.onlineusers.empty();
        chat.onlineusers.append(`<div class='redshadow'>Online Users: &nbsp</div>`);
        for (let i=0; i<data.length; i++){
            if (isNaN(data[i]))
                data[i] = data[i].replace(/\n/g, '<br>');
            chat.onlineusers.append(`<div class='user' style='color:${data[i].color}; cursor: pointer'>${data[i]}</div>`);
        }
        //this entire method should be a part of builder
        $('.user').dblclick(function (e) {
            chat.curtab = $(this)[0].textContent;
            //this should be handled way better, as in when a user double clicks an already current speaking to tab
            //it should just click on that tab and load those respective messages.
            if(chat.msgs[chat.curtab])
                return;
            //create the tab
            chat.newtab({
                curtab: chat.curtab,
                sposition: e.target
            });
            //format all the tabs
            chat.cgroup.children().css('backgroundColor', chat.textarea.css('backgroundColor'));
            chat.cgroup.children().css('color', chat.textarea.css('color'));
            //since the last one will always be selected because we're creating a new tab, color it as if it were selected
            chat.cgroup.children().last().css('backgroundColor', chat.msgs['Main'].css('backgroundColor'));
            chat.cgroup.children().last().css('color', chat.msgs['Main'].css('color'));
            //create the window
            chat.msgs[chat.curtab] = $(`<div id='${chat.curtab}' class='msgs'>`);
            chat.msgs[chat.curtab].appendTo(chat.chat);
            //format the window
            chat.msgs[chat.curtab].css("color", chat.msgs['Main'][0].style.color);
            chat.msgs[chat.curtab].css("backgroundColor", chat.msgs['Main'].css('backgroundColor'));
            //hide all windows
            for (let msgsgrp in chat.msgs){
                chat.msgs[msgsgrp].hide();
            }
            //show the relevant window
            chat.msgs[chat.curtab].show();
            chat.textarea.focus();
        });
    });

    //data expects string
    socket.on('changeInputFontColor', (data) => {
        chat.textarea.css('color', data);
    });

    //data expects string
    //this is buggy because we don't necessarily want to close the window when someone logs out
    socket.on('removeTab', (data) =>{
        for (let msgsgrp in chat.msgs){
            if (msgsgrp == data){
                chat.msgs[msgsgrp].remove();
                delete chat.msgs[msgsgrp];
                $('.tab').each(function(i) {
                    if (msgsgrp == this.id.substr(3))
                        this.remove();
                });
                chat.maincgroup.click();
            }
        }
    });

    //data expects array
    socket.on('ischattinglist', (data) =>{
        let ret = '';
        if (data.length > 4){
            ret = 'Many people are typing...'
        } else if (data.length < 5 && data.length > 1){
            for(let i=0; i<data.length; i++){
                ret = ret + data[i] + ' and ';
            }
            ret = ret.substring(0, ret.length - 4);
            ret += 'are typing...'
        } else if (data.length == 1){
            ret = data[0] + ' is typing...'
        } else {
            ret = ' ';
        }
        chat.istyping.html(ret);
    });

    //data expects string
    socket.on('changeTheme', (data) => {
        if (data == 'off'){
            chat.chat.stop().animate({
                boxShadow: `0 0 10px 1000px rgb(255,255,255)`,
                backgroundColor: 'white',
            });
            for (let elem in chat.msgs){
                chat.msgs[elem].stop().animate({
                    color: 'black',
                    backgroundColor: 'white'
                });
            }
            $(chat.textarea).stop().animate({
                color: 'white',
                backgroundColor: 'black'
            });
            $(chat.config).stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            $(chat.istyping).stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            $(chat.cgroup).stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            //this is shit, but its a quick fix for v1.0
            for (let i =0; i<chat.cgroup.children().length; i++){
                let temp = chat.cgroup.children()[i];
                let temp2 = 'Main';
                let lastchar = temp.innerText[temp.innerText.length-1];
                if (lastchar == 'X')
                    temp2 = temp.innerText.slice(0, -1);
                if (temp2 !== chat.curtab){
                    temp.style.backgroundColor = 'black';
                    temp.style.color = 'white';
                } else{
                    temp.style.backgroundColor = 'white';
                    temp.style.color = 'black';
                }
            }
            $(chat.onlineusers).stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            $(chat.inputcontainer).stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            $(chat.cfg).stop().animate({
                color: 'white'
            });
            chat.textarea.addClass('whitephtext');
            document.styleSheets[0].cssRules[0].style.background = 'black';
            document.styleSheets[0].cssRules[1].style.background = 'white';
        } else {
            let args = chat.getTheme(data);
            chat.randomizedstartinganimation(data);
        }
    });
//});
