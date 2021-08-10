import { isFirefoxIOS } from '../../../src/device';

describe('isFirefoxIOS', () => {
    beforeEach(() => {
        // @ts-ignore
        window.navigator = {};
    });
    it('should return true when userAgent contains fxios(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'fxios';
        const bool = isFirefoxIOS();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when userAgent does NOT contain fxios(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'firefox potato';
        const bool = isFirefoxIOS();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
});
