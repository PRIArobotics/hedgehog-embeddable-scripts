var app = new Vue({
    el: '#hedgehog-embeddable',
    data: {
        code: 'print("Hello")'
    },
    methods: {
        runScript: function () {
            console.log(this.code);
        }
    }
});
