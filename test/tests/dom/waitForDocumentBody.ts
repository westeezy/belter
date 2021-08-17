import { waitForDocumentBody } from '../../../src/dom';
import { memoize } from '../../../src/util';

describe('waitForDocumentBody cases', () => {
    // eslint-disable-next-line compat/compat
    const oldBody = document.body;
    const testBody = document.createElement('body');
    beforeEach(memoize.clear);
    afterEach(() => {
        // eslint-disable-next-line compat/compat
        document.body = oldBody;
    });
    it('should resolve when body is present', async () => {
        // @ts-ignore
        document.readyState = 'complete';
        // @ts-ignore
        document.body = testBody; // eslint-disable-line compat/compat
        const result = await waitForDocumentBody();

        if (result !== testBody) {
            throw new Error('Expected result to be the same as testBody');
        }
    });
    it('should eventully resolve when document is ready', async () => {
        // @ts-ignore
        document.readyState = 'loading';
        // @ts-ignore
        document.body = null; // eslint-disable-line compat/compat
        setTimeout(() => {
            // @ts-ignore
            document.readyState = 'complete';
            // @ts-ignore
            document.body = testBody; // eslint-disable-line compat/compat
        }, 20);
        const result = await waitForDocumentBody();

        if (result !== testBody) {
            throw new Error('Expected result to be the same as testBody');
        }
    });
});
