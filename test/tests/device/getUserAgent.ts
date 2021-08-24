import { getUserAgent } from '../../../src/device';

describe('getUserAgent', () => {
    beforeEach(() => {
        // @ts-ignore
        window.navigator = {};
    });
    it('should return value of window.navigator.mockUserAgent', () => {
        const expectedResult = 'mock potato';
        // @ts-ignore
        window.navigator.mockUserAgent = expectedResult;
        const mockUserAgent = getUserAgent();

        if (mockUserAgent !== expectedResult) {
            throw new Error(`Expected ${ expectedResult }, got ${ mockUserAgent }`);
        }
    });
    it('should return value of window.navigator.userAgent', () => {
        const expectedResult = 'userAgent potato';
        // @ts-ignore
        window.navigator.userAgent = expectedResult;
        const userAgent = getUserAgent();

        if (userAgent !== expectedResult) {
            throw new Error(`Expected ${ expectedResult }, got ${ userAgent }`);
        }
    });
});
