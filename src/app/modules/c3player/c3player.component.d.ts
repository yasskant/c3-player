import { OnInit, OnDestroy, ElementRef, ViewContainerRef, AfterViewInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MathService } from '../../services/math.service';
import { EventService } from '../../services/event.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ModalDialogService } from 'ngx-modal-dialog';
export declare class C3playerComponent implements OnInit, OnDestroy, AfterViewInit {
    private mathService;
    private eventService;
    private spinner;
    private modalService;
    private viewRef;
    private ws;
    private kurentoService;
    private _timer;
    private offset;
    playing: BehaviorSubject<boolean>;
    private wsConnected;
    private playedTime;
    private wantedTime;
    tooltipDisplay: ElementRef;
    player: ElementRef;
    video: ElementRef;
    imageSource: string;
    audioSource: string;
    wsUrl: string;
    totalDuration: number;
    componentWidth: string;
    componentMargin: string;
    imgRelation: number;
    muted: BehaviorSubject<boolean>;
    private firstTime;
    componentHeight: string;
    constructor(mathService: MathService, eventService: EventService, spinner: NgxSpinnerService, modalService: ModalDialogService, viewRef: ViewContainerRef);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    getPlayedHours(): String;
    getPlayedMinutes(): String;
    getPlayedSeconds(): String;
    getTotalHours(): String;
    getTotalMinutes(): String;
    getTotalSeconds(): String;
    getWantedHours(): String;
    getWantedMinutes(): String;
    getWantedSeconds(): String;
    getSeekPosition(): number;
    /**
     * TODO implementar metodos
     */
    play(): void;
    stop(): void;
    seekClicked(event: any): void;
    seekReleased(event: MouseEvent): void;
    seekDragged(): void;
    onDragStart(event: any): void;
    onDragEnd(event: any): void;
    onMouseOverSeek(event: MouseEvent): void;
    onMouseExitSeek(event: MouseEvent): void;
    onMouseMoveSeek(event: MouseEvent): void;
    displayErrorMessage(error: string): void;
    switchSound(): void;
}
