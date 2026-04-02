import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: 'video[appMediaStream]',
  standalone: true,
})
export class MediaStreamDirective implements OnChanges {
  @Input() appMediaStream: MediaStream | null = null;

  constructor(private el: ElementRef<HTMLVideoElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('appMediaStream' in changes) {
      this.el.nativeElement.srcObject = this.appMediaStream ?? null;
    }
  }
}
