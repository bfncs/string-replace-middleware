const hijackResponse = require('hijackresponse');
const stringReplaceStream = require('./stringReplaceStream');

module.exports = (replacements) => (req, res, next) => {
    hijackResponse(res, function (err, res) {
        const contentType = res.get('content-type') || "";
        if (contentType.startsWith('text')) {
            if (err) {
                res.unhijack(); // Make the original res object work again
                return next(err);
            }
            res.removeHeader('Content-Length');
            res
                .pipe(stringReplaceStream(replacements))
                .pipe(res);
        } else {
            res.pipe(res);
        }
    });
    next();
};