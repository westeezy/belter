import { isChrome } from '../../../src/device';

describe('isChrome', () => {
    it('should return true when userAgent contains Chrome', () => {
        // @ts-ignore
        window.navigator.userAgent = 'Chrome';
        const bool = isChrome();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains Chromium', () => {
        // @ts-ignore
        window.navigator.userAgent = 'Chromium';
        const bool = isChrome();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains CriOS', () => {
        // @ts-ignore
        window.navigator.userAgent = 'CriOS';
        const bool = isChrome();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when userAgent is invalid', () => {
        // @ts-ignore
        window.navigator.userAgent = 'p0tatO';
        const bool = isChrome();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
});
