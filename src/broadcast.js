(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Global
        root.BBroadCast = factory(root.jQuery);
    }
}(typeof self !== 'undefined' ? self : this, function ($) {

    "use strict";

    var BBroadCast = function (channel, option = {}) {

        this.open = false;
        this.channelActive = channel;
        this.port = validateTextNotNull(option.port, option.port, "9000");
        this.ssl = validateTextNotNull(option.ssl, option.ssl === true ? "wss" : "ws", "ws");
        this.serverAddress = this.ssl +
            "://" + validateTextNotNull(option.serverAddress, option.serverAddress, "") +
            validateTextNotNull(option.serverAddress, ":" + this.port, "");
        this.channels = {};


        connect(this);
    }

    let connect = function (_this) {
        let self = _this;

        self.socket = new WebSocket(self.serverAddress + "?channel=" + self.channelActive);

        self.socket.onopen = (event) => {
            console.log('Connected to the server');
            self.open = true;
        }
        self.socket.onclose = (event) => {
            console.log('Disconnected from the server');
            self.open = false;
        }
        self.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const { channel, event: eventType, data: eventData } = data;

            let res_channel = self.channels[channel];
            let res_event = res_channel.events[eventType];

            let data_callback = {
                "channel": channel,
                "event": eventType
            };

            if (typeof eventData === 'string') {
                data_callback.message = eventData;
            } else if (typeof eventData === 'object' && eventData !== null) {
                Object.keys(eventData).forEach(key => {
                    data_callback[key] = eventData[key];
                });
            }

            if (res_channel && res_event) {
                res_event(data_callback);
            }
        }

    }
    /**
     * 
     * @param {string} channel 
     * @param {string} event 
     * @param {*} data 
     */
    BBroadCast.prototype.sendMessage = function (channel, event, data) {
        if (this.open) {
            this.socket.send(JSON.stringify({
                channel: channel,
                event: event,
                data: data
            }));
        }
    }

    BBroadCast.prototype.subscribe = function (channelName) {
        const channel = new Channel(this, channelName);
        this.channels[channelName] = channel;
        return channel;
    }

    /**
     * 
     * @param {string} value 
     * @param {string} value_if_true 
     * @param {string} value_if_false 
     */
    let validateTextNotNull = function (value, value_if_true, value_if_false) {
        if (value == undefined) {
            return value_if_false;
        } else if (value == null) {
            return value_if_false;
        }
        else if (value == "") {
            return value_if_false;
        }
        let res = value_if_true;
        return res;
    }


    class Channel {
        constructor(pusher, name) {
            this.pusher = pusher;
            this.name = name;
            this.events = {};
        }

        bind(eventType, callback) {
            this.events[eventType] = callback;
        }
    }


    return BBroadCast;
}));