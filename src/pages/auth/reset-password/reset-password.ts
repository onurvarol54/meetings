import { NgClass } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import Loading from '../../../components/loading/loading';
import { HttpService } from '../../../services/http';

@Component({
  imports: [FormsModule, NgClass, RouterLink, Loading],
  templateUrl: './reset-password.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResetPassword {
  readonly id = signal<string>('');
  readonly result = httpResource(
    () => `/board-decisions/auth/check-forgot-password-code/${this.id()}`,
  );
  readonly resultLoading = computed(() => this.result.isLoading());
  readonly error = computed(() => this.result.error());
  readonly password = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly logoutAllDevices = signal<boolean>(true);
  readonly loading = signal<boolean>(false);

  readonly passwordRequirements = computed(() => {
    const checkPassword = this.password();
    return {
      minLength: checkPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(checkPassword),
      hasLowerCase: /[a-z]/.test(checkPassword),
      hasNumber: /[0-9]/.test(checkPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(checkPassword),
    };
  });
  readonly passwordStrength = computed(() => {
    const requirements = this.passwordRequirements();
    const validCount = Object.values(requirements).filter(Boolean).length;

    if (validCount === 0) return { level: 0, text: 'Zayıf', class: '' };
    if (validCount <= 2) return { level: validCount, text: 'Zayıf', class: 'weak' };
    if (validCount <= 3) return { level: validCount, text: 'Orta', class: 'medium' };
    if (validCount <= 4) return { level: validCount, text: 'İyi', class: 'medium' };
    return { level: validCount, text: 'Güçlü', class: 'strong' };
  });
  readonly isPasswordValid = computed(() => {
    const requirements = this.passwordRequirements();
    return Object.values(requirements).every(Boolean);
  });
  readonly passwordsMatch = computed(() => {
    const pwd = this.password();
    const confirmPwd = this.confirmPassword();
    return pwd.length > 0 && confirmPwd.length > 0 && pwd === confirmPwd;
  });
  readonly isFormValid = computed(() => {
    return this.isPasswordValid() && this.passwordsMatch();
  });
  readonly strengthProgressWidth = computed(() => {
    return (this.passwordStrength().level / 4) * 100;
  });

  readonly newPasswordField = viewChild<ElementRef<HTMLInputElement>>('newPasswordField');
  readonly confirmPasswordField = viewChild<ElementRef<HTMLInputElement>>('confirmPasswordField');

  readonly #activatedRoute = inject(ActivatedRoute);
  readonly #toast = inject(FlexiToastService);
  readonly #http = inject(HttpService);
  readonly #router = inject(Router);

  constructor() {
    this.#activatedRoute.params.subscribe((params) => {
      this.id.set(params['id']);
    });
  }

  toggleNewPasswordVisibility(): void {
    const inputEl = this.newPasswordField()?.nativeElement;
    if (inputEl) {
      inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
    }
  }
  toggleConfirmPasswordVisibility(): void {
    const inputEl = this.confirmPasswordField()?.nativeElement;
    if (inputEl) {
      inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
    }
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const data = {
        forgotPasswordCode: this.id(),
        newPassword: this.password(),
        logoutAllDevices: this.logoutAllDevices(),
      };
      this.loading.set(true);
      this.#http.post<string>(
        '/board-decisions/auth/reset-password',
        data,
        (res) => {
          this.#toast.showToast('Başarılı', res, 'success');
          this.#router.navigateByUrl('/login');
          this.loading.set(false);
        },
        () => this.loading.set(false),
      );
    } else {
      this.#toast.showToast('Uyarı', 'Zorunları alanları doldurmalısın', 'warning');
    }
  }
}
