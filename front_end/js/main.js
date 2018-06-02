var app = new Vue({
    el: '#app',
    data: {
        version       : 0.1,
        loggedIn      : false,

        dialogShown   : false,
        wrongPasswordShown : false,
        loadingShown : true,

        processing : false,

        logToken      : "null",

        loginUser     : '',
        loginPassWord : '',

        points : [],
    },
    mounted: function() {
        this.getPoints();
        this.loadingShown = false;
    },
    methods: {
        openLoginDialog: function() {
            this.dialogShown = true;
        },
        editing: function() {
            this.wrongPasswordShown = false;
        },
        login: function() {
            this.say("login");
            this.processing = true;
            // get time token
            this.$http.get('/api/login').then(
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
        getPoints: function() {
            this.$http.get('/api/points', {
                headers : {
                    token: this.logToken
                }
            }).then(
                response => {
                    console.log(response.body);
                    this.points = response.body;
                },
                response => {
                    console.log("get points failed");
                }
            );
        },
        addPoint: function(x, y, name) {
            if ( this.isInt(x) && this.isInt(y) ) {
                this.$http.put('/api/points', {
                    token : this.logToken,
                    point : "(" + x + "," + y + ")",
                    name : name,
                    method : "add",
                }).then(
                    response => {
                        if (response.body === "ok" ) {
                            this.getPoints();
                            console.log("added");
                        }
                    },
                    response => {
                        console.log("failed");
                    }
                );
            }
        },
        deletePoint: function(x, y) {
            if (this.isInt(x) && this.isInt(y)) {
                // search
                let l = this.points.length;
                for (let i = 0; i < l; i++) {
                    if (this.points[i].x === x && this.points[i].y === y) {
                        this.$http.put('/api/points', {
                            token : this.logToken,
                            point : "(" + x + "," + y + ")",
                            method : "delete",
                        }).then(
                            response => {
                                this.getPoints();
                                console.log("deleted");
                            },
                            response => {
                                console.log("failed");
                            }
                        );
                    }
                }
            }
        },
        renamePoint: function(x, y, newName) {
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
                                    this.getPoints();
                                    console.log("added");
                                }
                            },
                            response => {
                                console.log("failed. " + response.body);
                            }
                        );
                        return;
                    }
                }
                console.log("no such point");
            }
        },
        isInt: function(a) {
            return (typeof a==='number' && (a%1)===0);
        },
        say: function(str) {
            console.log(str);
        }
    }
})
