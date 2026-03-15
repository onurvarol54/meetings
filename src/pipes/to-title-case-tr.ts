import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toTitleCaseTr',
  standalone: true,
  pure: true,
})
export class ToTitleCaseTrPipe implements PipeTransform {
  transform(text?: string | null): string {
    if (!text) return '';

    return text
      .toLocaleLowerCase('tr-TR')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
      .join(' ');
  }
}
