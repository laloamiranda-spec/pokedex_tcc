import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  email    = '';
  password = '';
  confirm  = '';
  error    = signal('');
  showPass = signal(false);
  confirmed = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  get loading() { return this.auth.loading; }

  async submit(): Promise<void> {
    this.error.set('');
    if (this.password !== this.confirm) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const { error, needsConfirmation } = await this.auth.register(this.email, this.password);
    if (error) { this.error.set(error); return; }
    if (needsConfirmation) { this.confirmed.set(true); return; }
    this.router.navigate(['/welcome']);
  }
}
