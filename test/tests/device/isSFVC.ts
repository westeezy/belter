// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-nested-callbacks */

import { isSFVC } from '../../../src/device';
import { iPhoneScreenHeightMatrix } from '../../../src/screenHeights';

describe('isSFVC', () => {
    Object.keys(iPhoneScreenHeightMatrix).forEach((height) => {
        // @ts-ignore
        const device = iPhoneScreenHeightMatrix[height].device;
        const textSizeHeights =
            // @ts-ignore
            iPhoneScreenHeightMatrix[height].textSizeHeights;
        describe(`${ device }`, () => {
            // @ts-ignore
            textSizeHeights.forEach((textSize) => {
                it(`${ textSize } text size should not be a web view`, () => {
                    // @ts-ignore
                    window.navigator.userAgent = 'iPhone';
                    const sfvc = isSFVC();

                    if (sfvc) {
                        throw new Error(
                            `Expected text size, ${ textSize }, to not be a web view.`
                        );
                    }
                });
            });
        });
    });
    it('should return false when isIos function returns false', () => {
        // @ts-ignore
        window.navigator.userAgent = 'potatoIOS';
        const sfvc = isSFVC();

        if (sfvc) {
            throw new Error(`Expected false, got ${ JSON.stringify(sfvc) }`);
        }
    });
});
