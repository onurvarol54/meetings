import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FormValidateDirective } from 'form-validate-angular';
import { HttpService } from '../../../services/http';
import { FlexiToastService } from 'flexi-toast';
import { RecaptchaService } from '../../../services/recaptcha';

declare var google: any;

@Component({
  imports: [FormsModule, FormValidateDirective],
  templateUrl: './login.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login {
  readonly #http = inject(HttpService);
  readonly #router = inject(Router);
  readonly #toast = inject(FlexiToastService);

  readonly #recaptcha = inject(RecaptchaService);

  readonly loading = signal<boolean>(false);
  readonly userName = signal<string>('');
  readonly emailOrUserName = signal<string>('');
  readonly tfaCode = signal<string>('');
  readonly tfaConfirmCode = signal<string>('');
  readonly showTFAForm = signal<boolean>(false);
  readonly showTFAFormTimer = signal<{ min: number; sec: number }>({
    min: 5,
    sec: 0,
  });

  readonly modalCloseButton = viewChild<ElementRef<HTMLButtonElement>>('modalCloseButton');
  readonly passwordField = viewChild<ElementRef<HTMLInputElement>>('passwordField');

  togglePasswordVisibility(): void {
    const inputEl = this.passwordField()?.nativeElement;
    if (inputEl) {
      inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
    }
  }

  login(from: NgForm) {
    if (!from.valid) return;
    this.loading.set(true);

    this.#recaptcha
      .execute('login')
      .then((token) => {
        const payload = {
          ...from.value,
          recaptchaToken: token,
          recaptchaAction: 'login',
        };

        this.#http.post<{ token: string | null; tfaCode: string | null }>(
          '/board-decisions/auth/login',
          payload,
          (res) => {
            if (res.token !== null) {
              localStorage.setItem('response', res.token);
              this.#router.navigateByUrl('/dashboard');
            } else if (res.tfaCode !== null) {
              this.tfaCode.set(res.tfaCode);
              this.showTFAForm.set(true);
              this.showTFAFormTimer.set({ min: 5, sec: 0 });

              var interval: any = setInterval(() => {
                let min = this.showTFAFormTimer().min;
                let sec = this.showTFAFormTimer().sec;

                sec--;
                if (sec < 0) {
                  sec = 59;
                  min--;
                  if (min < 0) {
                    min = 0;

                    interval.clear();
                    this.showTFAForm.set(false);
                    this.#router.navigateByUrl('/login');
                  }
                }
                this.showTFAFormTimer.set({ min: min, sec: sec });
              }, 1000);
            }
            this.loading.set(false);
          },
          () => this.loading.set(false),
        );
      })
      .catch(() => {
        this.loading.set(false);
        this.#toast.showToast(
          'Hata',
          'Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.',
          'error',
        );
      });
  }

  loginWithTFA(form: NgForm) {
    if (!form.valid) return;

    const data = {
      emailOrUserName: this.emailOrUserName(),
      tfaCode: this.tfaCode(),
      tfaConfirmCode: this.tfaConfirmCode(),
    };

    this.loading.set(true);
    this.#http.post<{ token: string | null; tfaCode: string | null }>(
      '/board-decisions/auth/login-with-tfa',
      data,
      (res) => {
        localStorage.setItem('response', res.token!);
        this.#router.navigateByUrl('dashboard');
        this.loading.set(false);
      },
      () => {
        this.loading.set(false);
      },
    );
  }

  // forgotPassword() {
  //   this.#http.post<string>(
  //     `/board-decisions/auth/forgot-password/${this.userName()}`,
  //     {},
  //     (res) => {
  //       this.#toast.showToast('Başarılı', res, 'info');
  //       this.modalCloseButton()!.nativeElement.click();
  //     },
  //   );
  // }

  forgotPassword() {
    const userName = this.userName()?.trim();
    if (!userName) {
      this.#toast.showToast('Hata', 'Email ya da kullanıcı adı giriniz.', 'error');
      return;
    }

    this.loading.set(true);

    this.#recaptcha
      .execute('forgot_password')
      .then((token) => {
        const payload = {
          userName,
          recaptchaToken: token,
          recaptchaAction: 'forgot_password',
        };

        this.#http.post<string>(
          '/board-decisions/auth/forgot-password',
          payload,
          (res) => {
            this.#toast.showToast('Başarılı', res, 'info');
            this.modalCloseButton()?.nativeElement.click();
            this.loading.set(false);
          },
          () => this.loading.set(false),
        );
      })
      .catch(() => {
        this.loading.set(false);
        this.#toast.showToast(
          'Hata',
          'Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.',
          'error',
        );
      });
  }

  ngOnInit() {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn() {
    const tryInitialize = () => {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        return false;
      }

      const googleBtn = document.getElementById('googleBtn');
      if (!googleBtn) {
        return false;
      }

      google.accounts.id.initialize({
        client_id: '686114121884-013v83kvdn2gbliu5mr47nfgcbrfc0js.apps.googleusercontent.com',
        callback: (response: any) => {
          this.handleGoogleLogin(response.credential);
        },
      });

      google.accounts.id.renderButton(googleBtn, {
        theme: 'outline',
        size: 'large',
      });

      return true;
    };

    if (tryInitialize()) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    const intervalId = setInterval(() => {
      attempts++;

      if (tryInitialize() || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 500);
  }

  handleGoogleLogin(idToken: string) {
    if (!idToken) {
      return;
    }

    this.loading.set(true);

    this.#http.post<{ token: string | null }>(
      '/board-decisions/auth/google-login',
      { idToken: idToken },
      (res) => {
        if (res.token) {
          localStorage.setItem('response', res.token);
          this.#router.navigateByUrl('/dashboard');
        }
        this.loading.set(false);
      },
      () => {
        this.loading.set(false);
      },
    );
  }
}
