export default function(e){
    if (e.target !== e.currentTarget)
        return;
    this.cgroup.children().css('backgroundColor', this.textarea.css('backgroundColor'));
    this.cgroup.children().css('color', this.textarea.css('color'));
    e.target.style.backgroundColor = this.msgs.Main[0].style.backgroundColor;
    e.target.style.color = this.msgs.Main[0].style.color;
    e.target.innerText.slice(-1) !== 'X' ? this.curtab = 'Main' : this.curtab = e.target.innerText.slice(0, -1);
    for (let msgsgrp in this.msgs){
        this.msgs[msgsgrp].hide();
    }
    this.msgs[this.curtab].show();
    this.textarea.focus();
    let shouldscroll = this.msgs[this.curtab].scrollTop() >= (this.msgs[this.curtab][0].scrollHeight - this.msgs[this.curtab][0].offsetHeight);
    if (shouldscroll)
        this.scrollBottom();
}