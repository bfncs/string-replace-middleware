const hijackResponse = require('hijackresponse');
const stringReplaceStream = require('./stringReplaceStream');

module.exports = (replacements) => (req, res, next) => {
    hijackResponse(res, function (err, res) {
        if (err) {
            res.unhijack(); // Make the original res object work again
            return next(err);
        }
        res.removeHeader('Content-Length');
        res
            .pipe(stringReplaceStream(replacements))
            .pipe(res);
    });
    next();
};