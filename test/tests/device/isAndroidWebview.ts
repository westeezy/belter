import { isAndroidWebview } from '../../../src/device';

describe('isAndroidWebview', () => {
    it('should return true when isAndroid function returns true, Version regex test passes, and isOperaMini function returns false', () => {
        // @ts-ignore
        window.navigator.userAgent = 'AndroidVersion/9';
        const bool = isAndroidWebview();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when isAndroid function returns false, ', () => {
        // @ts-ignore
        window.navigator.userAgent = 'PotatoVersion/9';
        const bool = isAndroidWebview();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when isAndroid function returns true, Version regex test passes, and isOperaMini function returns true', () => {
        // @ts-ignore
        window.navigator.userAgent = 'AndroidVersion/9Opera Mini';
        const bool = isAndroidWebview();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when isAndroid function returns true and Version regex test fails', () => {
        // @ts-ignore
        window.navigator.userAgent = 'AndroidPotato/9';
        const bool = isAndroidWebview();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
});
