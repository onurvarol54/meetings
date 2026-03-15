import { inject, Injectable, signal } from '@angular/core';
import { initialJwtDecode, JwtDecodeModel } from '../models/jwtDecode.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Common {
  readonly #route = inject(Router);

  readonly decode = signal<JwtDecodeModel>({ ...initialJwtDecode });

  checkPermission(permission: string) {
    // Dashboard tüm giriş yapmış kullanıcılar için serbest
    //if (permission === 'dashboard:view') return true;

    if (this.decode().role === 'sys_admin') return true;
    if (this.decode().permissions.some((p) => p === permission)) {
      return true;
    }

    return false;
  }

  checkPermissionForRoute(permission: string) {
    const res = this.checkPermission(permission);

    if (!res) {
      this.#route.navigateByUrl('/unauthorize');
    }
    return res;
  }
}
