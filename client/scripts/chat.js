$(document).ready(function(){
//globals
    let socket = io();
    var builder = function(){
        var self = this;
        this.chat = $(`<div id='chat' class='chat'>`);
        this.chat.appendTo($('body'));
        this.inputcontainer = $(`<div id='inputcontainer' class='inputcontainer'>`);
        this.inputcontainer.appendTo(this.chat);
        this.cgroup = $(`<div id='cgroup' class='cgroup'>`);
        this.cgroup.appendTo(this.chat);
        this.msgs = $(`<div id='msgs' class='msgs'>`);
        this.msgs.appendTo(this.chat);
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
        this.welcome = $(`<div class='redshadow'>Welcome to the proper lunch chat channel!</br></div>`);
        this.welcome.appendTo(this.msgs);
        this.githublink = $(`<div>&nbsp; &nbsp; github --> <a href='https://github.com/simon-kyger/chat' target='_blank'>https://github.com/simon-kyger/chat</a></br></div>`)
        this.githublink.appendTo(this.msgs);
        this.commandlist = $(`<div>&nbsp; &nbsp; <i>Commandlist: /? or /help</i></br></div>`);
        this.commandlist.appendTo(this.msgs);
        this.onlineusers = $(`<div id='onlineusers' class='onlineusers'></div>`);
        this.onlineusers.appendTo(this.chat);
        this.maincgroup = $(`<div id='maincgroup' class='tab' style='width: 10%;'>Main</div>`);
        this.maincgroup.appendTo(this.cgroup);
        this.prevmsgs = {};
        this.curtab = 'Main';
        this.maincgroup.on('click', function(){
            self.curtab = 'Main';
            self.msgs.empty();
            self.msgs.append(self.prevmsgs['Main']);
        });
        this.newtab = function(args){
            if(args.curtab == 'Main')
                return;
            self.tab = $(`<div id='tab${args.curtab}' class='tab'>${args.curtab}</div>`);
            self.tab.appendTo(self.cgroup);
            self.tab.css('backgroundColor', self.maincgroup.css('backgroundColor'));
            self.tab.css('color', self.maincgroup.css('color'));
            self.tabX = $(`<div id='tabX${args.curtab}' class='closerX'>X</div>`);
            self.tabX.appendTo(self.tab);
            self.tab.on('click', function(e){
                if (e.target !== this) //this is necessary because tabX rests inside, if user clicks that then ignore this event
                    return;
                self.curtab = this.innerText.slice(0, -1);
                self.msgs.empty();
                self.msgs.append(self.prevmsgs[self.curtab]);
            });
            self.tabX.on('click', function(e){
                this.parentElement.remove();
                self.maincgroup.click();
            });
        }

        this.posts = [];
        this.position = 0;
        this.textarea.on('change keydown input paste', function(e){
            //down
            if (e.which == 40){
                self.position--;
                if (self.position < -1)
                    self.position = -1;
                this.value = self.posts[self.position] || '';
            }
            //up
            if (e.which == 38){
                self.position++;
                if (self.position > self.posts.length)
                    self.position = self.posts.length;
                this.value = self.posts[self.position] || '';
            }
            if (e.which == 13 && !e.shiftKey)
                e.preventDefault();
            //enter

            if (e.which == 13 && !e.shiftKey && this.value.trim().length>0) {
                e.preventDefault();
                let msg = this.value.trim();
                socket.emit('chatMsg', {msg: msg, curtab: self.curtab});
                self.posts.push(msg);
                self.position = self.posts.length;
                this.value = ''; // CLEAR TEXTAREA
                self.scrollBottom();
                socket.chatting = false;
            }
            //any other key
            if (this.value.length){
                socket.emit('istyping', 1);
            } else{
                socket.emit('istyping', 0);
            }
        });
        this.videotoggle.on('change', function() {
            self.videotoggle ? $('.iframe').hide() : $('.iframe').show();
            self.videotoggle = !self.videotoggle;
            self.msgs.stop().animate({
                scrollTop: self.msgs.scrollHeight
            }, 0);
        });
        this.imagetoggle.on('change', function(){
            self.imagetoggle ? $('.imgs').hide() : $('.imgs').show();
            self.imagetoggle = !self.imagetoggle;
            self.msgs.stop().animate({
                scrollTop: self.msgs.scrollHeight
            }, 0);
        });
        this.cfg.expanded = false;
        this.cfg.click(function(){
            if (self.cfg.expanded){
                self.config.animate({
                    width: '0%',
                    height: '0%',
                    opacity: 0,
                    fontSize: '0',
                    borderWidth: '20px'
                }, 500 );
                self.cfg.expanded = false;
            } else {
                self.config.animate({
                    width: '20%',
                    height: '30%',
                    opacity: 0.8,
                    fontSize: '14',
                    borderWidth: '2px'
                }, 500 );
                self.cfg.expanded = true;
            }
        });
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
            //     // something like this change the values according to your requirements
            //     $(this).css("font-size", (size.width * size.height)/20000 + "px"); 
            // }
        });
    }
    let chat = new builder();
    builder.prototype.scrollBottom = function() {
        this.msgs.stop().animate({
            scrollTop: this.msgs[0].scrollHeight
        }, 1000); // SET SCROLLER TO BOTTOM
    }


    builder.prototype.getTheme = function(args) {
        let bgformatted;
        let shadow;
        let text;
        let cinput;
        if (args > 0)
            text = 'black'
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
                    this.msgs.stop().animate({
                        boxShadow: `1 1 1000px 100px 'silver'`
                    },400, null, ()=>{
                        //scrollbar crap
                        document.styleSheets[0].cssRules[0].style.background = args.bgformatted;
                        document.styleSheets[0].cssRules[1].style.background = args.cinput;
                        this.chat.stop().animate({
                            boxShadow: args.shadow
                        },2000);
                        this.msgs.stop().animate({
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
                        }, 1500);
                        this.cgroup.stop().animate({
                            backgroundColor: args.shadow,
                        });
                        this.cgroup.children().stop().animate({
                            backgroundColor: args.cinput,
                            color: args.text
                        });
                        if(args.text == 'white')
                            this.textarea.removeClass('blackphtext');
                        else
                            this.textarea.removeClass('whitephtext');
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

    builder.RenderingObject = function(self) {
        this.renderText = (args) => {
            let div = `<div class='msg' style='background-color:${args.bgcolor}; text-shadow: ${args.textshadow};'>${args.date}<b> ${args.name} </b><span style='color:${args.color};'>${args.msg}</span></div>`;
            self.msgs.append(div);
        },
        this.renderImage = (args) => {
            let img = `<a href='${args.msg}' target='_blank'><img class='imgs' src='${args.msg}' target='_blank' style='width: auto; max-height: 300px; max-width: 300px;border-radius: 10px;'></img></a>`;
            let link = `<a href='${args.msg}' target='_blank'>${args.msg}</a>`;
            let div = $(`<div class='msg' style='color:${args.color};'>${args.date}<b> ${args.name} </b>${link}<br>${img}</div>`);
            div.appendTo(self.msgs);
            self.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
            //lolfun $('.imgs').draggable({containment: $('.msgs')});
        }
        this.renderStaticImage = (args) => {
            let img = `<img class='imgs' src='data:image/png;base64,${args.image}' style='width: auto; max-height: 300px; max-width: 300px;border-radius: 10px;'></img>`;
            let div = `<div class='msg' style ='color:${args.color};'>${args.date}<b> ${args.name} </b>${img} </div>`
            self.msgs.append(div);
            self.imagetoggle ? $('.imgs').show() : $('.imgs').hide();
        }
        this.renderCodeBlock = (args) => {
            let div = `<div class='msg' style='color:${args.color};'>${args.date}<b> ${args.name} CODEBLOCK:</b>
                      </div><pre style='white-space: pre-wrap;'><code class='code' style='border-radius: 10px;'>${args.msg.replace(/\n/g, '<br>')} </code></pre>`;
            self.msgs.append(div);
            $('.code').each(function(i, block) {
              hljs.highlightBlock(block);
            });
        }
        this.renderVideo = (args) => {
            let url = `https://www.youtube.com/embed/${args.msg}`;
            let link = `<a href='${url}'>${url}</a>`;
            let iframe = `<iframe class='iframe' style='height: 300px; width: 500px' src='//www.youtube.com/embed/${args.msg}' allowfullscreen></iframe>`;
            let div = `<div class='msg' style='color:${args.color};'>${args.date}<b> ${args.name} </b>${link}<br>${iframe}</div>`;
            self.msgs.append(div);
            self.videotoggle ? $('.iframe').show() : $('.iframe').hide();
        }
    };

//a glorified animation
    $(document).ready(()=> {
        chat.randomizedstartinganimation(0, 0);
        //glowing red text for banner and online users
        setInterval(()=> {
            $('.redshadow').animate({
                opacity: 1.0
            }, 500);
            $('.redshadow').animate({
                opacity: .5
            });
        }, 1000);
    });

//net
    //data expects data.chatmessages[].properties
    socket.on('addToChat', (data) => {
        if (!data.chatmessages[0].curtab)
            data.chatmessages[0].curtab = 'Main';
        //boolers is a check to see if tab exists
        let boolers = false;
        for(let i=0; i<chat.cgroup.tabs().children().length; i++){
            let temp = chat.cgroup.tabs().children()[i].innerText;
            temp = temp.slice(0, -1);
            if (temp == data.chatmessages[0].curtab)
                boolers = true;
        }
        //if the tab doesn't exist, and if theres an id
        let shouldscroll = chat.msgs.scrollTop() >= (chat.msgs[0].scrollHeight - document.getElementsByClassName('msgs')[0].offsetHeight);
        let renderobj = new builder.RenderingObject(chat);
        if(!boolers && data.chatmessages[0].id && data.chatmessages[0].curtab !== 'Main'){
            chat.newtab({curtab: data.chatmessages[0].id});
            for (let i=0; i<data.chatmessages.length; i++){
                chat.prevmsgs[data.chatmessages[i].id] += `<div>${data.chatmessages[i].msg}</div>`; //this is terrible and needs to be refactored
            }
            return;
        }
        for (let i=0; i<data.chatmessages.length; i++){
            //evil dragons be here
            renderobj[data.chatmessages[i].action](data.chatmessages[i]);
        }

        chat.prevmsgs[chat.curtab] = chat.msgs[0].innerHTML;

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
        $('.user').on('click', function() {
            chat.curtab = $(this)[0].textContent;
            chat.msgs.empty();
            chat.msgs.append(chat.prevmsgs[chat.curtab]);
            chat.newtab({
                curtab: $(this)[0].textContent,
                id: $(this)[0].textContent
            });
        });
    });

    //data expects string
    socket.on('changeInputFontColor', (data) => {
        chat.textarea.css('color', data);
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
            chat.msgs.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.textarea.stop().animate({
                color: 'white',
                backgroundColor: 'black'
            });
            chat.inputcontainer.stop().animate({
                color: 'white',
                backgroundColor: 'black'
            });
            chat.config.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.istyping.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.cgroup.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.cgroup.children().stop().animate({
                color: 'white',
                backgroundColor: 'black'
            });
            chat.onlineusers.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.inputcontainer.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.istyping.stop().animate({
                color: 'black',
                backgroundColor: 'white'
            });
            chat.cfg.stop().animate({
                color: 'white'
            });
            chat.textarea.addClass('whitephtext');
            document.styleSheets[0].cssRules[0].style.background = 'white';
            document.styleSheets[0].cssRules[1].style.background = 'black';
        } else {
            let args = chat.getTheme(data);
            chat.randomizedstartinganimation(data);
        }
    });
});