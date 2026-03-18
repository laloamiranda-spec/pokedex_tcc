import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  email    = '';
  password = '';
  error    = signal('');
  showPass = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  get loading() { return this.auth.loading; }

  async submit(): Promise<void> {
    this.error.set('');
    const err = await this.auth.login(this.email, this.password);
    if (err) { this.error.set(err); return; }
    this.router.navigate(['/welcome']);
  }
}
