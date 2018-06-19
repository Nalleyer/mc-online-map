import coor from '/js/coor.js';

var app = new Vue({
    el: '#app',
    components: {
        coor
    },
    data: {
        version       : 0.3,
        loggedIn      : false,

        dialogShown   : false,
        wrongPasswordShown : false,
        loadingShown : true,

        processing : false,

        logToken      : "null",

        loginUser     : '',
        loginPassWord : '',

        points : [],
        editingPoint : null,

        gettingPointsFromServer: true,
        editingIndex : -1,
        newPoint : null,

        mouseOverNewPointEditor : false,

        toNetherCoor: false,
    },
    computed : {
        newPointEditorShown: function() {
            let p = this.newPoint;
            return this.mouseOverNewPointEditor
                || p.name
                || p.x
                || p.y;
        },
        addIconShown: function() {
            let p = this.newPoint;
            return p.name
                && p.x !== null
                && p.y !== null;
        },
        pointsNether: function() {
            const f = 8;
            return this.points.map(p => {
                return {
                    name: p.name,
                    x: Math.floor(p.x / f),
                    y: Math.floor(p.y / f),
                };
            });
        },
        pointsforShowing: function() {
            if (this.toNetherCoor) {
                return this.pointsNether;
            }
            else {
                return this.points;
            }
        },
    },
    created: function() {
        this.resetNewPoint();
    },
    mounted: function() {
        this.getPoints();
        this.loadingShown = false;

        setInterval(() => {
            if (this.gettingPointsFromServer) {
                this.getPoints();
            }
        }, 5000);
    },
    methods: {
        openLoginDialog: function() {
            this.dialogShown = true;
        },
        logEditing: function() {
            this.wrongPasswordShown = false;
        },
        sortPoints: function() {
            this.points.sort(
                (p1, p2) => {
                    if (p1.x !== p2.x) {
                        return p1.x - p2.x;
                    }
                    if (p1.y !== p2.y) {
                        return p1.y - p2.y;
                    }
                    return p1.name - p2.name;
                }
            );
        },
        login: function(after) {
            this.say("login");
            this.processing = true;
            // get time token
            return this.$http.get('/api/login').then(
                response => {
                    let timeToken = response.body;
                    // post to login
                    this.$http.post('api/login', {
                        usr : this.loginUser,
                        time_token : timeToken,
                        hash : md5(this.loginPassWord + timeToken)
                    })
                        .then(
                        response => { // logged in
                            this.logToken = response.body;
                            this.loggedIn = true;
                            console.log(this.logToken);
                            console.log("logged in");
                            this.closeLoginDialog();
                            this.processing = false;
                            if (after) {
                                after();
                            }
                        },
                        response => {
                            this.wrongPassword();
                            console.log('wrong usr or psw');
                            this.processing = false;
                        }
                    );
                },
                resonse => {
                    console.log("failed");
                    this.processing = false;
                }
            );
        },
        wrongPassword: function() {
            this.wrongPasswordShown = true;
        },
        logout: function() {
            this.logToken = '';
            this.loggedIn = false;
        },
        closeLoginDialog: function() {
            this.dialogShown = false;
        },
        getPoints: function(after) {
            console.log("getPoints...");
            this.$http.get('/api/points', {
                headers : {
                    token: this.logToken
                }
            }).then(
                response => {
                    this.points = response.body;
                    this.sortPoints();
                    if (after) {
                        after();
                    }
                },
                response => {
                    console.log("get points failed");
                }
            );
        },
        addPoint: function(x, y, name, after) {
            if ( this.isInt(x) && this.isInt(y) ) {
                this.$http.put('/api/points', {
                    token : this.logToken,
                    point : "(" + x + "," + y + ")",
                    name : name,
                    method : "add",
                }).then(
                    response => {
                        if (response.body === "ok" ) {
                            console.log("added");
                            if (after) {
                                after();
                            }
                        }
                        else {
                            console.log("exists");
                        }
                    },
                    response => {
                        console.log("failed");
                    }
                );
            }
        },
        deletePoint: function(x, y, after) {
            if (this.isInt(x) && this.isInt(y)) {
                // search
                this.$http.put('/api/points', {
                    token : this.logToken,
                    point : "(" + x + "," + y + ")",
                    method : "delete",
                }).then(
                    response => {
                        console.log("deleted");
                        if (after) {
                            after();
                        }
                    },
                    response => {
                        console.log("failed");
                    }
                );
            }
            else {
                console.log("not number");
            }
        },
        renamePoint: function(x, y, newName, after) {
            if (this.isInt(x) && this.isInt(y)) {
                // search
                let l = this.points.length;
                for (let i = 0; i < l; i++) {
                    if (this.points[i].x === x && this.points[i].y === y) {
                        this.$http.put('/api/points', {
                            token : this.logToken,
                            point : "(" + x + "," + y + ")",
                            name : newName,
                            method : "set",
                        }).then(
                            response => {
                                if (response.body === "ok" ) {
                                    console.log("added");
                                    if (after) {
                                        after();
                                    }
                                }
                            },
                            response => {
                                console.log("failed. " + response.body);
                            }
                        );
                    }
                }
                console.log("no such point");
            }
        },
        coorClicked: function(p) {
            this.editingPoint = {
                name : p.name,
                x : p.x,
                y : p.y,
            };
        },
        setCoorEditing: function() {
            this.coorEditing = true;
        },
        coorEdited: function(index) {
            let oldP = this.editingPoint;
            let newP = this.points[index];
            if (oldP.x === newP.x && oldP.y === newP.y) {
                if (oldP.name !== newP.name) {
                    // update name
                    this.renamePoint(newP.x,newP.y,newP.name);
                }
            }
            else {
                // delete and add
                console.log("to delete");
                console.log(oldP);
                this.deletePoint(oldP.x, oldP.y);
                this.addPoint(newP.x, newP.y, newP.name);
            }
            this.gettingPointsFromServer = true;
            this.sortPoints();
        },
        deleteFromUI: function(index) {
            let p = this.points[index];
            this.deletePoint(p.x, p.y);
            this.points.splice(index,1);
        },
        addFromUI: function() {
            let p = this.newPoint;
            console.log(p);
            this.addPoint(p.x, p.y, p.name,
                () => {
                    this.points.push(p);
                    this.sortPoints();
                    this.resetNewPoint();
                }
            );
        },
        resetNewPoint: function() {
            this.newPoint = {
                name : null,
                x : null,
                y : null,
            };
        },
        isInt: function(a) {
            return (typeof a==='number' && (a%1)===0);
        },
        say: function(str) {
            console.log(str);
        }
    }
});
