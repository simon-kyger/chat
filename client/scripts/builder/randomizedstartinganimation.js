export default function(args, start) {
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
                $('body').stop().animate({
                    backgroundColor: `1 1 1000px 100px 'silver'`
                },400, null, ()=>{
                    //scrollbar crap
                    document.styleSheets[0].cssRules[0].style.background = args.bgformatted;
                    document.styleSheets[0].cssRules[1].style.background = args.cinput;
                    $('body').stop().animate({
                        backgroundColor: args.shadow
                    },2000);
                    //for some reason using stop on msgs here gets squirley with above stylesheet changes
                    //leave this in without .stop()
                    for (let i in this.msgs){
                        this.msgs[i].stop().animate({
                            color: args.text,
                            backgroundColor: args.bgformatted
                            //doesn't work shamefully
                            //textShadow: args.shadow
                        },2000);
                    }
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
                    this.tools.stop().animate({
                        opacity: 1,
                        backgroundColor: args.shadow,
                        color: args.text
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
    if (this.drawing){
        let t = this.drawing.position().top;
        let l = this.drawing.position().left;
        let w = this.drawing.width();
        let h = this.drawing.height();
        this.drawing.stop().animate({
            top: `${Math.floor(Math.random()*99)}%`,
            left: `${Math.floor(Math.random()*99)}%`,
            width: '15px',
            height: '15px',
            opacity: '1.0',
        }, start, null, ()=> {
            this.drawing.stop().animate({
                top: `${Math.floor(Math.random()*99)}%`,
                left: `${Math.floor(Math.random()*99)}%`,
                backgroundColor: args.bgformatted,
            }, 1000, null, ()=> {
                this.drawing.stop().animate({
                    top: t,
                    left: l,
                    height: h,
                    width: w,
                }, 1000);
                this.drawingtoolscontainer.animate({
                    opacity: 1,
                    backgroundColor: args.shadow,
                    color: args.text
                }, 3000);
            });
        });
    }
}