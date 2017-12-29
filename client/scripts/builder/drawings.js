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
            drawingX: {
                element: $(`<div id='drawingX' class='tabX'>X</div>`),
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
            drawingselection: {
                element: $(`<div id='drawingselection' class='icondisplay'>⬚</div>`),
                behavior: ()=>{

                }
            },
            drawingsquare: {
                element: $(`<div id='drawingsquare' class='icondisplay'>◻</div>`),
                behavior: ()=>{

                }
            },
            drawingsquare: {       
                element: $(`<div id='drawingline' class='icondisplay iconline'>╲</div>`),
                behavior: ()=>{

                }
            },
            drawingcircle: {
                element: $(`<div id='drawingcircle' class='icondisplay'>⬤</div>`),
                behavior: ()=>{

                }
            },
            drawingpencil: {     
                element: $(`<div id='drawingpencil' class='icondisplay'>✎</div>`),
                behavior: ()=>{

                }
            },
            drawingmove: {       
                element: $(`<div id='drawingmove' class='icondisplay iconmove'>✣</div>`),
                behavior: ()=>{
                    
                }
            },
            drawingsave: {
                element: $(`<div id='drawingsave' class='icondisplay'>💾</div>`),
                behavior: ()=>{

                }
            },
        };
        //for each tool, append it to toolcontainer and when each is clicked, remove any class they had
        //and stop the window from dragging, and start up their associated behavior.
        for (let i in this.tools){
            this.tools[i].element.appendTo(this.container);
            this.tools[i].element.on('click', ()=>{
                this.drawingcontainer.removeClass();
                if (this.drawing.data('uiDraggable').options.disabled) {
                    this.drawing.draggable('enable');
                    dragscroll.reset();
                } else {
                    this.drawing.draggable('disable');
                    this.drawingcontainer.addClass('dragscroll');
                    dragscroll.reset();
                }
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
    $('body')[0].onresize = (e)=>{
        if (!this.drawing)
            return;
        this.drawingcontainer.css('width', this.drawing.css('width'));
        this.drawingcontainer.css('height', this.drawing.css('height'));
    }
}
