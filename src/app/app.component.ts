import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'protractor-screenshot-extension-app';

    public clickHandler(): void {
        this.title = 'the jungle';
    }
}
