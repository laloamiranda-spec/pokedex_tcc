import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class WelcomeComponent {
  constructor(public storage: StorageService) {}
  countRpd = computed(() => this.storage.rpd().length);
  countVh = computed(() => this.storage.vh().length);
  countExpo = computed(() => this.storage.expo().length + this.storage.ec().length);
  countRx = computed(() => this.storage.rx().length);
}
