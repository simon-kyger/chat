export default function(){
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