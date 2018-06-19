export default {
    template : '#coor-tpl',
    data() {
        return {
            // canvas
            cw : null,
            ch : null,
            c : null,
            ctx : null,

            fps : 24,
            lastTime: undefined,
            dragging: false,

            // x-mouse
            mousePos: {
                x : null,
                y : null,
            },

            // coor
            cameraPos: {
                x : 0.0,
                y : 0.0,
            },

            // 1 pixel = zoom * metre_in_game
            zoom : 1.0,
            scaleWidth: 60,
        }
    },
    props: {
        ps : {
            type: Array,
        }
    },
    computed: {
        screenRB : function() {
            return {
                x : this.cameraPos.x + this.zoom * this.cw / 2,
                y : this.cameraPos.y + this.zoom * this.ch / 2,
            };
        },
        screenLU : function() {
            return {
                x : this.cameraPos.x - this.zoom * this.cw / 2,
                y : this.cameraPos.y - this.zoom * this.ch / 2,
            };
        },
        scaleHUD: function() {
            return this.scaleWidth * this.zoom;
        },
        // x-mouse-map
        mousePosInMap: function() {
            return this.screen2map(this.mousePos);
        },
        pointsInCamera: function() {
            let lu = this.screenLU;
            let rb = this.screenRB;
            return this.ps.filter(
                p =>
                      p.x >= lu.x && p.x <= rb.x
                  &&  p.y >= lu.y && p.y <= rb.y);
        },
        nodeRadius: function() {
            return Math.min(   Math.max(5, 10 / this.zoom)
                             , 100);
        },
    },
    mounted: function() {
        this.initCanvas();
    },
    methods: {
        initCanvas: function() {
            this.c = document.getElementById("cv");
            this.ctx = this.c.getContext("2d");
            this.c.width = this.c.offsetWidth;
            this.c.height = this.c.offsetHeight;

            this.cw = this.c.width;
            this.ch = this.c.height;

            this.c.onmousedown = this.onMouseDown;
            this.c.onmouseup = this.onMouseUp;
            this.c.onmousemove = this.onMouseMove;
            this.c.onmousewheel = this.onMouseWheel;

            this.lastTime = Date.now();
            let itv = 1000 / this.fps;
            setInterval( () => {
                let now = Date.now();
                let delta = now - this.lastTime;
                this.lastTime = now;
                this.update(delta);
            }, itv
            );
        },
        update: function(delta) {
            // console.log(delta);
            this.draw();
        },
        onMouseDown: function(e) {
            console.log("mouse down");
            this.dragging = true;
        },
        onMouseUp: function(e) {
            console.log("mouse up");
            this.dragging = false;
        },
        onMouseMove: function(e) {
            this.refreshMousePos(e);
            this.checkMouseOnNode();
            if (this.dragging) {
            }
        },
        onMouseWheel: function(e) {
            let dy = e.deltaY;
            let z = 1;
            let f = 2;
            if (dy > 0) { // zoom out
                z *= f;
            }
            else if (dy < 0) {
                z /= f;
            }
            this.zoom *= z;
        },
        refreshMousePos: function(e) {
            let r = this.c.getBoundingClientRect();
            this.mousePos = {
                x : e.clientX - r.left,
                y : e.clientY - r.top,
            };
        },
        checkMouseOnNode: function() {
            let m = this.mousePos;
            let len = this.pointsInCamera.length;
            for (let i = 0; i < len; i++) {
                let p = this.map2screen(this.pointsInCamera[i]);
                if ( Math.pow(m.x - p.x, 2) + Math.pow(m.y - p.y, 2) <= this.nodeRadius * this.nodeRadius) {
                    this.showNodeInfo(this.pointsInCamera[i]);
                }
            }
        },
        screen2map: function(p) {
            return {
                x : Math.floor(p.x * this.zoom + this.screenLU.x),
                y : Math.floor(p.y * this.zoom + this.screenLU.y),
            };
        },
        map2screen: function(p) {
            return {
                x : (p.x - this.screenLU.x) / this.zoom,
                y : (p.y - this.screenLU.y) / this.zoom,
            };
        },
        draw: function() {
            this.ctx.clearRect(0, 0, this.cw, this.ch);
            this.drawNodes();
        },
        drawNodes: function() {
            for (let i = 0; i < this.pointsInCamera.length; i++) {
                this.drawNode(this.pointsInCamera[i]);
            }
        },
        drawNode: function(node) {
            this.ctx.beginPath();
            let p = this.map2screen(node);
            let color = "#66ccff";
            let lineColor = "#afa"
            this.ctx.arc(p.x, p.y, this.nodeRadius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = lineColor;
            this.ctx.stroke();
        },
        showNodeInfo: function(node) {
        },
        debug: function() {
            this.ctx.rect(0,0,100,100);
            this.ctx.stroke();
        }
    }
}
