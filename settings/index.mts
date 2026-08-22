'use strict';

import type HomeySettings from 'homey/lib/HomeySettings.js';

class SettingScript {
  private homey: HomeySettings;

  private authSession: string | undefined;
  private codeVerifier: string | undefined;

  constructor(homey: HomeySettings) {
    this.homey = homey;
  }

  public async onHomeyReady(): Promise<void> {
    const requestCodeElement = document.getElementById('requestCode');
    const loginElement = document.getElementById('login');

    this.homey.get('email', (err: string, email: string) => {
      if (err) {
        return this.homey.alert(err);
      }

      this.setInputValue('email', email);
    });

    this.homey.get('installation', (err: string, installation: string) => {
      if (err) {
        return;
      }

      this.setInputValue('installation', installation);
    });

    requestCodeElement?.addEventListener('click', async () => {
      await this.#requestCode();
    });

    loginElement?.addEventListener('click', async () => {
      await this.#login();
    });

    this.homey.ready();
  }

  async #requestCode() {
    const email = this.getInputValue('email')?.trim();
    const installation =
      this.getInputValue('installation')?.trim() || 'Homey';

    if (!email) {
      this.homey.alert('Please enter your email address.');
      return;
    }

    this.homey.set('email', email, (err: string) => {
      if (err) {
        this.homey.alert(err);
      }
    });

    this.homey.set('installation', installation, (err: string) => {
      if (err) {
        this.homey.alert(err);
      }
    });

    this.homey.api(
      'POST',
      '/authorize',
      {
        email,
        source_name: `Homey Zonneplan 1.2.14 - ${installation}`.substring(0, 255),
      },
      (err: string, result: any) => {
        if (err) {
          console.error('Error starting authorization:', err);
          this.homey.alert(
            'Unable to send the verification code. Please check your email address.',
          );
          return;
        }

        if (!result?.auth_session || !result?.codeVerifier) {
          console.error('Invalid authorization response:', result);
          this.homey.alert(
            'Unexpected response while starting authentication.',
          );
          return;
        }

        this.authSession = result.auth_session;
        this.codeVerifier = result.codeVerifier;

        const otpElement = document.getElementById('otp');
        otpElement?.removeAttribute('disabled');

        const loginElement = document.getElementById('login');
        loginElement?.removeAttribute('disabled');

        this.homey.alert(
          'A six-digit verification code has been sent to your email.',
        );
      },
    );
  }

  async #login() {
    const otp = this.getInputValue('otp')?.trim();

    if (!this.authSession || !this.codeVerifier) {
      this.homey.alert('Please request a verification code first.');
      return;
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      this.homey.alert('Please enter the six-digit verification code.');
      return;
    }

    this.homey.api(
      'POST',
      '/authorize/complete',
      {
        auth_session: this.authSession,
        otp,
      },
      (err: string, result: any) => {
        if (err) {
          console.error('Error completing authorization:', err);
          this.homey.alert(
            'The verification code is invalid or expired.',
          );
          return;
        }

        if (!result?.authorization_code) {
          console.error('Invalid authorization response:', result);
          this.homey.alert(
            'Unexpected response while completing authentication.',
          );
          return;
        }

        void this.#exchangeCode(result.authorization_code);
      },
    );
  }

  async #exchangeCode(code: string) {
    const codeVerifier = this.codeVerifier;

    if (!codeVerifier) {
      this.homey.alert('Authentication session expired. Please try again.');
      return;
    }

    this.homey.api(
      'POST',
      '/token',
      {
        code,
        code_verifier: codeVerifier,
      },
      (err: string, success: any) => {
        if (err) {
          console.error('Error exchanging authorization code:', err);
          this.homey.alert('Problem retrieving the Zonneplan token.');
          return;
        }

        if (!success?.access_token || !success?.refresh_token) {
          console.error('Invalid token response:', success);
          this.homey.alert('Unexpected token response.');
          return;
        }

        // Tokens are also persisted by app.exchangeAuthorizationCode().
        // Keep the settings page compatible with the current Homey setup flow.
        this.homey.set(
          'access_token',
          success.access_token,
          (setErr: string) => {
            if (setErr) {
              this.homey.alert(setErr);
            }
          },
        );

        this.homey.set(
          'refresh_token',
          success.refresh_token,
          (setErr: string) => {
            if (setErr) {
              this.homey.alert(setErr);
            }
          },
        );

        // The verifier is single-use.
        this.codeVerifier = undefined;
        this.authSession = undefined;

        const loginElement = document.getElementById('login');
        loginElement?.setAttribute('disabled', 'disabled');

        this.homey.alert(
          'Login successful. You can now add the Zonneplan device.',
        );
      },
    );
  }

  setInputValue(id: string, value: string | number | undefined) {
    const input = document.getElementById(id) as HTMLInputElement;

    if (input) {
      input.value = value?.toString() || '';
    }
  }

  getInputValue(id: string) {
    const input = document.getElementById(id) as HTMLInputElement;

    if (input) {
      return input.value;
    }

    return '';
  }
}

window.onHomeyReady = async (homey: any): Promise<void> =>
  await new SettingScript(homey).onHomeyReady();