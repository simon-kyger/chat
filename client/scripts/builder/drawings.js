export default function(e, blob){
    if (this.drawing)
        return;
    this.drawing = $(`<div id='${blob.size}' class='chat'>`);
    this.drawing.appendTo($('body'));
    this.drawingcontainer = $(`<div style="overflow: scroll;"></div>`);
    this.boxshad = [Math.floor(Math.random()*50)+50, Math.floor(Math.random()*50)+50, Math.floor(Math.random()*50)+50]
    this.drawing.stop().animate({
        top: e.clientY,
        left: e.clientX,
        width: `0%`,
        height: `0%`,
    }, 0, null, ()=>{
        this.drawing.stop().animate({
            top: `25%`,
            left: `25%`,
            width: `50%`,
            height: `50%`,
            boxShadow: `1 1 1000px 100px rgb(${this.boxshad[0]}, ${this.boxshad[1]}, ${this.boxshad[2]})`
        }, 750, null, ()=>{
            this.drawingcontainer.css('height', this.drawing.height());
            this.drawingcontainer.css('width', this.drawing.width());
        });
    });
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
    this.buildtools = () =>{
        this.container = $(`<div class='tools'>`);
        this.container.appendTo(this.drawing);
        this.tools = {
            pan: {       
                element: $(`<div class='icondisplay'>🤚</div>`),
                behavior: ()=>{
                    let options = {
                        color: 'white', 
                        outline: 'black', 
                        size: '24'
                    };
                    this.drawingcontainer
                        .awesomeCursor('hand-stop-o', options)
                        .addClass('dragscroll')
                        .mousedown(()=>{
                            this.drawingcontainer.awesomeCursor('hand-rock-o', options);
                        })
                        .mouseup(()=>{
                            this.drawingcontainer.awesomeCursor('hand-stop-o', options);
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
            selection: {
                element: $(`<div class='icondisplay'>⬚</div>`),
                behavior: ()=>{
                    this.drawingcontainer
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                        })
                        .mouseup((e)=>{
                        });
                }
            },
            line: {       
                element: $(`<div class='icondisplay iconline'>╲</div>`),
                behavior: ()=>{
                    this.drawingcontainer
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                        })
                        .mouseup((e)=>{
                        });
                }
            },
            square: {
                element: $(`<div class='icondisplay iconsquare'>◻</div>`),
                behavior: ()=>{
                    this.drawingcontainer
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                        })
                        .mouseup((e)=>{
                        });

                }
            },
            circle: {
                element: $(`<div class='icondisplay'>⬤</div>`),
                behavior: ()=>{
                    this.drawingcontainer
                        .css('cursor', 'crosshair')
                        .mousedown((e)=>{
                        })
                        .mouseup((e)=>{
                        });
                }
            },
            pencil: {     
                element: $(`<div class='icondisplay'>✎</div>`),
                behavior: ()=>{
                    let options = {
                        color: 'black', 
                        outline: 'white', 
                        size: '24'
                    };
                    this.drawingcontainer
                        .awesomeCursor('pencil', options)
                        .mousedown((e)=>{
                        })
                        .mouseup((e)=>{
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
                    }, ()=>{
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
            this.tools[i].element.on('click', ()=>{
                this.drawing.draggable('disable');
                this.drawingcontainer
                    .off()
                    .removeClass()
                    .css('cursor', '');
                dragscroll.reset();
                this.tools[i].behavior();
            });
        }
    };
    this.buildtools();
    this.drawing.draggable({
        containment: 'body'
    });
    this.drawing.resizable({
        alsoResize: this.drawingcontainer,
        handles: 'all'
    })
    $('body').resize(()=>{
        if (!this.drawing)
            return;
        this.drawingcontainer.css('width', this.drawing.css('width'));
        this.drawingcontainer.css('height', this.drawing.css('height'));
    });
}
