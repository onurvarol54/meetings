import { Injectable } from '@angular/core';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class RecaptchaService {
  async execute(action: string): Promise<string> {
    // grecaptcha yüklenene kadar bekle
    await this.waitForGrecaptcha();

    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute('6LdX5FYsAAAAAHV93l14Xq9McwroTLYOMShy-xuD', { action })
          .then((token: string) => resolve(token))
          .catch(reject);
      });
    });
  }

  private waitForGrecaptcha(): Promise<void> {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (window.grecaptcha?.execute) {
          clearInterval(t);
          resolve();
        }
      }, 50);
    });
  }
}
