export default function(args){
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