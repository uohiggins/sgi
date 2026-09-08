import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthApplication, AuthService } from '../services/auth-service';

@Component({
  selector: 'app-no-access',
  imports: [],
  templateUrl: './no-access.html',
  styleUrl: './no-access.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NoAccess {
  authService = inject(AuthService);
  appName = environment.APP_NAME;

  goToApplication(application: AuthApplication): void {
    if (!application.url) return;

    window.location.href = application.url;
  }
}
