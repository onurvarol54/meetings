import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environments/environment.dev';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  const endpoint = environment.api;

  if (!url.startsWith('/board-decisions/')) return next(req); // yeni ekledim.

  let clone = req.clone({ url: url.replace('/board-decisions/', endpoint) });
  return next(clone);
};
