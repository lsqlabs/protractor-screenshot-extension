import { createWriteStream, existsSync, readFileSync } from 'fs';
import { PNG } from 'pngjs';
import { browser, ElementFinder, ProtractorBrowser } from 'protractor';
const pixelmatch = require('pixelmatch');
const shell = require('shelljs');

export interface IRectangle {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface IScreenshotOptions {
    ignoreRectangles?: IRectangle[];
    ignoreElements?: ElementFinder[];
    threshold?: number; // between 0 and 1
    includeAA?: boolean;
}

const actualDirectory = 'actual';
const diffDirectory = 'diff';
const baselineDirectory = 'baseline';

export class ProtractorScreenshotExtension {
    private _screenshotDirectory: string;

    constructor(screenshotDirectory: string) {
        this._screenshotDirectory = screenshotDirectory;
        if (this._screenshotDirectory.slice(-1) === '/') {
            this._screenshotDirectory = this._screenshotDirectory.slice(0, -1);
        }
        // Create all 3 subfolders.
        shell.mkdir('-p', `${screenshotDirectory}/${actualDirectory}`);
        shell.mkdir('-p', `${screenshotDirectory}/${diffDirectory}`);
        shell.mkdir('-p', `${screenshotDirectory}/${baselineDirectory}`);
    }

    public async checkElementScreenshot(
        element: ElementFinder | ProtractorBrowser,
        tag: string,
        options?: IScreenshotOptions
    ): Promise<number> {
        const baselineImagePath = `${this._screenshotDirectory}/${baselineDirectory}/${tag}.png`;
        if (!existsSync(baselineImagePath)) {
            console.log(`Saving baseline image: ${baselineImagePath}`);
            let screenshot = Buffer.from(await element.takeScreenshot(), 'base64');
            screenshot = await this._addBlackoutRectangles(screenshot, options, element);
            const stream = createWriteStream(baselineImagePath);
            stream.write(screenshot);
            stream.end();
            return 0;
        }
        let testScreenshotBuffer = Buffer.from(await element.takeScreenshot(), 'base64');
        testScreenshotBuffer = await this._addBlackoutRectangles(testScreenshotBuffer, options, element);
        const testScreenshotPng = PNG.sync.read(testScreenshotBuffer);
        const baselineScreenshotPng = PNG.sync.read(readFileSync(baselineImagePath));
        const diffPng = new PNG({ width: baselineScreenshotPng.width, height: baselineScreenshotPng.height });
        const numberOfPixelsDifferent = pixelmatch(
            testScreenshotPng.data,
            baselineScreenshotPng.data,
            diffPng.data,
            baselineScreenshotPng.width,
            baselineScreenshotPng.height,
            {
                threshold: options ? options.threshold : undefined,
                includeAA: options ? options.includeAA : undefined
            }
        );
        if (!!numberOfPixelsDifferent) {
            const diffImagePath = `${this._screenshotDirectory}/${diffDirectory}/${tag}.png`;
            const actualImagePath = `${this._screenshotDirectory}/${actualDirectory}/${tag}.png`;
            createWriteStream(actualImagePath).write(testScreenshotBuffer);
            diffPng.pack().pipe(createWriteStream(diffImagePath));
        }
        return numberOfPixelsDifferent;
    }

    public checkPageScreenshot(tag: string, options?: IScreenshotOptions): Promise<number> {
        return this.checkElementScreenshot(browser, tag, options);
    }

    private _blackoutRectangle(image: PNG, x: number, y: number, w: number, h: number): void {
        // Create a black image that will be used for blacking out regions to be ignored.
        const blackPng = new PNG({ width: w, height: h });
        for (let i = 0; i < blackPng.height; i++) {
            for (let j = 0; j < blackPng.width; j++) {
                const idx = (blackPng.width * i + j) * 4;
                blackPng.data[idx] = 0;         // red
                blackPng.data[idx + 1] = 0;     // blue
                blackPng.data[idx + 2] = 0;     // green
                blackPng.data[idx + 3] = 255;   // alpha
            }
        }

        blackPng.bitblt(image, 0, 0, w, h, x, y);
    }

    private async _addBlackoutRectangles (
        imageBuffer: Buffer,
        options?: IScreenshotOptions,
        parentElement?: ElementFinder | ProtractorBrowser
    ): Promise<Buffer> {
        if (options && (options.ignoreRectangles || options.ignoreElements)) {
            const imagePng = PNG.sync.read(imageBuffer);

            if (options.ignoreRectangles && options.ignoreRectangles.length) {
                options.ignoreRectangles.forEach((rect) => {
                    this._blackoutRectangle(imagePng, rect.x, rect.y, rect.w, rect.h);
                });
            }
            if (options.ignoreElements && options.ignoreElements.length) {
                // Using `map` instead of `forEach` in order to await all async calls.
                await Promise.all(options.ignoreElements.map(async (ignoreElement) => {
                    let parentLocation = { x: 0, y: 0 };
                    if (!!parentElement.getLocation) {
                        // If an ElementFinder was passed in, call `getLocation()`, otherwise assume the whole browser was passed in.
                        parentLocation = await parentElement.getLocation();
                    }
                    const ignoreLocation = await ignoreElement.getLocation();
                    const ignoreSize = await ignoreElement.getSize();
                    // Adjust coordinates, as the screenshot can be twice the viewport size for high resolution displays.
                    const parentSize = parentElement.driver 
                        ? await parentElement.driver.manage().window().getSize() 
                        : await parentElement.getSize();
                    const conversionFactor = imagePng.width / parentSize.width;
                    this._blackoutRectangle(
                        imagePng,
                        (ignoreLocation.x - parentLocation.x) * conversionFactor,
                        (ignoreLocation.y - parentLocation.y) * conversionFactor,
                        ignoreSize.width * conversionFactor, ignoreSize.height * conversionFactor
                    );
                }));
            }

            return PNG.sync.write(imagePng);
        }

        return imageBuffer;
    }
}
