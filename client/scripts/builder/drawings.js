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
    this.drawingtools = $(`<div class='tools'>`);
    this.drawingtools.appendTo(this.drawing);
    this.drawingX = $(`<div id='drawingX' class='tabX'>X</div>`);
    this.drawingX.appendTo(this.drawingtools);
    this.drawingX.on('click', (e2)=>{
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
    });
    //insert new icons here
    this.drawingselection= $(`<div id='drawingselection' class='icondisplay'>⬚</div>`);
    this.drawingselection.appendTo(this.drawingtools);
    this.drawingselection.on('click', (e2)=>{
        console.log('selecting');
    });
    this.drawingsquare= $(`<div id='drawingsquare' class='icondisplay'>◻</div>`);
    this.drawingsquare.appendTo(this.drawingtools);
    this.drawingsquare.on('click', (e2)=>{
        console.log('square');
    });
    this.drawingline = $(`<div id='drawingline' class='icondisplay iconline'>╲</div>`);
    this.drawingline.appendTo(this.drawingtools);
    this.drawingline.on('click', (e2)=>{
        console.log('line');
    });
    this.drawingcircle = $(`<div id='drawingcircle' class='icondisplay'>⬤</div>`);
    this.drawingcircle.appendTo(this.drawingtools);
    this.drawingcircle.on('click', (e2)=>{
        console.log('circling');
    });
    this.drawingpencil = $(`<div id='drawingpencil' class='icondisplay'>✎</div>`);
    this.drawingpencil.appendTo(this.drawingtools);
    this.drawingpencil.on('click', (e2)=>{
        this.canvas.addEventListener('mousedown', ev_canvas, false);
        this.canvas.addEventListener('mousemove', ev_canvas, false);
        this.canvas.addEventListener('mouseup',   ev_canvas, false);
    });
    this.drawingmove = $(`<div id='drawingmove' class='icondisplay iconmove'>✣</div>`);
    this.drawingmove.appendTo(this.drawingtools);
    this.drawingmove.on('click', (e2)=>{
        this.drawingcontainer.removeClass();
        if (this.drawing.data('uiDraggable').options.disabled) {
            this.drawing.draggable('enable');
            dragscroll.reset();
        } else {
            this.drawing.draggable('disable');
            this.drawingcontainer.addClass('dragscroll');
            dragscroll.reset();
        }
    });
    this.drawingsave = $(`<div id='drawingsave' class='icondisplay'>💾</div>`);
    this.drawingsave.appendTo(this.drawingtools);
    this.drawingsave.on('click', (e2)=>{
        console.log('saving');
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
