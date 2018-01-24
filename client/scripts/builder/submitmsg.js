export default function(e){
	//paste
	if (e.type =='paste'){
		let items = e.originalEvent.clipboardData.items;
		if(!items)
			return;
        let blob;
		for (var i = 0; i < items.length; i++) {
			if (items[i].type.indexOf("image") == -1) continue;
			blob = items[i].getAsFile();
		}
		if (!blob)
			return;
		this.imagepreview.show();
		let ctx = this.imagepreviewcvs[0].getContext('2d');
        ctx.clearRect(0, 0, this.imagepreviewcvs[0].width, this.imagepreviewcvs[0].height);
		let img = new Image();
		img.onload = (e) => {
			this.imagepreview[0].width = 350;
			this.imagepreview[0].height = 250;
			ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, this.imagepreview[0].width, this.imagepreview[0].height);
		};
		let URLObj = window.URL || window.webkitURL;
		img.src = URLObj.createObjectURL(blob);
        this.blob = blob;
        this.imagepreviewX.on('click', (e) => {
            $(e.target).parent().hide();
            this.blob = {};
        });
	}
    //up
    if (e.which == 38 && e.target.selectionStart == 0){
        this.position--;
        if (this.position < 0)
            this.position = 0;
        e.target.value = this.posts[this.position] || '';
    }
    //down
    if (e.which == 40 && e.target.selectionEnd == e.target.value.length){
        this.position++;
        if (this.position >= this.posts.length)
            this.position = this.posts.length;
        e.target.value = this.posts[this.position] || '';
    }

    //delete
    if (e.which == 8 && e.target.selectionStart == 0){
        this.imagepreview.hide();
        this.blob = {};
    }

    //enter
    if (e.which == 13 && !e.shiftKey)
        e.preventDefault();
    if (e.which == 13 && !e.shiftKey && (e.target.value.trim().length>0 || !$.isEmptyObject(this.blob))) {
        e.preventDefault();
        let msg = e.target.value.trim();
        this.socket.emit('chatMsg', {
            msg: msg,
            blob: this.blob,
            curtab: this.curtab
        });
        this.posts.push(msg);
        this.position = this.posts.length;
        e.target.value = ''; // CLEAR TEXTAREA
        this.scrollBottom();
        this.socket.chatting = false;
    }
    //any other key
    if (e.target.value.length){
        this.socket.emit('istyping', 1);
    } else{
        this.socket.emit('istyping', 0);
    }
}