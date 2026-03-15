import { Pipe, PipeTransform } from '@angular/core';
import { MONTHS_TR } from './date-tr';

@Pipe({
  name: 'monthNameTr',
  standalone: true,
  pure: true,
})
export class MonthNameTrPipe implements PipeTransform {
  transform(index?: number | null): string {
    if (index === null || index === undefined) return '';
    return MONTHS_TR[index] ?? '';
  }
}
