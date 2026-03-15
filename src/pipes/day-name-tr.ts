import { Pipe, PipeTransform } from '@angular/core';

const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

@Pipe({
  name: 'dayNameTr',
})
export class DayNameTrPipe implements PipeTransform {
  transform(dayIndex: number): string {
    return DAYS_TR[dayIndex] ?? '';
  }
}
