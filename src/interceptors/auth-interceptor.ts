import { HttpHeaders, HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const token = localStorage.getItem('response');
//   const clone = req.clone({
//     headers: new HttpHeaders({
//       Authorization: token ? 'Bearer ' + token : '',
//     }),
//   });
//   return next(clone);
// };

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // login çağrılarında token ekleme (opsiyonel ama temiz)
  if (req.url.includes('/auth/login') || req.url.includes('/auth/google-login')) {
    return next(req);
  }

  const token = localStorage.getItem('response');
  if (!token) return next(req);

  const clone = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(clone);
};
