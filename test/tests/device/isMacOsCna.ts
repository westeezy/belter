import { isMacOsCna } from '../../../src/device';

describe('isMacOsCna', () => {
    beforeEach(() => {
        // @ts-ignore
        window.navigator = {};
    });
    it('should return true when userAgent is valid', () => {
        // @ts-ignore
        window.navigator.userAgent = 'macintosh.potatoAppleWebKit';
        const bool = isMacOsCna();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when userAgent is invalid', () => {
        // @ts-ignore
        window.navigator.userAgent = 'potat0';
        const bool = isMacOsCna();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
});
