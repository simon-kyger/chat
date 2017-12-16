$(document).ready(function(){
//globals
    let socket = io();
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
        $('.user').dblclick(function (e) {
            chat.curtab = $(this)[0].textContent;
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
    //this is buggy because we don't necessarily want to close the window when
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
            $(chat.cgroup).children().stop().animate({
                color: 'white',
                backgroundColor: 'black'
            });
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
            document.styleSheets[0].cssRules[0].style.background = 'white';
            document.styleSheets[0].cssRules[1].style.background = 'black';
        } else {
            let args = chat.getTheme(data);
            chat.randomizedstartinganimation(data);
        }
    });
});