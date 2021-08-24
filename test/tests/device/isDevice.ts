import { isDevice } from '../../../src/device';

describe('isDevice', () => {
    beforeEach(() => {
        // @ts-ignore
        window.navigator = {};
    });
    it('should return true when userAgent contains android(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'android';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains webos(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'webos';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains iphone(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'iphone';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains ipad(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'ipad';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains ipod(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'ipod';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains bada(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'bada';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains symbian(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'symbian';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains palm(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'palm';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains crios(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'crios';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains blackberry(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'blackberry';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains blackberry(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'blackberry';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains iemobile(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'iemobile';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains windowsmobile(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'windowsmobile';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when userAgent contains `opera mini`(case insensitive)', () => {
        // @ts-ignore
        window.navigator.userAgent = 'opera mini';
        const bool = isDevice();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when userAgent is NOT a valid choice', () => {
        // @ts-ignore
        window.navigator.userAgent = 'potato device';
        const bool = isDevice();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
});
