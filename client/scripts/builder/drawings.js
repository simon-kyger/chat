export default function(e, blob){
    if (this.drawing)
        return;
    this.drawing = $(`<div id='drawing' class='chat' style='z-index: 1; user-select: none;'>`);
    this.drawing.appendTo($('body'));
    this.drawingcontainer = $(`<div style="overflow: scroll;"></div>`);
    this.maximized = false;
    this.olddimensions = {
        top: null,
        left: null,
        width: null,
        height: null
    };
    this.buildtools = () =>{
        this.drawingtoolscontainer = $(`<div id='drawingtoolscontainer' class='tools'>`);
        this.drawingtoolscontainer.appendTo(this.drawing);
        this.drawingtoolscontainer.css('background-color', this.textarea.css('background-color'));
        this.drawingtools = {
            close: {
                element: $(`<div class='tabX'>X</div>`),
                behavior: ()=>{
                    let vroomvroom =[
                        {left: `5000px`},
                        {left: `-5000px`},
                        {top: `5000px`},
                        {top: `-5000px`}
                    ];
                    let directionsorta = vroomvroom[Math.floor(Math.random()*vroomvroom.length)];
                    let adjusttire = this.drawing.width() > this.drawing.height();
                    if (adjusttire)
                        adjusttire = {width: this.drawing.height()}
                    else
                        adjusttire = {height: this.drawing.width()}
                    this.drawing.animate(adjusttire, 200);
                    this.drawing.animate({  
                        now: '+=45',
                    },{
                        step: (now)=>{
                            this.drawing.css('border-radius', `${now*30}px`);
                        },
                        duration: 800,
                    }).animate({  
                        now: '+=2160',
                    },{
                        step: (now)=>{
                            this.drawing.css('transform',`rotate(${now}deg)`);
                        },
                        duration: 600,
                    }).animate(directionsorta, 400, null, ()=>{
                        //what makes this fun is that this method was only meant to really do these two things. lol
                        this.drawing.remove()
                        delete this.drawing;
                    });
                }
            },
            maximize: {
                element: $(`<div class='icondisplay iconmaximize'>🗖</div>`),
                behavior: ()=>{
                    if (!this.maximized){
                        this.olddimensions = {
                            top: this.drawing.css('top'),
                            left: this.drawing.css('left'),
                            width: this.drawing.css('width'),
                            height: this.drawing.css('height'),
                        }
                        this.drawing.animate({
                            top: 0,
                            left: 0,
                            height: window.innerHeight,
                            width: window.innerWidth,
                        }, 500, null,()=>{
                            this.drawingcontainer.animate({
                                height: this.drawing.height() - this.drawingtoolscontainer.height(),
                                width: `100%`,
                            });
                        });

                        this.maximized = true;
                    } else {
                        this.drawing
                            .draggable('enable', {stack: '.chat'})
                            .animate({
                                top: this.olddimensions.top,
                                left: this.olddimensions.left,
                                height: this.olddimensions.height,
                                width: this.olddimensions.width,
                            }, 500, null, ()=>{
                                this.drawingcontainer.animate({
                                    height: this.drawing.height() - this.drawingtoolscontainer.height(),
                                    width: `100%`,
                                });
                            });
                        this.maximized = false;
                    }
                    this.drawingtools.pan.element.click();
                }
            },
            save: {
                element: $(`<a class='icondisplay'>💾</div>`),
                behavior: (ev)=>{
                    this.canvas[0].toBlob((blob)=>{
                        //jquery let me down.  only way i can get this to work is vanilla js -_-
                        let URLObj = window.URL || window.webkitURL;
                        let a = document.createElement("a");  
                        a.href = URLObj.createObjectURL(blob);
                        a.download = "untitled.png";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });
                }
            },
            selection: {
                element: $(`<div class='icondisplay'>⬚</div>`),
                behavior: ()=>{
                    let clicking = false;
                    let rect = {};
                    this.selected = $(`<canvas id='selection' style='position: absolute; z-index=99999;'>`).appendTo(this.drawingcontainer);
                    this.selected
                        .css('top', this.canvas.position().top)
                        .css('left', this.canvas.position().left)
                        .css('cursor', 'crosshair');
                    this.selected[0].width = this.canvas[0].width;
                    this.selected[0].height = this.canvas[0].height;
                    this.selectedctx = this.selected[0].getContext('2d');
                    let ref = this.selectedctx.getImageData(0, 0, this.selected.width(), this.selected.height());
                    this.selected
                        .mousedown((e)=>{
                            clicking = true;
                            rect.startx = e.clientX - this.selected.offset().left;
                            rect.starty = e.clientY - this.selected.offset().top;
                            rect.w, rect.h = 0;
                        })
                        .mouseleave((e)=>{
                            this.selected.remove();
                            this.drawingtools.selection.element.click();
                            return;
                        })
                        .mousemove((e)=>{
                            if (!clicking) return;
                            rect.w = e.clientX - this.selected.offset().left - rect.startx;
                            rect.h = e.clientY - this.selected.offset().top - rect.starty;
                            this.selectedctx.clearRect(0, 0, this.selected.width(), this.selected.height());
                            this.selectedctx.putImageData(ref, 0, 0)
                            this.ctx.lineWidth = 2;
                            this.selectedctx.strokeRect(rect.startx, rect.starty, rect.w, rect.h);
                        })
                        .mouseup((e)=>{
                            clicking = false;
                            if (Math.abs(rect.w) < 32 || isNaN(Math.abs(rect.w)) || Math.abs(rect.y) < 32 || isNaN(Math.abs(rect.h))){
                                this.selected.remove();
                                this.drawingtools.selection.element.click();
                                return;
                            }
                            let cropped = this.ctx.getImageData(rect.startx, rect.starty, rect.w, rect.h)
                            this.canvas[0].width = Math.abs(rect.w);
                            this.canvas[0].height = Math.abs(rect.h);
                            this.drawing.animate({
                                width: this.canvas.width(),
                                height: this.canvas.height() + this.drawingtoolscontainer.height()
                            });
                            this.drawingcontainer.animate({
                                width: this.canvas.width(),
                                height: this.canvas.height()
                            });
                            this.ctx.putImageData(cropped, 0, 0);
                            this.selected.remove();
                            //the reason for this is to also allow users to copy their current canvas to a blob and then paste it back into the chat.
                            this.drawingtools.move.element.click();
                        });
                },
            },
            line: {       
                element: $(`<div class='icondisplay iconline'>╲</div>`),
                behavior: ()=>{
                    let clicking = false;
                    let line = {};
                    let ref = this.ctx.getImageData(0, 0, this.canvas.width(), this.canvas.height());
                    this.drawingcontainer
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                            clicking=true;
                            line.startx = e.clientX - this.canvas.offset().left;
                            line.starty = e.clientY - this.canvas.offset().top;
                        })
                        .mousemove((e)=>{
                            if (!clicking) return;
                            line.x = e.clientX - this.canvas.offset().left;
                            line.y = e.clientY - this.canvas.offset().top;
                            this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
                            this.ctx.putImageData(ref, 0, 0);
                            this.ctx.beginPath();
                            this.ctx.moveTo(line.startx, line.starty);
                            this.ctx.lineTo(line.x, line.y);
                            this.ctx.lineWidth = 2;
                            this.ctx.stroke();
                        })
                        .mouseup((e)=>{
                            clicking = false;
                            ref = this.ctx.getImageData(0, 0, this.canvas.width(), this.canvas.height());
                        });
                }
            },
            square: {
                element: $(`<div class='icondisplay iconsquare'>◻</div>`),
                behavior: ()=>{
                    let clicking = false;
                    let rect = {};
                    let ref = this.ctx.getImageData(0, 0, this.canvas.width(), this.canvas.height());
                    this.canvas
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                            clicking = true;
                            rect.startx = e.clientX - this.canvas.offset().left;
                            rect.starty = e.clientY - this.canvas.offset().top;
                        })
                        .mousemove((e)=>{
                            if (!clicking) return;
                            rect.w = e.clientX - this.canvas.offset().left;
                            rect.h = e.clientY - this.canvas.offset().top;
                            this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
                            this.ctx.putImageData(ref, 0, 0)
                            this.ctx.lineWidth = 2;
                            // dont even ask.....
                            if (e.altKey){
                                if (rect.w < rect.startx && rect.h > rect.starty)
                                    this.ctx.strokeRect(rect.startx, rect.starty, (rect.w - rect.startx), Math.abs(rect.w-rect.startx));
                                else if (rect.w > rect.startx && rect.h < rect.starty)
                                    this.ctx.strokeRect(rect.startx, rect.starty, Math.abs(rect.w - rect.startx), -(rect.w-rect.startx));
                                else
                                    this.ctx.strokeRect(rect.startx, rect.starty, rect.w - rect.startx, rect.w-rect.startx);
                            } else{
                                this.ctx.strokeRect(rect.startx, rect.starty, rect.w - rect.startx, rect.h - rect.starty);
                            }
                        })
                        .mouseup((e)=>{
                            clicking = false;
                            ref = this.ctx.getImageData(0, 0, this.canvas.width(), this.canvas.height());
                        });
                }
            },
            circle: {
                element: $(`<div class='icondisplay'>⬤</div>`),
                behavior: ()=>{
                    let clicking = false;
                    let circle = {};
                    let ref = this.ctx.getImageData(0, 0, this.canvas.width(), this.canvas.height());
                    this.canvas
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                            clicking = true;
                            circle.startx = e.clientX - this.canvas.offset().left;
                            circle.starty = e.clientY - this.canvas.offset().top;

                        })
                        .mousemove((e)=>{
                            if (!clicking) return;
                            circle.w = e.clientX - this.canvas.offset().left;
                            circle.h = e.clientY - this.canvas.offset().top;
                            this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
                            this.ctx.putImageData(ref, 0, 0)
                            this.ctx.beginPath();
                            if (e.altKey){
                                this.ctx.arc(circle.startx, circle.starty, Math.abs(circle.startx-circle.w), 0, 2*Math.PI);
                            } else{
                                this.ctx.ellipse(circle.startx, circle.starty,  Math.abs(circle.startx - circle.w), Math.abs(circle.starty - circle.h), Math.PI/180, 0, 2 * Math.PI);
                            }
                            this.ctx.lineWidth = 2;
                            this.ctx.stroke();
                        })
                        .mouseup((e)=>{
                            clicking = false;
                            ref = this.ctx.getImageData(0, 0, this.canvas.width(), this.canvas.height());
                        });
                }
            },
            pencil: {     
                element: $(`<div class='icondisplay'>✎</div>`),
                behavior: ()=>{
                    let dot = {};
                    let clicking = false;
                    this.drawingcontainer
                        .addClass('pencil')
                        .mousedown((e)=>{
                            clicking = true;
                            dot.x = e.clientX - this.canvas.offset().left;
                            dot.y = e.clientY - this.canvas.offset().top; 
                            this.ctx.beginPath();
                            this.ctx.lineTo(dot.x, dot.y);
                            this.ctx.stroke();
                        })
                        .mousemove((e)=>{
                            if (!clicking) return;
                            dot.x = e.clientX - this.canvas.offset().left;
                            dot.y = e.clientY - this.canvas.offset().top; 
                            this.ctx.lineTo(dot.x, dot.y);
                            this.ctx.lineWidth = 2;
                            this.ctx.stroke();
                        })
                        .mouseup((e)=>{
                            clicking = false;
                        });
                }
            },
            colorpicker: {
                element: $(`<input type="color" class='icondisplay' style='width: 50px;'>`),
                behavior: ()=>{

                }
            },
            pan: {       
                element: $(`<div class='icondisplay'>🤚</div>`),
                behavior: ()=>{
                    this.drawingcontainer
                        .addClass('dragscroll')
                        .css('cursor', '-webkit-grab')
                        .mousedown(()=>{
                            this.drawingcontainer.css('cursor', '-webkit-grabbing');
                        })
                        .mouseup(()=>{
                            this.drawingcontainer.css('cursor', '-webkit-grab');
                        });
                    dragscroll.reset();
                }
            },
            move: {
                element: $(`<div class='icondisplay iconmove'>⇱</div>`),
                behavior: ()=>{
                    this.drawing.draggable('enable', {stack: '.chat'});
                }
            },
        };

        //for each tool, append it to toolcontainer and when each is clicked, remove any class they had
        //and stop the window from dragging, and start up their associated behavior.
        for (let i in this.drawingtools){
            this.drawingtools[i].element.appendTo(this.drawingtoolscontainer);
            this.drawingtools[i].element.on('click', (ev)=>{
                for (let j in this.drawingtools){
                    this.drawingtools[j].element.css('background-color', 'darkgray');
                }
                this.drawingtools[i].element.css('background-color', 'gray');
                if (this.selected)
                    this.selected.remove();
                this.drawing.draggable('disable');
                this.drawingcontainer
                    .off()
                    .removeClass()
                    .css('cursor', '');
                this.canvas
                    .off()
                    .removeClass()
                    .css('cursor', '');
                dragscroll.reset();
                this.ctx.strokeStyle = this.drawingtools.colorpicker.element[0].value;
                this.drawingtools[i].behavior(ev);
            });
        }
    };
    this.buildtools();
    this.canvas = $(`<canvas id='drawing'>`);
    this.ctx = this.canvas[0].getContext('2d');
    this.img = new Image();
    this.URLObj = window.URL || window.webkitURL;
    this.img.src = this.URLObj.createObjectURL(blob);
    this.drawingcontainer.append(this.canvas);
    this.drawing.append(this.drawingcontainer);
    this.img.onload = () =>{
        this.canvas[0].width = this.img.width;
        this.canvas[0].height = this.img.height;
        this.ctx.drawImage(this.img, 0, 0);
        let x,y;
        this.img.width > $(window).width()/2 ? x = '50%' : x = this.img.width;
        this.img.height > $(window).height()/2 ? y = '50%' : y = this.img.height;
        this.drawing.stop().animate({
            // e is from global e within this file (where the image was originally clicked)
            top: e.clientY,
            left: e.clientX,
            width: `0%`,
            height: `0%`,
            opacity: `0`
        }, 0, null, ()=>{
            this.drawing.stop().animate({
                top: `25%`,
                left: `25%`,
                width: x,
                height: y,
                opacity: `1`,
            }, 500, null, ()=>{
                this.drawingcontainer.stop().animate({
                    width: `100%`,
                    height: this.drawing.height() - this.drawingtoolscontainer.height()
                });
            });
        });
    };
    if (this.drawing.css('z-index') < this.chat.css('z-index')){
        this.drawing.css('z-index', this.chat.css('z-index') + 1);
    }
    //hotkeys for drawing container
    $(window).on('keydown', escape);
    let reftools = this.drawingtools;
    function escape(e){
        if (e.which==27){
            reftools.close.behavior();
            $(window).off('keydown', escape);
        }
    }
    this.drawing.draggable({
        containment: 'body',
        stack: ".chat"
    });
    this.drawing.resizable({
        alsoResize: this.drawingcontainer,
        handles: 'all'
    })
}
