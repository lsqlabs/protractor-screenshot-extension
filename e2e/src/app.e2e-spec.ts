import { AppPage } from './app.po';
import { existsSync, rmdir } from 'fs';
import { browser, element, by } from 'protractor';

const screenshotsPath = 'e2e/screenshots';

describe('workspace-project App', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    it('should display welcome message', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toEqual('Welcome to protractor-screenshot-extension-app!');
    });

    it('should have created baseline, actual, and diff folders in the provided path', () => {
        expect(existsSync(`${screenshotsPath}/baseline`)).toBe(true);
        expect(existsSync(`${screenshotsPath}/actual`)).toBe(true);
        expect(existsSync(`${screenshotsPath}/diff`)).toBe(true);
    });

    it('should create a baseline image when one doesn\'t exist', async () => {
        const diffPixels = await browser.screenshotExtension.checkElementScreenshot(
            element(by.css('.top-level')),
            'demo-app'
        );
        expect(diffPixels).toEqual(0);
        const file = `${screenshotsPath}/baseline/demo-app.png`;
        browser.driver.wait(() => {
            return existsSync(file);
        }, 10000);
        expect(existsSync(file)).toBe(true);
    });

    it('should compare against the previously saved file without a failure', async () => {
        expect(existsSync(`${screenshotsPath}/baseline/demo-app.png`)).toBe(true);
        const diffPixels = await browser.screenshotExtension.checkElementScreenshot(
            element(by.css('.top-level')),
            'demo-app'
        );
        expect(diffPixels).toEqual(0);
    });

    it('should create a baseline image with a blacked out h1 element', async () => {
        const diffPixels = await browser.screenshotExtension.checkElementScreenshot(
            element(by.css('.top-level')),
            'demo-app-ignore-h1',
            {
                ignoreElements: [element(by.css('.top-level h1'))]
            }
        );
        expect(diffPixels).toEqual(0);
        const file = `${screenshotsPath}/baseline/demo-app-ignore-h1.png`;
        browser.driver.wait(() => {
            return existsSync(file);
        }, 10000);
        expect(existsSync(file)).toBe(true);
    });

    it('should compare against the previously created image with blacked out h1 element without a failure', async () => {
        expect(existsSync(`${screenshotsPath}/baseline/demo-app-ignore-h1.png`)).toBe(true);
        const diffPixels = await browser.screenshotExtension.checkElementScreenshot(
            element(by.css('.top-level')),
            'demo-app-ignore-h1',
            {
                ignoreElements: [element(by.css('.top-level h1'))]
            }
        );
        expect(diffPixels).toEqual(0);
    });

    it('should create a baseline image with a blacked out rect', async () => {
        const diffPixels = await browser.screenshotExtension.checkElementScreenshot(
            element(by.css('.top-level')),
            'demo-app-ignore-rect',
            {
                ignoreRectangles: [{ x: 40, y: 40, w: 100, h: 30 }]
            }
        );
        expect(diffPixels).toEqual(0);
        const file = `${screenshotsPath}/baseline/demo-app-ignore-rect.png`;
        browser.driver.wait(() => {
            return existsSync(file);
        }, 10000);
        expect(existsSync(file)).toBe(true);
    });

    it('should compare against the previously created image with blacked out rect without a failure', async () => {
        expect(existsSync(`${screenshotsPath}/baseline/demo-app-ignore-rect.png`)).toBe(true);
        const diffPixels = await browser.screenshotExtension.checkElementScreenshot(
            element(by.css('.top-level')),
            'demo-app-ignore-rect',
            {
                ignoreRectangles: [{ x: 40, y: 40, w: 100, h: 30 }]
            }
        );
        expect(diffPixels).toEqual(0);
    });

    it('should create a baseline image when calling checkPageScreenshot', async () => {
        const diffPixels = await browser.screenshotExtension.checkPageScreenshot(
            'demo-app-page'
        );
        expect(diffPixels).toEqual(0);
        const file = `${screenshotsPath}/baseline/demo-app-page.png`;
        browser.driver.wait(() => {
            return existsSync(file);
        }, 10000);
        expect(existsSync(file)).toBe(true);
    });

    it('should compare against the previously created image when using checkPageScreenshot', async () => {
        expect(existsSync(`${screenshotsPath}/baseline/demo-app-page.png`)).toBe(true);
        const diffPixels = await browser.screenshotExtension.checkPageScreenshot(
            'demo-app-page'
        );
        expect(diffPixels).toEqual(0);
    });

    it('should create image files in the `actual` and `diff` folders when an image comparison fails', async () => {
        await element(by.css('.top-level img')).click();
        const diffPixels = await browser.screenshotExtension.checkPageScreenshot(
            'demo-app-page'
        );
        expect(diffPixels).toBeGreaterThan(0);
        let file = `${screenshotsPath}/actual/demo-app-page.png`;
        browser.driver.wait(() => {
            return existsSync(file);
        }, 10000);
        expect(existsSync(file)).toBe(true);

        file = `${screenshotsPath}/diff/demo-app-page.png`;
        browser.driver.wait(() => {
            return existsSync(file);
        }, 10000);
    });
});
