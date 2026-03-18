import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  email   = '';
  error   = signal('');
  sent    = signal(false);

  constructor(private auth: AuthService) {}

  get loading() { return this.auth.loading; }

  async submit(): Promise<void> {
    this.error.set('');
    const err = await this.auth.forgotPassword(this.email);
    if (err) { this.error.set(err); return; }
    this.sent.set(true);
  }
}
