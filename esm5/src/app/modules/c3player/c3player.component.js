/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Component, Input, ViewChild, ElementRef, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MathService } from '../../services/math.service';
import { KurentoService } from '../../services/kurento.service';
import { EventService } from '../../services/event.service';
import { EventType } from '../../models/event-type.enum';
import { NgxSpinnerService } from 'ngx-spinner';
import { ModalDialogService, SimpleModalComponent } from 'ngx-modal-dialog';
var C3playerComponent = /** @class */ (function () {
    function C3playerComponent(mathService, eventService, spinner, modalService, viewRef) {
        var _this = this;
        this.mathService = mathService;
        this.eventService = eventService;
        this.spinner = spinner;
        this.modalService = modalService;
        this.viewRef = viewRef;
        //milliseconds
        this.wantedTime = 0; //tooltip
        this.componentWidth = "100%";
        this.componentMargin = "auto";
        this.imgRelation = 5;
        eventService.Emitter.subscribe(function (event) {
            if (event) {
                switch (event.type) {
                    case EventType.LocalConnectionError: {
                        _this.spinner.hide();
                        _this.playing.next(false);
                        _this.displayErrorMessage("Error in connection");
                        break;
                    }
                    case EventType.RemotePlayStarted: {
                        _this.firstTime.next(false);
                        if (_this.playedTime > 0) {
                            _this.kurentoService.doSeekAt(_this.playedTime);
                        }
                        _this.playing.next(true);
                        _this.spinner.hide();
                        break;
                    }
                    case EventType.RemotePlayPaused: {
                        _this.spinner.hide();
                        _this.playing.next(false);
                        break;
                    }
                    case EventType.RemotePlayStopped: {
                        _this.spinner.hide();
                        _this.playedTime = 0;
                        _this.firstTime.next(true);
                        _this.playing.next(false);
                        break;
                    }
                    case EventType.RemotePlayEnded: {
                        _this.playing.next(false);
                        _this.playedTime = 0;
                        break;
                    }
                    case EventType.RemotePlaySeeked: {
                        _this.playedTime = event.value.seekTime;
                        _this.spinner.hide();
                        break;
                    }
                    case EventType.RemoteSeekFailed: {
                        _this.spinner.hide();
                        _this.playing.next(false);
                        _this.displayErrorMessage("Server error");
                        break;
                    }
                    case EventType.RemotePlayResumed: {
                        _this.spinner.hide();
                        _this.playing.next(true);
                        break;
                    }
                    case EventType.WebSocketFailed: {
                        _this.spinner.hide();
                        _this.displayErrorMessage("Connection to the server failed");
                        break;
                    }
                    case EventType.LocalAudioLevel: {
                        if (event.value && event.value.action) {
                            switch (event.value.action) {
                                case "mute": {
                                    _this.muted.next(true);
                                    break;
                                }
                                case "unmute": {
                                    _this.muted.next(false);
                                    break;
                                }
                                default: {
                                    console.error("Received unknown Local Audio Level event: %s", event.value.action);
                                }
                            }
                        }
                        else {
                            console.error("Received incorrect Local Audio Level event: %s", JSON.stringify(event));
                        }
                        break;
                    }
                    case EventType.LocalAudioLevelError: {
                        _this.displayErrorMessage("Error at audio control");
                        break;
                    }
                    case EventType.RemotePlayFailed: {
                        _this.spinner.hide();
                        _this.playing.next(false);
                        break;
                    }
                    case EventType.RemoteConnectionReset: {
                        _this.spinner.hide();
                        _this.firstTime.next(true);
                        _this.playing.next(false);
                        _this.playedTime = 0;
                    }
                    default: {
                        console.error("Unrecognized event type '%s'", event.type);
                    }
                }
            }
        });
    }
    /**
     * @return {?}
     */
    C3playerComponent.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        //Initializing global variables
        this.firstTime = new BehaviorSubject(true);
        this.wsConnected = new BehaviorSubject(false);
        this.muted = new BehaviorSubject(false);
        this.playedTime = 0;
        this.offset = Math.round(this.totalDuration / 100);
        if (this.offset < 1000) {
            this.offset = 1000;
        }
        if (this.offset > 4000) {
            this.offset = 4000;
        }
        this.playing = new BehaviorSubject(false);
        this.tooltipDisplay.nativeElement.style.display = "none";
        this.spinner.hide();
        //Play timer
        this._timer = timer(0, 100).pipe(filter(function () { return _this.playing.value === true; })).subscribe(function (t) {
            _this.playedTime += 100;
            if (_this.playedTime >= (_this.totalDuration + _this.offset)) {
                _this.stop();
            }
        });
        //Connection
        this.ws = new WebSocket(this.wsUrl);
        this.kurentoService = new KurentoService(this.ws, this.audioSource, this.video, this.eventService);
        //WebSocket event handling
        /** @type {?} */
        var context = this;
        this.ws.onopen = function (e) {
            console.log("C3player service: Connection established with Kurento");
            context.wsConnected.next(true);
        };
        this.ws.onclose = function (e) {
            _this.spinner.hide();
            console.log("C3Player service: Connection closed");
            context.wsConnected.next(false);
            context.stop();
        };
        this.ws.onerror = function (e) {
            _this.spinner.hide();
            console.error("An error has occured: %s", e);
            _this.displayErrorMessage("Connection with server failed");
            context.stop();
        };
        this.ws.onmessage = function (e) {
            console.log("Message received: " + e.data);
            /** @type {?} */
            var message = JSON.parse(e.data);
            switch (message.id) {
                case "playStarted": {
                    /** @type {?} */
                    var event_1 = { type: EventType.RemotePlayStarted, value: {} };
                    _this.eventService.Emitter.next(event_1);
                    break;
                }
                case "startResponse": {
                    console.log("Received start response");
                    context.kurentoService.processAnswer(message.sdpAnswer, function (error) {
                        if (error) {
                            console.error("Error processing response: %s", error);
                        }
                        else {
                            console.log("C3Player service: SDP response processed");
                        }
                    });
                    break;
                }
                case "error": {
                    console.error("Error in websocket: %s", message.message);
                    break;
                }
                case "playEnd": {
                    console.log("C3Player service: Play ended");
                    context.firstTime.next(true);
                    context.playing.next(false);
                    context.playedTime = 0;
                    break;
                }
                case "videoInfo": {
                    context.totalDuration = message.videoDuration;
                    break;
                }
                case "iceCandidate": {
                    context.kurentoService.addIceCandidate(message.candidate, function (error) {
                        if (error) {
                            console.error("Error adding candidate: %s", error);
                        }
                        else {
                            console.log("Added candidate %s", JSON.stringify(message.candidate));
                        }
                    });
                    break;
                }
                case "seek": {
                    console.log("C3Player service: Seek Done -> %s", message.message);
                    if (message.message !== "ok") {
                        _this.displayErrorMessage("An error has occured");
                    }
                    break;
                }
                case "position": {
                    context.playedTime = message.position;
                    break;
                }
                default: {
                    console.log("C3Player service: Unrecognized message received -> %s", message.id);
                }
            }
        };
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.ngAfterViewInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        setTimeout(function () {
            return _this.componentHeight = Math.round(_this.player.nativeElement.offsetWidth / _this.imgRelation) + "px";
        });
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._timer.unsubscribe();
        this.kurentoService.resetConnection();
        this.ws.close();
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getPlayedHours = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor(this.playedTime / 3600000));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getPlayedMinutes = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor(((this.playedTime / 1000) % 3600) / 60));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getPlayedSeconds = /**
     * @return {?}
     */
    function () {
        return this.mathService.padm((this.playedTime / 1000) % 60);
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getTotalHours = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor(this.totalDuration / 3600000));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getTotalMinutes = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor(((this.totalDuration / 1000) % 3600) / 60));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getTotalSeconds = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.round(this.totalDuration / 1000) % 60);
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getWantedHours = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor(this.wantedTime / 3600000));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getWantedMinutes = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor(((this.wantedTime / 1000) % 3600) / 60));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getWantedSeconds = /**
     * @return {?}
     */
    function () {
        return this.mathService.pad(Math.floor((this.wantedTime / 1000) % 60));
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.getSeekPosition = /**
     * @return {?}
     */
    function () {
        return Math.floor((this.playedTime / this.totalDuration) * this.player.nativeElement.offsetWidth);
    };
    /**
     * TODO implementar metodos
     */
    /**
     * TODO implementar metodos
     * @return {?}
     */
    C3playerComponent.prototype.play = /**
     * TODO implementar metodos
     * @return {?}
     */
    function () {
        if (this.playing.value === true) {
            //Pause the video
            this.kurentoService.pause();
        }
        else {
            if (this.firstTime.value === true) {
                //Play
                this.spinner.show();
                this.kurentoService.unmute();
                this.kurentoService.start(this.playedTime);
            }
            else {
                //Resume
                this.spinner.show();
                this.kurentoService.resume();
            }
        }
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.stop = /**
     * @return {?}
     */
    function () {
        if (this.wsConnected.value === true) {
            this.kurentoService.unmute();
            this.kurentoService.stop();
        }
        else {
            this.playedTime = 0;
            this.firstTime.next(true);
            this.playing.next(false);
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.seekClicked = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.seekReleased = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        //set playedTime and seekPosition
        this.spinner.show();
        /** @type {?} */
        var clicked = Math.floor(this.totalDuration * (event.offsetX / this.player.nativeElement.offsetWidth));
        this.kurentoService.doSeekAt(clicked);
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.seekDragged = /**
     * @return {?}
     */
    function () {
        console.log("Seek dragged");
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.onDragStart = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        console.log("Drag start");
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.onDragEnd = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        console.log("Drag end");
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.onMouseOverSeek = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        this.tooltipDisplay.nativeElement.style.display = "inline-block";
        this.tooltipDisplay.nativeElement.style.transform = "translate(" + event.offsetX + "px," + (15 + event.offsetY) + "px)";
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.onMouseExitSeek = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        this.tooltipDisplay.nativeElement.style.display = "none";
    };
    /**
     * @param {?} event
     * @return {?}
     */
    C3playerComponent.prototype.onMouseMoveSeek = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        this.wantedTime = Math.floor(this.totalDuration * (event.offsetX / this.player.nativeElement.offsetWidth));
        if (this.player.nativeElement.offsetWidth - event.offsetX <= 55) {
            this.tooltipDisplay.nativeElement.style.transform = "translate(" + (event.offsetX - 55) + "px," + (15 + event.offsetY) + "px)";
        }
        else {
            this.tooltipDisplay.nativeElement.style.transform = "translate(" + event.offsetX + "px," + (15 + event.offsetY) + "px)";
        }
    };
    /**
     * @param {?} error
     * @return {?}
     */
    C3playerComponent.prototype.displayErrorMessage = /**
     * @param {?} error
     * @return {?}
     */
    function (error) {
        this.modalService.openDialog(this.viewRef, {
            title: 'Error',
            childComponent: SimpleModalComponent,
            data: {
                text: "Error occured while playing the audio: <strong>" + error + "</strong>"
            },
            settings: {
                closeButtonClass: 'close theme-icon-close',
                headerTitleClass: "text-danger"
            },
            actionButtons: [
                {
                    text: 'Close',
                    buttonClass: "btn btn-default",
                    onAction: function () { return new Promise(function (resolve) {
                        resolve();
                    }); }
                }
            ]
        });
    };
    /**
     * @return {?}
     */
    C3playerComponent.prototype.switchSound = /**
     * @return {?}
     */
    function () {
        if (this.muted.value === true) {
            this.kurentoService.unmute();
        }
        else {
            this.kurentoService.mute();
        }
    };
    C3playerComponent.decorators = [
        { type: Component, args: [{
                    selector: 'c3-player',
                    template: "<div class=\"player jquery-trackswitch\" [style.width]=\"componentWidth\" [style.margin]=\"componentMargin\" #c3player>\n    <div class=\"main-control\">\n        <div class=\"seekable-img-wrap\" style=\"display: block;\">\n            <div class=\"seekable\" data-seek-margin-left=\"0\" data-seek-margin-right=\"0\" [style.background]=\"'url('+imageSource+')'\" [style.background-size]=\"'contain'\" [style.background-repeat]=\"'no-repeat'\" [style.height]=\"componentHeight\" [style.width]=\"'auto'\">\n                <div class=\"inner\" [style.background]=\"'url('+imageSource+')'\" [style.background-size]=\"'cover'\" [style.height]=\"componentHeight\" [style.width]=\"getSeekPosition()+'px'\"></div>\n                <svg>\n                    <filter id=\"blue-wash\">\n                    <feColorMatrix type=\"matrix\" values=\"0 1.0 0 0 0 -0.2 1.0 0 0 0 0 0.6 1 0 0 0 0 0 1 0\"/>\n                    </filter>\n                </svg>\n            </div>\n            <div class=\"seekwrap seekwrap-custom\"  \n                (mousedown)=\"seekClicked($event)\" \n                (mouseup)=\"seekReleased($event)\" \n                (mouseover)=\"onMouseOverSeek($event)\" \n                (mouseout)=\"onMouseExitSeek($event)\"\n                (mousemove)=\"onMouseMoveSeek($event)\">\n                <div class=\"seekhead\" [style.transform]=\"'translate('+getSeekPosition()+'px,0px)'\" #seekbar>\n                </div>\n                <span class=\"seek-tooltip\" #tooltipDisplay [style.padding]=\"'3px'\" [style.border-radius]=\"'1px'\">{{getWantedHours()}}:{{getWantedMinutes()}}:{{getWantedSeconds()}}</span>\n            </div>\n            <div style=\"display: none;\">\n                <audio id=\"gum-local\" controls autoplay #videoelement></audio>\n            </div>\n        </div>\n        <ul class=\"control\">\n            <li class=\"playpause {{playing.value ? 'checked':'' }} button\" (click)=\"play()\">Play</li>\n            <li class=\"stop button\" (click)=\"stop()\">Stop</li>\n            <li class=\"volume {{muted.value ? 'checked':'' }} button\" (click)=\"switchSound()\">Sound</li>\n            <li class=\"timing\"><span class=\"time\">{{getPlayedHours()}}:{{getPlayedMinutes()}}:{{getPlayedSeconds()}}</span> / <span class=\"length\">{{getTotalHours()}}:{{getTotalMinutes()}}:{{getTotalSeconds()}}</span></li>\n            <li class=\"seekwrap\" style=\"display: none;\">\n                <div class=\"seekbar\">\n                    <div class=\"seekhead\"></div>\n                </div>\n            </li>\n        </ul>\n        <ngx-spinner></ngx-spinner>\n    </div>\n</div>\n",
                    styles: ["html{position:relative;min-height:100%}body{padding-top:40px}.seekwrap-custom{left:0;right:0}.inner{position:absolute;left:0;-webkit-filter:url(#blue-wash);filter:url(#blue-wash)}.seek-tooltip{background-color:#000;margin:0 auto;color:#eee;font-size:15px;font-family:'Lucida Sans','Lucida Sans Regular','Lucida Grande','Lucida Sans Unicode',Geneva,Verdana,sans-serif}.hidden-video{display:none}#console,video{display:block;font-size:14px;line-height:1.42857143;color:#555;background-color:#fff;background-image:none;border:1px solid #ccc;border-radius:4px;box-shadow:inset 0 1px 1px rgba(0,0,0,.075);transition:border-color .15s ease-in-out,box-shadow .15s ease-in-out}#console{overflow-y:auto;width:100%;height:175px}#videoContainer{position:absolute;float:left}#videoBig{width:640px;height:480px;top:0;left:0;z-index:1}div#videoSmall{width:240px;height:180px;padding:0;position:absolute;top:15px;left:400px;cursor:pointer;z-index:10}div.dragged{cursor:all-scroll!important;border-color:#00f!important;z-index:10!important}.jquery-trackswitch a,.jquery-trackswitch abbr,.jquery-trackswitch acronym,.jquery-trackswitch address,.jquery-trackswitch applet,.jquery-trackswitch article,.jquery-trackswitch aside,.jquery-trackswitch audio,.jquery-trackswitch b,.jquery-trackswitch big,.jquery-trackswitch blockquote,.jquery-trackswitch canvas,.jquery-trackswitch caption,.jquery-trackswitch center,.jquery-trackswitch cite,.jquery-trackswitch code,.jquery-trackswitch dd,.jquery-trackswitch del,.jquery-trackswitch details,.jquery-trackswitch dfn,.jquery-trackswitch div,.jquery-trackswitch dl,.jquery-trackswitch dt,.jquery-trackswitch em,.jquery-trackswitch embed,.jquery-trackswitch fieldset,.jquery-trackswitch figcaption,.jquery-trackswitch figure,.jquery-trackswitch footer,.jquery-trackswitch form,.jquery-trackswitch h1,.jquery-trackswitch h2,.jquery-trackswitch h3,.jquery-trackswitch h4,.jquery-trackswitch h5,.jquery-trackswitch h6,.jquery-trackswitch header,.jquery-trackswitch hgroup,.jquery-trackswitch i,.jquery-trackswitch iframe,.jquery-trackswitch img,.jquery-trackswitch ins,.jquery-trackswitch kbd,.jquery-trackswitch label,.jquery-trackswitch legend,.jquery-trackswitch li,.jquery-trackswitch mark,.jquery-trackswitch menu,.jquery-trackswitch nav,.jquery-trackswitch object,.jquery-trackswitch ol,.jquery-trackswitch output,.jquery-trackswitch p,.jquery-trackswitch pre,.jquery-trackswitch q,.jquery-trackswitch ruby,.jquery-trackswitch s,.jquery-trackswitch samp,.jquery-trackswitch section,.jquery-trackswitch small,.jquery-trackswitch span,.jquery-trackswitch strike,.jquery-trackswitch strong,.jquery-trackswitch sub,.jquery-trackswitch summary,.jquery-trackswitch sup,.jquery-trackswitch table,.jquery-trackswitch tbody,.jquery-trackswitch td,.jquery-trackswitch tfoot,.jquery-trackswitch th,.jquery-trackswitch thead,.jquery-trackswitch time,.jquery-trackswitch tr,.jquery-trackswitch tt,.jquery-trackswitch u,.jquery-trackswitch ul,.jquery-trackswitch var,.jquery-trackswitch video{margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline}.jquery-trackswitch article,.jquery-trackswitch aside,.jquery-trackswitch details,.jquery-trackswitch figcaption,.jquery-trackswitch figure,.jquery-trackswitch footer,.jquery-trackswitch header,.jquery-trackswitch hgroup,.jquery-trackswitch menu,.jquery-trackswitch nav,.jquery-trackswitch section{display:block}.jquery-trackswitch ol,.jquery-trackswitch ul{list-style:none}.jquery-trackswitch blockquote,.jquery-trackswitch q{quotes:none}.jquery-trackswitch blockquote:after,.jquery-trackswitch blockquote:before,.jquery-trackswitch q:after,.jquery-trackswitch q:before{content:'';content:none}.jquery-trackswitch table{border-collapse:collapse;border-spacing:0}.jquery-trackswitch *,.jquery-trackswitch :after,.jquery-trackswitch :before{box-sizing:border-box}.jquery-trackswitch{background:#eee;position:relative;margin:10px;overflow:hidden;color:#000;line-height:1}.jquery-trackswitch ts-track{display:none}.jquery-trackswitch ul{margin:0;padding:0}.jquery-trackswitch li{margin:0;padding:0;list-style:none}.jquery-trackswitch .control li.button:after,.jquery-trackswitch .overlay span:after,.jquery-trackswitch li.track.error:before{content:\"\";display:block;font-family:FontAwesome;font-style:normal;font-weight:400;font-size:16px;line-height:1;text-indent:0}.jquery-trackswitch .overlay{background-color:rgba(0,0,0,.3);position:absolute;top:0;right:0;bottom:0;left:0;z-index:10}.jquery-trackswitch .overlay #overlayinfo span.info,.jquery-trackswitch .overlay>p,.jquery-trackswitch .overlay>span{display:block;position:absolute;text-align:center}.jquery-trackswitch .overlay>span{background-color:#f1c40f;width:50px;height:50px;top:calc(50% - 25px);left:calc(50% - 25px);text-indent:-9999px;line-height:0;border-radius:100%;cursor:pointer}.jquery-trackswitch .overlay>span.loading{cursor:inherit}.jquery-trackswitch .overlay>span:after{content:\"\\f011\";padding-top:7px;font-size:28pt}.jquery-trackswitch .overlay>span.loading:after{content:\"\\f110\"}.jquery-trackswitch.error .overlay{background:rgba(0,0,0,.6)}.jquery-trackswitch.error .overlay>span{background:#c03328;cursor:inherit}.jquery-trackswitch.error .overlay>span:after{content:\"\\f12a\"}.jquery-trackswitch.error .overlay p{width:100%;top:calc(50% + 35px);color:#fff}.jquery-trackswitch .overlay #overlayinfo{height:40px;width:100%;bottom:5px;right:10px;color:#000;text-align:right;font-size:14pt}.jquery-trackswitch .overlay #overlayinfo span.info{bottom:0;right:0;width:380px;cursor:pointer;text-indent:-9999px;opacity:.4}.jquery-trackswitch .overlay #overlayinfo span.info:after{content:\"\\f05a\";position:absolute;bottom:0;right:0;font-size:16pt}.jquery-trackswitch .overlay #overlayinfo span.text{display:none;position:absolute;right:0}.jquery-trackswitch .overlay #overlayinfo span.text strong{font-weight:700}.jquery-trackswitch .overlay #overlayinfo a{color:#eee;text-decoration:underline}.jquery-trackswitch .main-control ul{background-color:#333;height:auto;min-height:36px;padding:4px 12px;overflow:hidden;color:#ddd}.jquery-trackswitch .main-control .button{float:left;width:15px;margin:7px 10px 0 0;cursor:pointer}.jquery-trackswitch .main-control .timing{float:right;font-family:monospace;margin:7px 0 0 10px}.jquery-trackswitch .main-control .seekwrap{overflow:hidden;height:100%;cursor:pointer}.jquery-trackswitch .main-control .seekwrap .seekbar{background-color:#ed8c01;height:6px;margin:11px 4px 0 0;position:relative;box-shadow:4px 0 0 0 #ed8c01}.jquery-trackswitch .main-control .seekwrap .seekbar .seekhead{background-color:#ed8c01;position:absolute;width:4px;height:22px;top:-8px;left:0}.jquery-trackswitch>p{margin:12px 10px}.jquery-trackswitch img{max-width:100%;display:block;margin:0;padding:0}.jquery-trackswitch .seekable-img-wrap{display:inline-block;position:relative}.jquery-trackswitch .seekable-img-wrap .seekwrap{position:absolute;top:0;right:0;bottom:0;left:0;cursor:pointer}.jquery-trackswitch .seekable-img-wrap .seekwrap .seekhead{position:absolute;top:0;bottom:0;border-left:2px solid #000;border-right:2px solid #fff}.jquery-trackswitch ul.track_list{padding:0}.jquery-trackswitch li.track{background-color:#ddd;position:relative;min-height:32px;padding:8px 10px 8px 60px}.jquery-trackswitch li.track.tabs{display:inline-block;padding-right:12px;border:1px solid #999}.jquery-trackswitch li.track:not(.tabs):nth-child(even){background-color:#eee}.jquery-trackswitch li.track.error{background-color:#dd9b9b!important}.jquery-trackswitch li.track.error:before{content:\"\\f071  ERROR\";display:inline;padding-right:10px;color:#7c2525;cursor:inherit}.jquery-trackswitch li.track ul.control{position:absolute;top:calc(50% - 14px);left:5px;padding-left:2px}.jquery-trackswitch li.track ul.control li{display:inline-block;width:24px;height:24px;text-align:center}.jquery-trackswitch .control li.button{position:relative;text-indent:-9999px;line-height:0;cursor:pointer}.jquery-trackswitch .control li.button:after{position:absolute;top:0}.jquery-trackswitch .control li.playpause:after{content:\"\\f04b\"}.jquery-trackswitch .control li.playpause.checked:after{content:\"\\f04c\"}.jquery-trackswitch .control li.volume:after{content:\"\\f028\"}.jquery-trackswitch .control li.volume.checked:after{content:\"\\f026\"}.jquery-trackswitch .control li.stop:after{content:\"\\f04d\"}.jquery-trackswitch .control li.repeat:after{content:\"\\f01e\";opacity:.5}.jquery-trackswitch .control li.repeat.checked:after{opacity:1}.jquery-trackswitch .control li.mute:after{content:\"\\f028\";position:absolute;bottom:50%;left:4px}.jquery-trackswitch .control li.mute.checked:after{content:\"\\f026\"}.jquery-trackswitch .control li.solo:after{content:\"\\f10c\";position:absolute;bottom:50%;left:4px}.jquery-trackswitch .control li.solo.checked:after{content:\"\\f05d\"}.jquery-trackswitch .control li.solo.radio{margin:0}.jquery-trackswitch .control li.solo.radio.checked:after{content:\"\\f192\"}@media (max-width:767px){.jquery-trackswitch .overlay span{width:70px;height:70px;top:calc(50% - 35px);left:calc(50% - 35px);line-height:10px}.jquery-trackswitch .overlay span:after{padding-top:3px;font-size:36pt}.jquery-trackswitch.error .overlay p{top:calc(50% + 45px)}.jquery-trackswitch .control li.button:after{font-size:23px}.jquery-trackswitch .main-control .button{margin:4px 22px 0 0}.jquery-trackswitch .main-control .seekwrap{width:100%;margin-top:30px}.jquery-trackswitch li.track{padding-left:80px}.jquery-trackswitch li.track ul.control{top:calc(50% - 19px)}.jquery-trackswitch .track .control li.button{margin:0 10px 0 0}.jquery-trackswitch .control li.mute:after,.jquery-trackswitch .control li.solo:after{padding-top:0;bottom:35%}}@media (max-width:400px){.jquery-trackswitch .main-control{text-align:center}.jquery-trackswitch .main-control .button{float:none;display:inline-block;margin:0 14px}.jquery-trackswitch .main-control .timing{width:100%;float:none;margin:32px 0 8px}.jquery-trackswitch .main-control .seekwrap{margin-top:8px}}"]
                }] }
    ];
    /** @nocollapse */
    C3playerComponent.ctorParameters = function () { return [
        { type: MathService },
        { type: EventService },
        { type: NgxSpinnerService },
        { type: ModalDialogService },
        { type: ViewContainerRef }
    ]; };
    C3playerComponent.propDecorators = {
        tooltipDisplay: [{ type: ViewChild, args: ['tooltipDisplay',] }],
        player: [{ type: ViewChild, args: ['c3player',] }],
        video: [{ type: ViewChild, args: ['videoelement',] }],
        imageSource: [{ type: Input, args: ['image',] }],
        audioSource: [{ type: Input, args: ['audio',] }],
        wsUrl: [{ type: Input, args: ['wsUrl',] }],
        totalDuration: [{ type: Input, args: ['duration',] }],
        componentWidth: [{ type: Input, args: ['width',] }],
        componentMargin: [{ type: Input, args: ['margin',] }],
        imgRelation: [{ type: Input, args: ['img-dim',] }]
    };
    return C3playerComponent;
}());
export { C3playerComponent };
if (false) {
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.ws;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.kurentoService;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype._timer;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.offset;
    /** @type {?} */
    C3playerComponent.prototype.playing;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.wsConnected;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.playedTime;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.wantedTime;
    /** @type {?} */
    C3playerComponent.prototype.tooltipDisplay;
    /** @type {?} */
    C3playerComponent.prototype.player;
    /** @type {?} */
    C3playerComponent.prototype.video;
    /** @type {?} */
    C3playerComponent.prototype.imageSource;
    /** @type {?} */
    C3playerComponent.prototype.audioSource;
    /** @type {?} */
    C3playerComponent.prototype.wsUrl;
    /** @type {?} */
    C3playerComponent.prototype.totalDuration;
    /** @type {?} */
    C3playerComponent.prototype.componentWidth;
    /** @type {?} */
    C3playerComponent.prototype.componentMargin;
    /** @type {?} */
    C3playerComponent.prototype.imgRelation;
    /** @type {?} */
    C3playerComponent.prototype.muted;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.firstTime;
    /** @type {?} */
    C3playerComponent.prototype.componentHeight;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.mathService;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.eventService;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.spinner;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.modalService;
    /**
     * @type {?}
     * @private
     */
    C3playerComponent.prototype.viewRef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYzNwbGF5ZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vYzMtcGxheWVyLyIsInNvdXJjZXMiOlsic3JjL2FwcC9tb2R1bGVzL2MzcGxheWVyL2MzcGxheWVyLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQXFCLFNBQVMsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQWdCLE1BQU0sZUFBZSxDQUFDO0FBRTNILE9BQU8sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDMUQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ2hFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUU1RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDekQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ2hELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRTVFO0lBZ0RFLDJCQUFvQixXQUF3QixFQUFVLFlBQTBCLEVBQVUsT0FBMEIsRUFDaEcsWUFBZ0MsRUFBVSxPQUF5QjtRQUR2RixpQkFtR0M7UUFuR21CLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBQVUsaUJBQVksR0FBWixZQUFZLENBQWM7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFtQjtRQUNoRyxpQkFBWSxHQUFaLFlBQVksQ0FBb0I7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFrQjs7UUE1Qi9FLGVBQVUsR0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTO1FBZ0J6QyxtQkFBYyxHQUFXLE1BQU0sQ0FBQztRQUVo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QixTQUFTLFNBQUMsY0FBYzs4QkFHeEIsS0FBSyxTQUFDLE9BQU87OEJBRWIsS0FBSyxTQUFDLE9BQU87d0JBRWIsS0FBSyxTQUFDLE9BQU87Z0NBRWIsS0FBSyxTQUFDLFVBQVU7aUNBRWhCLEtBQUssU0FBQyxPQUFPO2tDQUViLEtBQUssU0FBQyxRQUFROzhCQUVkLEtBQUssU0FBQyxTQUFTOztJQXNYbEIsd0JBQUM7Q0FBQSxBQTlaRCxJQThaQztTQXpaWSxpQkFBaUI7Ozs7OztJQUU1QiwrQkFBc0I7Ozs7O0lBR3RCLDJDQUF1Qzs7Ozs7SUFHdkMsbUNBQTZCOzs7OztJQUM3QixtQ0FBdUI7O0lBR3ZCLG9DQUFrQzs7Ozs7SUFDbEMsd0NBQThDOzs7OztJQUU5Qyx1Q0FBMkI7Ozs7O0lBQzNCLHVDQUErQjs7SUFFL0IsMkNBQXdEOztJQUN4RCxtQ0FBMEM7O0lBQzFDLGtDQUE2Qzs7SUFHN0Msd0NBQ29COztJQUNwQix3Q0FDb0I7O0lBQ3BCLGtDQUNjOztJQUNkLDBDQUNzQjs7SUFDdEIsMkNBQ2dDOztJQUNoQyw0Q0FDaUM7O0lBQ2pDLHdDQUN3Qjs7SUFFeEIsa0NBQWdDOzs7OztJQUVoQyxzQ0FBNEM7O0lBQzVDLDRDQUF3Qjs7Ozs7SUFFWix3Q0FBZ0M7Ozs7O0lBQUUseUNBQWtDOzs7OztJQUFFLG9DQUFrQzs7Ozs7SUFDeEcseUNBQXdDOzs7OztJQUFFLG9DQUFpQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCwgT25EZXN0cm95LCBWaWV3Q2hpbGQsIEVsZW1lbnRSZWYsIFZpZXdDb250YWluZXJSZWYsIEFmdGVyVmlld0luaXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QsIHRpbWVyLCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgTWF0aFNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tYXRoLnNlcnZpY2UnO1xuaW1wb3J0IHsgS3VyZW50b1NlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9rdXJlbnRvLnNlcnZpY2UnO1xuaW1wb3J0IHsgRXZlbnRTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvZXZlbnQuc2VydmljZSc7XG5pbXBvcnQgeyBDM2V2ZW50IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2MzZXZlbnQnO1xuaW1wb3J0IHsgRXZlbnRUeXBlIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2V2ZW50LXR5cGUuZW51bSc7XG5pbXBvcnQgeyBOZ3hTcGlubmVyU2VydmljZSB9IGZyb20gJ25neC1zcGlubmVyJztcbmltcG9ydCB7IE1vZGFsRGlhbG9nU2VydmljZSwgU2ltcGxlTW9kYWxDb21wb25lbnQgfSBmcm9tICduZ3gtbW9kYWwtZGlhbG9nJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnYzMtcGxheWVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2MzcGxheWVyLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vYzNwbGF5ZXIuY29tcG9uZW50LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIEMzcGxheWVyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIEFmdGVyVmlld0luaXR7XG5cbiAgcHJpdmF0ZSB3czogV2ViU29ja2V0O1xuXG4gIC8vS3VyZW50byBzZXJ2aWNlXG4gIHByaXZhdGUga3VyZW50b1NlcnZpY2U6IEt1cmVudG9TZXJ2aWNlO1xuXG4gIC8vdGltZXIgZm9yIHBsYXkgdGltZVxuICBwcml2YXRlIF90aW1lcjogU3Vic2NyaXB0aW9uO1xuICBwcml2YXRlIG9mZnNldDogbnVtYmVyOyAvL21heCBkaWZmZXJlbmNlIGJldHdlZW4gcmVtb3RlIGFuZCBsb2NhbCBwbGF5XG5cbiAgLy9oYW5kbGUgaWYgY29tcG9uZW50IGlzIHBsYXlpbmdcbiAgcGxheWluZzogQmVoYXZpb3JTdWJqZWN0PGJvb2xlYW4+O1xuICBwcml2YXRlIHdzQ29ubmVjdGVkOiBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj47XG5cbiAgcHJpdmF0ZSBwbGF5ZWRUaW1lOiBudW1iZXI7IC8vbWlsbGlzZWNvbmRzXG4gIHByaXZhdGUgd2FudGVkVGltZTogbnVtYmVyID0gMDsgLy90b29sdGlwXG5cbiAgQFZpZXdDaGlsZCgndG9vbHRpcERpc3BsYXknKSB0b29sdGlwRGlzcGxheTogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnYzNwbGF5ZXInKSBwbGF5ZXI6IEVsZW1lbnRSZWY7IFxuICBAVmlld0NoaWxkKCd2aWRlb2VsZW1lbnQnKSB2aWRlbzogRWxlbWVudFJlZjtcblxuICAvL1xuICBASW5wdXQoJ2ltYWdlJylcbiAgaW1hZ2VTb3VyY2U6IHN0cmluZzsgXG4gIEBJbnB1dCgnYXVkaW8nKVxuICBhdWRpb1NvdXJjZTogc3RyaW5nO1xuICBASW5wdXQoJ3dzVXJsJylcbiAgd3NVcmw6IHN0cmluZztcbiAgQElucHV0KCdkdXJhdGlvbicpXG4gIHRvdGFsRHVyYXRpb246IG51bWJlcjtcbiAgQElucHV0KCd3aWR0aCcpXG4gIGNvbXBvbmVudFdpZHRoOiBzdHJpbmcgPSBcIjEwMCVcIjtcbiAgQElucHV0KCdtYXJnaW4nKVxuICBjb21wb25lbnRNYXJnaW46IHN0cmluZyA9IFwiYXV0b1wiOyBcbiAgQElucHV0KCdpbWctZGltJylcbiAgaW1nUmVsYXRpb246IG51bWJlciA9IDU7XG5cbiAgbXV0ZWQ6IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPjtcblxuICBwcml2YXRlIGZpcnN0VGltZTogQmVoYXZpb3JTdWJqZWN0PGJvb2xlYW4+O1xuICBjb21wb25lbnRIZWlnaHQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1hdGhTZXJ2aWNlOiBNYXRoU2VydmljZSwgcHJpdmF0ZSBldmVudFNlcnZpY2U6IEV2ZW50U2VydmljZSwgcHJpdmF0ZSBzcGlubmVyOiBOZ3hTcGlubmVyU2VydmljZSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBtb2RhbFNlcnZpY2U6IE1vZGFsRGlhbG9nU2VydmljZSwgcHJpdmF0ZSB2aWV3UmVmOiBWaWV3Q29udGFpbmVyUmVmKXtcbiAgICBldmVudFNlcnZpY2UuRW1pdHRlci5zdWJzY3JpYmUoKGV2ZW50OiBDM2V2ZW50KSA9PiB7XG4gICAgICBpZihldmVudCl7XG4gICAgICAgIHN3aXRjaChldmVudC50eXBlKXtcbiAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5Mb2NhbENvbm5lY3Rpb25FcnJvcjoge1xuICAgICAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheUVycm9yTWVzc2FnZShcIkVycm9yIGluIGNvbm5lY3Rpb25cIik7XG4gICAgICAgICAgICBicmVhazsgXG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLlJlbW90ZVBsYXlTdGFydGVkOiB7XG4gICAgICAgICAgICB0aGlzLmZpcnN0VGltZS5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgIGlmKHRoaXMucGxheWVkVGltZSA+IDApe1xuICAgICAgICAgICAgICB0aGlzLmt1cmVudG9TZXJ2aWNlLmRvU2Vla0F0KHRoaXMucGxheWVkVGltZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBsYXlpbmcubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBFdmVudFR5cGUuUmVtb3RlUGxheVBhdXNlZDoge1xuICAgICAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5SZW1vdGVQbGF5U3RvcHBlZDoge1xuICAgICAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWVkVGltZSA9IDA7XG4gICAgICAgICAgICB0aGlzLmZpcnN0VGltZS5uZXh0KHRydWUpO1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLlJlbW90ZVBsYXlFbmRlZDoge1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZWRUaW1lID0gMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5SZW1vdGVQbGF5U2Vla2VkOiB7XG4gICAgICAgICAgICB0aGlzLnBsYXllZFRpbWUgPSBldmVudC52YWx1ZS5zZWVrVGltZTtcbiAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBFdmVudFR5cGUuUmVtb3RlU2Vla0ZhaWxlZDoge1xuICAgICAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheUVycm9yTWVzc2FnZShcIlNlcnZlciBlcnJvclwiKTtcbiAgICAgICAgICAgIGJyZWFrOyBcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBFdmVudFR5cGUuUmVtb3RlUGxheVJlc3VtZWQ6IHtcbiAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLnBsYXlpbmcubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5XZWJTb2NrZXRGYWlsZWQ6IHtcbiAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlFcnJvck1lc3NhZ2UoXCJDb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIgZmFpbGVkXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLkxvY2FsQXVkaW9MZXZlbDoge1xuICAgICAgICAgICAgaWYoZXZlbnQudmFsdWUgJiYgZXZlbnQudmFsdWUuYWN0aW9uKXtcbiAgICAgICAgICAgICAgc3dpdGNoKGV2ZW50LnZhbHVlLmFjdGlvbil7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm11dGVcIjp7XG4gICAgICAgICAgICAgICAgICB0aGlzLm11dGVkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBcInVubXV0ZVwiOntcbiAgICAgICAgICAgICAgICAgIHRoaXMubXV0ZWQubmV4dChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmYXVsdDp7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVjZWl2ZWQgdW5rbm93biBMb2NhbCBBdWRpbyBMZXZlbCBldmVudDogJXNcIiwgZXZlbnQudmFsdWUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVjZWl2ZWQgaW5jb3JyZWN0IExvY2FsIEF1ZGlvIExldmVsIGV2ZW50OiAlc1wiLCBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLkxvY2FsQXVkaW9MZXZlbEVycm9yOntcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheUVycm9yTWVzc2FnZShcIkVycm9yIGF0IGF1ZGlvIGNvbnRyb2xcIik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBFdmVudFR5cGUuUmVtb3RlUGxheUZhaWxlZDoge1xuICAgICAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5SZW1vdGVDb25uZWN0aW9uUmVzZXQ6IHtcbiAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLmZpcnN0VGltZS5uZXh0KHRydWUpO1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZWRUaW1lID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVucmVjb2duaXplZCBldmVudCB0eXBlICclcydcIiwgZXZlbnQudHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IFxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgLy9Jbml0aWFsaXppbmcgZ2xvYmFsIHZhcmlhYmxlc1xuICAgIHRoaXMuZmlyc3RUaW1lID0gbmV3IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPih0cnVlKTtcbiAgICB0aGlzLndzQ29ubmVjdGVkID0gbmV3IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPihmYWxzZSk7XG4gICAgdGhpcy5tdXRlZCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4oZmFsc2UpO1xuICAgIHRoaXMucGxheWVkVGltZSA9IDA7XG4gICAgdGhpcy5vZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMudG90YWxEdXJhdGlvbiAvIDEwMCk7XG4gICAgaWYodGhpcy5vZmZzZXQgPCAxMDAwKXtcbiAgICAgIHRoaXMub2Zmc2V0ID0gMTAwMDtcbiAgICB9XG4gICAgaWYodGhpcy5vZmZzZXQgPiA0MDAwKXtcbiAgICAgIHRoaXMub2Zmc2V0ID0gNDAwMDtcbiAgICB9XG4gICAgdGhpcy5wbGF5aW5nID0gbmV3IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPihmYWxzZSk7XG4gICAgdGhpcy50b29sdGlwRGlzcGxheS5uYXRpdmVFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB0aGlzLnNwaW5uZXIuaGlkZSgpO1xuXG4gICAgLy9QbGF5IHRpbWVyXG4gICAgdGhpcy5fdGltZXIgPSB0aW1lcigwLDEwMCkucGlwZShmaWx0ZXIoKCkgPT4gdGhpcy5wbGF5aW5nLnZhbHVlID09PSB0cnVlKSkuc3Vic2NyaWJlKHQgPT4ge1xuICAgICAgdGhpcy5wbGF5ZWRUaW1lICs9IDEwMDtcbiAgICAgIGlmKHRoaXMucGxheWVkVGltZSA+PSAodGhpcy50b3RhbER1cmF0aW9uICsgdGhpcy5vZmZzZXQpKXtcbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgLy9Db25uZWN0aW9uXG4gICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy53c1VybCk7XG4gICAgdGhpcy5rdXJlbnRvU2VydmljZSA9IG5ldyBLdXJlbnRvU2VydmljZSh0aGlzLndzLCB0aGlzLmF1ZGlvU291cmNlLCB0aGlzLnZpZGVvLCB0aGlzLmV2ZW50U2VydmljZSk7XG5cbiAgICAvL1dlYlNvY2tldCBldmVudCBoYW5kbGluZ1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzO1xuICAgIHRoaXMud3Mub25vcGVuID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcIkMzcGxheWVyIHNlcnZpY2U6IENvbm5lY3Rpb24gZXN0YWJsaXNoZWQgd2l0aCBLdXJlbnRvXCIpO1xuICAgICAgY29udGV4dC53c0Nvbm5lY3RlZC5uZXh0KHRydWUpO1xuICAgIH1cbiAgICB0aGlzLndzLm9uY2xvc2UgPSAoZTogQ2xvc2VFdmVudCkgPT4ge1xuICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiQzNQbGF5ZXIgc2VydmljZTogQ29ubmVjdGlvbiBjbG9zZWRcIik7XG4gICAgICBjb250ZXh0LndzQ29ubmVjdGVkLm5leHQoZmFsc2UpO1xuICAgICAgY29udGV4dC5zdG9wKCk7XG4gICAgfVxuICAgIHRoaXMud3Mub25lcnJvciA9IChlOiBFdmVudCkgPT4ge1xuICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBbiBlcnJvciBoYXMgb2NjdXJlZDogJXNcIiwgZSk7XG4gICAgICB0aGlzLmRpc3BsYXlFcnJvck1lc3NhZ2UoXCJDb25uZWN0aW9uIHdpdGggc2VydmVyIGZhaWxlZFwiKTtcbiAgICAgIGNvbnRleHQuc3RvcCgpO1xuICAgIH1cbiAgICB0aGlzLndzLm9ubWVzc2FnZSA9IChlOiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiTWVzc2FnZSByZWNlaXZlZDogXCIrZS5kYXRhKTtcbiAgICAgIGxldCBtZXNzYWdlID0gSlNPTi5wYXJzZShlLmRhdGEpO1xuICAgICAgc3dpdGNoKG1lc3NhZ2UuaWQpe1xuICAgICAgICBjYXNlIFwicGxheVN0YXJ0ZWRcIjp7XG4gICAgICAgICAgbGV0IGV2ZW50IDogQzNldmVudCA9IHt0eXBlOiBFdmVudFR5cGUuUmVtb3RlUGxheVN0YXJ0ZWQsIHZhbHVlOiB7fX07XG4gICAgICAgICAgdGhpcy5ldmVudFNlcnZpY2UuRW1pdHRlci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic3RhcnRSZXNwb25zZVwiOiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJSZWNlaXZlZCBzdGFydCByZXNwb25zZVwiKTtcbiAgICAgICAgICBjb250ZXh0Lmt1cmVudG9TZXJ2aWNlLnByb2Nlc3NBbnN3ZXIobWVzc2FnZS5zZHBBbnN3ZXIsIChlcnJvcjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZihlcnJvcil7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBwcm9jZXNzaW5nIHJlc3BvbnNlOiAlc1wiLCBlcnJvcik7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJDM1BsYXllciBzZXJ2aWNlOiBTRFAgcmVzcG9uc2UgcHJvY2Vzc2VkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJlcnJvclwiOiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIHdlYnNvY2tldDogJXNcIiwgbWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwicGxheUVuZFwiOiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDM1BsYXllciBzZXJ2aWNlOiBQbGF5IGVuZGVkXCIpO1xuICAgICAgICAgIGNvbnRleHQuZmlyc3RUaW1lLm5leHQodHJ1ZSk7XG4gICAgICAgICAgY29udGV4dC5wbGF5aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgIGNvbnRleHQucGxheWVkVGltZSA9IDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInZpZGVvSW5mb1wiOiB7XG4gICAgICAgICAgY29udGV4dC50b3RhbER1cmF0aW9uID0gbWVzc2FnZS52aWRlb0R1cmF0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJpY2VDYW5kaWRhdGVcIjoge1xuICAgICAgICAgIGNvbnRleHQua3VyZW50b1NlcnZpY2UuYWRkSWNlQ2FuZGlkYXRlKG1lc3NhZ2UuY2FuZGlkYXRlLCAoZXJyb3I6IHN0cmluZykgPT57XG4gICAgICAgICAgICBpZihlcnJvcil7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBhZGRpbmcgY2FuZGlkYXRlOiAlc1wiLCBlcnJvcik7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBZGRlZCBjYW5kaWRhdGUgJXNcIiwgSlNPTi5zdHJpbmdpZnkobWVzc2FnZS5jYW5kaWRhdGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2Vla1wiOiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDM1BsYXllciBzZXJ2aWNlOiBTZWVrIERvbmUgLT4gJXNcIiwgbWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgICAgICBpZihtZXNzYWdlLm1lc3NhZ2UgIT09IFwib2tcIil7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlFcnJvck1lc3NhZ2UoXCJBbiBlcnJvciBoYXMgb2NjdXJlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInBvc2l0aW9uXCI6IHtcbiAgICAgICAgICBjb250ZXh0LnBsYXllZFRpbWUgPSBtZXNzYWdlLnBvc2l0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkMzUGxheWVyIHNlcnZpY2U6IFVucmVjb2duaXplZCBtZXNzYWdlIHJlY2VpdmVkIC0+ICVzXCIsIG1lc3NhZ2UuaWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCl7XG4gICAgc2V0VGltZW91dCgoKSA9PiBcbiAgICAgIHRoaXMuY29tcG9uZW50SGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLnBsYXllci5uYXRpdmVFbGVtZW50Lm9mZnNldFdpZHRoIC8gdGhpcy5pbWdSZWxhdGlvbikgK1wicHhcIlxuICAgIClcbiAgfVxuXG4gIG5nT25EZXN0cm95KCl7XG4gICAgdGhpcy5fdGltZXIudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmt1cmVudG9TZXJ2aWNlLnJlc2V0Q29ubmVjdGlvbigpO1xuICAgIHRoaXMud3MuY2xvc2UoKTtcbiAgfVxuXG4gIGdldFBsYXllZEhvdXJzKCk6IFN0cmluZ3tcbiAgICByZXR1cm4gdGhpcy5tYXRoU2VydmljZS5wYWQoTWF0aC5mbG9vcih0aGlzLnBsYXllZFRpbWUgLyAzNjAwMDAwKSk7XG4gIH1cblxuICBnZXRQbGF5ZWRNaW51dGVzKCk6IFN0cmluZ3tcbiAgICByZXR1cm4gdGhpcy5tYXRoU2VydmljZS5wYWQoTWF0aC5mbG9vcigoKHRoaXMucGxheWVkVGltZSAvIDEwMDApICUgMzYwMCkgLyA2MCkpO1xuICB9XG5cbiAgZ2V0UGxheWVkU2Vjb25kcygpOiBTdHJpbmd7XG4gICAgcmV0dXJuIHRoaXMubWF0aFNlcnZpY2UucGFkbSgodGhpcy5wbGF5ZWRUaW1lLzEwMDApICUgNjApO1xuICB9XG5cbiAgZ2V0VG90YWxIb3VycygpOiBTdHJpbmd7XG4gICAgcmV0dXJuIHRoaXMubWF0aFNlcnZpY2UucGFkKE1hdGguZmxvb3IodGhpcy50b3RhbER1cmF0aW9uIC8gMzYwMDAwMCkpO1xuICB9XG5cbiAgZ2V0VG90YWxNaW51dGVzKCk6IFN0cmluZ3tcbiAgICByZXR1cm4gdGhpcy5tYXRoU2VydmljZS5wYWQoTWF0aC5mbG9vcigoKHRoaXMudG90YWxEdXJhdGlvbiAvIDEwMDApICUgMzYwMCkgLyA2MCkpO1xuICB9XG5cbiAgZ2V0VG90YWxTZWNvbmRzKCk6IFN0cmluZ3tcbiAgICByZXR1cm4gdGhpcy5tYXRoU2VydmljZS5wYWQoTWF0aC5yb3VuZCh0aGlzLnRvdGFsRHVyYXRpb24vMTAwMCkgJSA2MCk7XG4gIH1cblxuICBnZXRXYW50ZWRIb3VycygpOiBTdHJpbmd7XG4gICAgcmV0dXJuIHRoaXMubWF0aFNlcnZpY2UucGFkKE1hdGguZmxvb3IodGhpcy53YW50ZWRUaW1lIC8gMzYwMDAwMCkpO1xuICB9XG5cbiAgZ2V0V2FudGVkTWludXRlcygpOiBTdHJpbmd7XG4gICAgcmV0dXJuIHRoaXMubWF0aFNlcnZpY2UucGFkKE1hdGguZmxvb3IoKCh0aGlzLndhbnRlZFRpbWUgLyAxMDAwKSAlIDM2MDApIC8gNjApKTtcbiAgfVxuXG4gIGdldFdhbnRlZFNlY29uZHMoKTogU3RyaW5ne1xuICAgIHJldHVybiB0aGlzLm1hdGhTZXJ2aWNlLnBhZChNYXRoLmZsb29yKCh0aGlzLndhbnRlZFRpbWUvMTAwMCkgJSA2MCkpO1xuICB9XG5cbiAgZ2V0U2Vla1Bvc2l0aW9uKCl7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoKHRoaXMucGxheWVkVGltZS90aGlzLnRvdGFsRHVyYXRpb24pKnRoaXMucGxheWVyLm5hdGl2ZUVsZW1lbnQub2Zmc2V0V2lkdGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRPRE8gaW1wbGVtZW50YXIgbWV0b2Rvc1xuICAgKi9cbiAgcGxheSgpOiB2b2lke1xuICAgIGlmKHRoaXMucGxheWluZy52YWx1ZSA9PT0gdHJ1ZSl7XG4gICAgICAgLy9QYXVzZSB0aGUgdmlkZW9cbiAgICAgIHRoaXMua3VyZW50b1NlcnZpY2UucGF1c2UoKTtcbiAgICB9ZWxzZXtcbiAgICAgIGlmKHRoaXMuZmlyc3RUaW1lLnZhbHVlID09PSB0cnVlKXtcbiAgICAgICAgLy9QbGF5XG4gICAgICAgIHRoaXMuc3Bpbm5lci5zaG93KCk7XG4gICAgICAgIHRoaXMua3VyZW50b1NlcnZpY2UudW5tdXRlKCk7XG4gICAgICAgIHRoaXMua3VyZW50b1NlcnZpY2Uuc3RhcnQodGhpcy5wbGF5ZWRUaW1lKTtcbiAgICAgIH1lbHNle1xuICAgICAgICAvL1Jlc3VtZVxuICAgICAgICB0aGlzLnNwaW5uZXIuc2hvdygpO1xuICAgICAgICB0aGlzLmt1cmVudG9TZXJ2aWNlLnJlc3VtZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0b3AoKTogdm9pZHtcbiAgICBpZih0aGlzLndzQ29ubmVjdGVkLnZhbHVlID09PSB0cnVlKXtcbiAgICAgIHRoaXMua3VyZW50b1NlcnZpY2UudW5tdXRlKCk7XG4gICAgICB0aGlzLmt1cmVudG9TZXJ2aWNlLnN0b3AoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMucGxheWVkVGltZSA9IDA7XG4gICAgICB0aGlzLmZpcnN0VGltZS5uZXh0KHRydWUpO1xuICAgICAgdGhpcy5wbGF5aW5nLm5leHQoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHNlZWtDbGlja2VkKGV2ZW50KTogdm9pZHtcbiAgICBcbiAgfVxuXG4gIHNlZWtSZWxlYXNlZChldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgLy9zZXQgcGxheWVkVGltZSBhbmQgc2Vla1Bvc2l0aW9uXG4gICAgdGhpcy5zcGlubmVyLnNob3coKTtcbiAgICBsZXQgY2xpY2tlZDogbnVtYmVyID0gTWF0aC5mbG9vcih0aGlzLnRvdGFsRHVyYXRpb24qKGV2ZW50Lm9mZnNldFgvdGhpcy5wbGF5ZXIubmF0aXZlRWxlbWVudC5vZmZzZXRXaWR0aCkpO1xuICAgIHRoaXMua3VyZW50b1NlcnZpY2UuZG9TZWVrQXQoY2xpY2tlZCk7XG4gIH1cblxuICBzZWVrRHJhZ2dlZCgpOiB2b2lke1xuICAgIGNvbnNvbGUubG9nKFwiU2VlayBkcmFnZ2VkXCIpO1xuICB9XG5cbiAgb25EcmFnU3RhcnQoZXZlbnQpe1xuICAgIGNvbnNvbGUubG9nKFwiRHJhZyBzdGFydFwiKTtcbiAgfVxuXG4gIG9uRHJhZ0VuZChldmVudCl7XG4gICAgY29uc29sZS5sb2coXCJEcmFnIGVuZFwiKTtcbiAgfVxuXG4gIG9uTW91c2VPdmVyU2VlayhldmVudDogTW91c2VFdmVudCl7XG4gICAgdGhpcy50b29sdGlwRGlzcGxheS5uYXRpdmVFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuICAgIHRoaXMudG9vbHRpcERpc3BsYXkubmF0aXZlRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIitldmVudC5vZmZzZXRYK1wicHgsXCIrKDE1K2V2ZW50Lm9mZnNldFkpK1wicHgpXCI7XG4gIH1cblxuICBvbk1vdXNlRXhpdFNlZWsoZXZlbnQ6IE1vdXNlRXZlbnQpe1xuICAgIHRoaXMudG9vbHRpcERpc3BsYXkubmF0aXZlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBvbk1vdXNlTW92ZVNlZWsoZXZlbnQ6IE1vdXNlRXZlbnQpe1xuICAgIHRoaXMud2FudGVkVGltZSA9IE1hdGguZmxvb3IodGhpcy50b3RhbER1cmF0aW9uKihldmVudC5vZmZzZXRYL3RoaXMucGxheWVyLm5hdGl2ZUVsZW1lbnQub2Zmc2V0V2lkdGgpKTtcbiAgICBpZih0aGlzLnBsYXllci5uYXRpdmVFbGVtZW50Lm9mZnNldFdpZHRoIC0gZXZlbnQub2Zmc2V0WCA8PSA1NSl7XG4gICAgICB0aGlzLnRvb2x0aXBEaXNwbGF5Lm5hdGl2ZUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIrKGV2ZW50Lm9mZnNldFggLSA1NSkrXCJweCxcIisoMTUrZXZlbnQub2Zmc2V0WSkrXCJweClcIjtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMudG9vbHRpcERpc3BsYXkubmF0aXZlRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIitldmVudC5vZmZzZXRYK1wicHgsXCIrKDE1K2V2ZW50Lm9mZnNldFkpK1wicHgpXCI7XG4gICAgfVxuICB9XG5cbiAgZGlzcGxheUVycm9yTWVzc2FnZShlcnJvcjogc3RyaW5nKSA6IHZvaWR7XG4gICAgdGhpcy5tb2RhbFNlcnZpY2Uub3BlbkRpYWxvZyh0aGlzLnZpZXdSZWYsIHtcbiAgICAgIHRpdGxlOiAnRXJyb3InLFxuICAgICAgY2hpbGRDb21wb25lbnQ6IFNpbXBsZU1vZGFsQ29tcG9uZW50LFxuICAgICAgZGF0YToge1xuICAgICAgICB0ZXh0OiBcIkVycm9yIG9jY3VyZWQgd2hpbGUgcGxheWluZyB0aGUgYXVkaW86IDxzdHJvbmc+XCIrZXJyb3IrXCI8L3N0cm9uZz5cIlxuICAgICAgfSxcbiAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgIGNsb3NlQnV0dG9uQ2xhc3M6ICdjbG9zZSB0aGVtZS1pY29uLWNsb3NlJyxcbiAgICAgICAgaGVhZGVyVGl0bGVDbGFzczogXCJ0ZXh0LWRhbmdlclwiXG4gICAgICB9LFxuICAgICAgYWN0aW9uQnV0dG9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGV4dDogJ0Nsb3NlJyxcbiAgICAgICAgICBidXR0b25DbGFzczogXCJidG4gYnRuLWRlZmF1bHRcIixcbiAgICAgICAgICBvbkFjdGlvbjogKCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmU6YW55KSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gIH1cblxuICBzd2l0Y2hTb3VuZCgpOiB2b2lke1xuICAgIGlmKHRoaXMubXV0ZWQudmFsdWUgPT09IHRydWUpe1xuICAgICAgdGhpcy5rdXJlbnRvU2VydmljZS51bm11dGUoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMua3VyZW50b1NlcnZpY2UubXV0ZSgpO1xuICAgIH1cbiAgfVxufVxuIl19