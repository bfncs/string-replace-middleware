import { NextFunction, Request, Response } from 'express';
import hijackResponse from 'hijackresponse';
import stringReplaceStream from './stringReplaceStream';

export type Options = Record<'contentTypeFilterRegexp', RegExp>;

const defaultOptions: Options = {
  contentTypeFilterRegexp: /^text\/|^application\/json$|^application\/xml$/,
};

export const stringReplace = (
  replacements: Record<string, string>,
  options: Partial<Options> = {}
) => {
  const opts = { ...defaultOptions, ...options };
  return (_req: Request, res: Response, next: NextFunction) => {
    hijackResponse(res, function(err, res) {
      const contentType = res.get('content-type');
      if (opts.contentTypeFilterRegexp.test(contentType)) {
        if (err) {
          res.unhijack(); // Make the original res object work again
          return next(err);
        }
        res.removeHeader('content-length');
        res.pipe(stringReplaceStream(replacements)).pipe(res);
      } else {
        return res.unhijack();
      }
    });
    next();
  };
};

module.exports = stringReplace;
module.exports.stringReplace = stringReplace;