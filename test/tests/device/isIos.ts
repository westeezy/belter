import { isIos } from '../../../src/device';

describe('isIos', () => {
    beforeEach(() => {
        // @ts-ignore
        window.navigator = {};
    });
    it('should return true when userAgent contains iPhone', () => {
        // @ts-ignore
        window.navigator.userAgent = 'iPhone';
        const bool = isIos();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains iPod', () => {
        // @ts-ignore
        window.navigator.userAgent = 'iPod';
        const bool = isIos();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains iPad', () => {
        // @ts-ignore
        window.navigator.userAgent = 'iPad';
        const bool = isIos();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when userAgent is NOT an IOS', () => {
        // @ts-ignore
        window.navigator.userAgent = 'iPotato';
        const bool = isIos();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
});
