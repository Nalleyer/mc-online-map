var app = new Vue({
    el: '#app',
    data: {
        version       : 0.1,
        loggedIn      : false,
        dialogShown   : false,
        logToken      : "null",
        timeToken     : "null",

        loginUser     : '',
        loginPassWord : '',
    },
    methods: {
        openLoginDialog: function() {
            this.dialogShown = true;
        },
        login: function() {
            // send request...
            this.loggedIn = true;
            this.closeLoginDialog();
        },
        logout: function() {
            this.loggedIn = false;
        },
        closeLoginDialog: function() {
            this.dialogShown = false;
        },
        dontClose: function(e) {
            console.log("click dialog");
            e.stopPropagation();
        }
    }
})
