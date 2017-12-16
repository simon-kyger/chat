let builder = function(){
    this.chat = $(`<div id='chat' class='chat'>`);
    this.inputcontainer = $(`<div id='inputcontainer' class='inputcontainer'>`);
    this.inputcontainer.appendTo(this.chat);
    this.cgroup = $(`<div id='cgroup' class='cgroup'>`);
    this.cgroup.appendTo(this.chat);
    this.config = $(`<div id='config' class='config'>`);
    this.config.appendTo(this.chat);
    this.chatresizer = $(`<div id='chatresizer' class='resizer ui-resizable-handl ui-resizable-ne'>`);
    this.chatresizer.appendTo(this.chat);
    this.videotoggle = $(`<input id='videotoggle' class='videotoggle' type='checkbox'>Hide Videos<br>`);
    this.videotoggle.appendTo(this.config);
    this.imagetoggle = $(`<input id='imagetoggle' class='imagetoggle' type='checkbox'>Hide Images</input>`);
    this.imagetoggle.appendTo(this.config);
    this.cfg = $(`<div id='cfg' class='cfg'>&#x2699;</div>`);
    this.cfg.appendTo(this.inputcontainer);
    this.textarea = $(`<textarea id='chatinput' class='chatinput blackphtext' placeholder='Chat here! or /? for a list of commands.' autofocus='autofocus'></textarea>`);
    this.textarea.appendTo(this.inputcontainer);
    this.istyping = $(`<div class='istyping'></div>`);
    this.istyping.appendTo(this.inputcontainer);
    this.onlineusers = $(`<div id='onlineusers' class='onlineusers'></div>`);
    this.onlineusers.appendTo(this.chat);
    this.maincgroup = $(`<div id='maincgroup' class='tab' style='width: 10%';>Main</div>`);
    this.maincgroup.appendTo(this.cgroup);
    this.curtab = 'Main';
    this.msgs = {};
    this.msgs[this.curtab] = $(`<div id='${this.curtab}' class='msgs'>`);
    this.msgs[this.curtab].appendTo(this.chat);
    this.welcome = $(`<div class='redshadow'>Welcome to the proper lunch chat channel!</br></div>`);
    this.welcome.appendTo(this.msgs[this.curtab]);
    this.githublink = $(`<div>&nbsp; &nbsp; github --> <a href='https://github.com/simon-kyger/chat' target='_blank'>https://github.com/simon-kyger/chat</a></br></div>`)
    this.githublink.appendTo(this.msgs[this.curtab]);
    this.commandlist = $(`<div>&nbsp; &nbsp; <i>Commandlist: /? or /help</i></br></div>`);
    this.commandlist.appendTo(this.msgs[this.curtab]);
    this.maincgroup.on('click', (e)=> this.tabmainclick(e));
    this.cfg.on('click', ()=> this.cfgexpand());
    this.posts = [];
    this.position = 0;
    this.textarea.on('change keydown input paste', (e)=> this.submitmsg(e));
    this.videotoggle.on('change', ()=> {
        this.videotoggle ? $('.iframe').hide() : $('.iframe').show();
        this.videotoggle = !this.videotoggle;
        this.scrollBottom();
    });
    this.imagetoggle.on('change', ()=> {
        this.imagetoggle ? $('.imgs').hide() : $('.imgs').show();
        this.imagetoggle = !this.imagetoggle;
        this.scrollBottom();
    });
    this.cfg.expanded = false;
    this.chat.draggable({
        containment: 'body'
    });
    this.chat.resizable({
        handles: {
            'ne': this.chatresizer
        }
        // resize: function(event, ui) {
        //     // handle fontsize here
        //     console.log(ui.size); // gives you the current size of the div
        //     var size = ui.size;
        //		//this is ridiculous lol
        //     $(this).css("font-size", (size.width * size.height)/20000 + "px"); 
        // }
    });
    this.chat.appendTo($('body'));
}
builder.prototype.tabmainclick = function(e){
    this.curtab = 'Main';
    for (let msgsgrp in this.msgs){
        this.msgs[msgsgrp].hide();
    }
    this.msgs[this.curtab].show();
    for (let i = 0; i < this.cgroup.children().length; i++){
        this.cgroup.children().css('backgroundColor', this.textarea.css('backgroundColor'));
        this.cgroup.children().css('color', this.textarea.css('color'));
    }
    e.target.style.color = this.msgs.Main[0].style.color;
    e.target.style.backgroundColor = this.msgs.Main[0].style.backgroundColor;
    this.textarea.focus();       
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
    //up
    if (e.which == 38 && $(e.target).get(0).value.length == 0){
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
    if (e.which == 13 && !e.shiftKey)
        e.preventDefault();
    //enter

    if (e.which == 13 && !e.shiftKey && e.target.value.trim().length>0) {
        e.preventDefault();
        let msg = e.target.value.trim();
        socket.emit('chatMsg', {msg: msg, curtab: this.curtab});
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
    this.tab.css('backgroundColor', this.maincgroup.css('backgroundColor'));
    this.tab.css('color', this.maincgroup.css('color'));
    this.tabX = $(`<div id='tabX${args.curtab}' class='closerX'>X</div>`);
    this.tabX.appendTo(this.tab);
    this.tab.on('click', (e)=> {
    	if (e.target !== e.currentTarget)
    		return;
        for (let i = 0; i < this.cgroup.children().length-1; i++){
        	this.cgroup.children().css('backgroundColor', this.textarea.css('backgroundColor'));
        	this.cgroup.children().css('color', this.textarea.css('color'));
        }
        e.target.style.backgroundColor = this.msgs.Main[0].style.backgroundColor;
        e.target.style.color = this.msgs.Main[0].style.color;
        this.maincgroup.css('backgroundColor', this.textarea.css('backgroundColor'));
        this.maincgroup.css('color', this.textarea.css('color'));
        this.curtab = e.target.innerText.slice(0, -1);
        for (let msgsgrp in this.msgs){
            this.msgs[msgsgrp].hide();
        }
        this.msgs[this.curtab].show();
        this.textarea.focus();
        this.scrollBottom();
    });
    this.tabX.on('click', (e) =>{
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
    });
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
            this.chat.stop().animate({
                top: '10%',
                left: '10%',
                height: '75%',
                width: '75%',
            }, 1000, null, ()=> {
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
                    this.inputcontainer.stop().animate({
                        backgroundColor: args.shadow
                    });
                    this.istyping.stop().animate({
                        color: args.text,
                        backgroundColor: args.bgformatted
                    });
                    this.scrollBottom();
                });
                this.textarea.stop().animate({
                    backgroundColor: 'white'
                },150, null, ()=>{
                    this.textarea.stop().animate({
                        backgroundColor: args.cinput,
                        color: args.text
                    });
                    this.cgroup.stop().animate({
                        backgroundColor: args.shadow,
                    });
                    for (let i =0; i<this.cgroup.children().length; i++){
                    	let temp = this.cgroup.children()[i];
                    	let temp2;
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
    }
};