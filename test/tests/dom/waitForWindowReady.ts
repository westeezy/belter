import { waitForWindowReady } from '../../../src/dom';

describe('waitForWindowReady function', () => {
    const oldState = document.readyState;
    afterEach(() => {
        // @ts-ignore
        document.readyState = oldState;
    });
    it('should resolve when window ready', async () => {
        try {
            // @ts-ignore
            document.readyState = 'complete';
            await waitForWindowReady();
        } catch (err) {
            throw new Error('Expected waitForWindowReady to resolve');
        }
    });
    it('should resolve when window eventually loads', async () => {
        try {
            // @ts-ignore
            document.readyState = 'loading';
            setTimeout(() => {
                // @ts-ignore
                document.readyState = 'complete';
            }, 500);
            await waitForWindowReady();
        } catch (err) {
            throw new Error('Expected waitForWindowReady to eventually resolve');
        }
    });
});
