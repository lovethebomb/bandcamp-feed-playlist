(function(window, document) {

    function FeedPlaylist() {
        if (!window.playerview) {
            console.error('[bandcampFeedPlaylist] player is not found.')
            return null;
        }

        // Observable
        this.playlist = window.playerview._playlist;
        this._state = this.playlist._state;
        this._track = this.playlist._track;
        this._position = this.playlist._position;
        this._duration = this.playlist._duration;
        this.handlerNextTrack = function() { return this.next() }.bind(this);
        this.handlerPreviousTrack = function() { return this.previous() }.bind(this);

        this.$trackPlayWaypoint = window.playerview._waypoints[0];

        if (this.$trackPlayWaypoint) {
            this.$el = this.injectHtml();
            this.$position = this.$el.querySelector('#track_play_waypoints_controls_position');
            this.$duration = this.$el.querySelector('#track_play_waypoints_controls_duration');

             this.observe();
            this.registerMediaKeys();
            console.debug('[bandcampFeedPlaylist] injected');
        }
    }

    // Observe changes
    FeedPlaylist.prototype.observe = function(e) {
        const self = this;
        const observers = [
            { 'obj': this.playlist, prop: '_track' },
            { 'obj': this.playlist, prop: '_state', callback: this.onStateUpdate.bind(this) },
            { 'obj': this.playlist, prop: '_duration', callback: this.updateDuration.bind(this) },
            { 'obj': this.playlist, prop: '_position', callback: this.updatePosition.bind(this) },
        ]

        observers.map(observer => {
            Object.defineProperty(observer.obj, observer.prop, {
                get: function() { return self[observer.prop]; },
                set: function(newValue) {
                    if (newValue === self[observer.prop]) { return }
                    self[observer.prop] = newValue;
                    if (typeof observer.callback == 'function') {
                        return observer.callback(newValue);
                    }
                    return newValue;
                }
            })
        })
    }


    // Methods
    FeedPlaylist.prototype.playpause = function(e) {
        if (e) {
            e.preventDefault();
        }
        return this.playlist.playpause();
    }

    FeedPlaylist.prototype.next = function(e) {
        if (e) {
            e.preventDefault();
        }
        return this.playlist.next_track()
    }

    FeedPlaylist.prototype.previous = function(e) {
        if (e) {
            e.preventDefault();
        }
        return this.playlist.prev_track();
    }

    FeedPlaylist.prototype.onStateUpdate = function(state) {
        // TODO: replace setTimeout
        if (state === "COMPLETED") {
            let timer = setTimeout(this.handlerNextTrack, 1000);
            timer = undefined;
        }
        return;
    }

    // DOM
    FeedPlaylist.prototype.updatePosition = function() {
        return this.$position.innerText = window.Time.timeStr(this._position)
    }

    FeedPlaylist.prototype.updateDuration = function() {
        return this.$duration.innerText = window.Time.timeStr(this._duration)
    }

    FeedPlaylist.prototype.injectHtml = function() {
        const container = document.createElement('div');
        container.id = "track_play_waypoint_controls";
        const infos = [
            { text: "0:00", id: "track_play_waypoints_controls_position" },
            { text: "/" },
            { text: "0:00", id: "track_play_waypoints_controls_duration" },
        ];
        const controls = [
            { text: 'Previous', action: this.previous.bind(this) },
            { text: 'Play/Pause', action: this.playpause.bind(this) },
            { text: 'Next', action: this.next.bind(this) }
        ];

        infos.map(info => {
            let element = document.createElement('span');
            if (info.id) {
                element.id = info.id;
            }
            element.innerText = info.text;
            container.appendChild(element);
        });

        controls.map(control => {
            let element = document.createElement('a');
            element.href = "#";
            element.innerText = control.text;
            element.addEventListener('click', control.action)
            container.appendChild(element);
        });

        return this.$trackPlayWaypoint.parentElement.appendChild(container);
    }

    // Support: Chrome Desktop 73+, Chrome Mobile 57+
    // https://www.chromestatus.com/feature/5639924124483584
    FeedPlaylist.prototype.registerMediaKeys = function() {
        if (!('mediaSession' in navigator)) {
            console.warn('[bandcampFeedPlaylist] MediaSession API not supported in this browser - https://www.chromestatus.com/feature/5639924124483584')
        }

        navigator.mediaSession.setActionHandler('previoustrack', this.handlerPreviousTrack)
        navigator.mediaSession.setActionHandler('nexttrack', this.handlerNextTrack)
    }

    console.debug('[bandcampFeedPlaylist] loaded');
    let feedPlaylist = new FeedPlaylist();
})(window, document);