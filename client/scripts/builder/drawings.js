export default function(e, blob){
    if (this.drawing)
        return;
    this.drawing = $(`<div id='${blob.size}' class='chat' style='z-index:5;'>`);
    this.drawing.appendTo($('body'));
    this.drawingcontainer = $(`<div style="overflow: scroll;"></div>`);
    this.boxshad = [Math.floor(Math.random()*50)+50, Math.floor(Math.random()*50)+50, Math.floor(Math.random()*50)+50]
    this.drawing.stop().animate({
        top: e.clientY,
        left: e.clientX,
        width: `0%`,
        height: `0%`,
        opacity: `0`
    }, 0, null, ()=>{
        this.drawing.stop().animate({
            top: `25%`,
            left: `25%`,
            width: `50%`,
            height: `50%`,
            opacity: `1`,
            boxShadow: `1 1 1000px 100px rgb(${this.boxshad[0]}, ${this.boxshad[1]}, ${this.boxshad[2]})`
        }, 750, null, ()=>{
            this.drawingcontainer.stop().animate({
                height: `100%`,
                width: `100%`
            });
        });
    });
    this.maximized = false;
    this.olddimensions = {
        top: null,
        left: null,
        width: null,
        height: null
    };
    this.canvas = $('<canvas/>');
    this.ctx = this.canvas[0].getContext('2d');
    this.img = new Image();
    this.URLObj = window.URL || window.webkitURL;
    this.img.src = this.URLObj.createObjectURL(blob);
    this.drawingcontainer.append(this.canvas);
    this.drawing.append(this.drawingcontainer);
    this.img.onload = (e) =>{
        this.canvas[0].width = this.img.width;
        this.canvas[0].height = this.img.height;
        this.ctx.drawImage(this.img, 0, 0);
    };
    this.tools = {};
    let pencil;
    this.socket.emit('pencil', (e)=>{

    });
    this.buildtools = () =>{
        this.container = $(`<div class='tools'>`);
        this.container.appendTo(this.drawing);
        this.tools = {
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
                    this.drawing.draggable('enable');
                }
            },
            //there is a bug with this
            //if tool is changed from this, old selection remains.  needs to be fixed.
            selection: {
                element: $(`<div class='icondisplay'>⬚</div>`),
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
                            rect.w = e.clientX - this.canvas.offset().left - rect.startx;
                            rect.h = e.clientY - this.canvas.offset().top - rect.starty;
                            this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
                            this.ctx.putImageData(ref, 0, 0)
                            this.ctx.strokeRect(rect.startx, rect.starty, rect.w, rect.h);
                        })
                        .mouseup((e)=>{
                            clicking = false;
                        });
                }
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
                            this.ctx.stroke();
                        })
                        .mouseup((e)=>{
                            clicking = false;
                            this.ctx.beginPath();
                            this.ctx.moveTo(line.startx, line.starty);
                            this.ctx.lineTo(line.x, line.y);
                            this.ctx.stroke();
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
                            rect.w = e.clientX - this.canvas.offset().left - rect.startx;
                            rect.h = e.clientY - this.canvas.offset().top - rect.starty;
                            this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
                            this.ctx.putImageData(ref, 0, 0)
                            this.ctx.strokeRect(rect.startx, rect.starty, rect.w, rect.h);
                        })
                        .mouseup((e)=>{
                            clicking = false;
                            this.ctx.strokeRect(rect.startx, rect.starty, rect.w, rect.h);
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
                            this.ctx.ellipse(circle.startx, circle.starty,  Math.abs(circle.startx - circle.w), Math.abs(circle.starty - circle.h), Math.PI/180, 0, 2 * Math.PI);
                            this.ctx.lineWidth = 3;
                            this.ctx.strokeStyle = 'black';
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
                            dot.x = e.clientX - this.canvas.offset().left + 2;
                            dot.y = e.clientY - this.canvas.offset().top + 28; 
                            this.ctx.beginPath();
                            this.ctx.lineTo(dot.x, dot.y);
                            this.ctx.stroke();
                        })
                        .mousemove((e)=>{
                            if (!clicking) return;
                            dot.x = e.clientX - this.canvas.offset().left + 2;
                            dot.y = e.clientY - this.canvas.offset().top + 28; 
                            this.ctx.lineTo(dot.x, dot.y);
                            this.ctx.stroke();
                        })
                        .mouseup((e)=>{
                            clicking = false;
                        });
                }
            },
            save: {
                element: $(`<div class='icondisplay'>💾</div>`),
                behavior: ()=>{
                    this.drawingcontainer
                        .css('cursor', 'auto')
                        .mousedown((e)=>{
                        })
                        .mouseup((e)=>{
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
                        //animate both the container and the canvas container but not the canvas
                        this.drawing.animate({
                            top: 0,
                            left: 0,
                            height: `${window.innerHeight}px`,
                            width: `${window.innerWidth}px`,
                        });
                        this.drawingcontainer.animate({
                            height: `${window.innerHeight}px`,
                            width: `${window.innerWidth}px`,
                        });
                        this.maximized = true;
                    } else {
                        this.drawing
                            .draggable('enable')
                            .animate({
                                top: this.olddimensions.top,
                                left: this.olddimensions.left,
                                height: this.olddimensions.height,
                                width: this.olddimensions.width,
                            });
                        this.drawingcontainer.animate({
                            height: this.olddimensions.height,
                            width: this.olddimensions.width     
                        });
                        this.maximized = false;
                    }
                }
            },
            close: {
                element: $(`<div class='tabX'>X</div>`),
                behavior: ()=>{
                    this.drawing.animate({
                        //e is from the initial invocation of drawings() aka the mini global e
                        top: e.clientY,
                        left: e.clientX,
                        width: `0%`,
                        height: `0%`,
                        opacity: `0`
                    },100, null, ()=>{
                        this.drawing.remove()
                        delete this.drawing;
                    });
                }
            },
        };

        //for each tool, append it to toolcontainer and when each is clicked, remove any class they had
        //and stop the window from dragging, and start up their associated behavior.
        for (let i in this.tools){
            this.tools[i].element.appendTo(this.container);
            this.tools[i].element.on('click', (e)=>{
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
                this.tools[i].behavior();
            });
        }
    };
    this.buildtools();
    
    //hotkeys for drawing container
    $(window).on('keydown', escape);
    let reftools = this.tools;
    function escape(e, ref){
        if (e.which==27){
            reftools.close.behavior();
            $(window).off('keydown', escape);
        }
    }
    this.drawing.draggable({
        containment: 'body'
    });
    this.drawing.resizable({
        alsoResize: this.drawingcontainer,
        handles: 'all'
    })
    $(window).resize(()=>{
        if (!this.drawing)
            return;
        this.drawingcontainer.css('width', this.drawing.css('width'));
        this.drawingcontainer.css('height', this.drawing.css('height'));
    });
}
