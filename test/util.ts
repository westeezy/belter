// @ts-ignore
window.console.karma = function consoleKarma() {
    const karma = window.karma || window.top && window.top.karma || window.opener && window.opener.karma;
    karma.log('debug', arguments);
    // @ts-ignore
    console.log.apply(console, arguments); // eslint-disable-line no-console
};
