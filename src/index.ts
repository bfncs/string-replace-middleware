import { NextFunction, Request, Response } from 'express';
import hijackResponse from 'hijackresponse';
import stringReplaceStream from './stringReplaceStream';

type Options = Record<'contentTypeFilterRegexp', RegExp>;

const defaultOptions: Options = {
  contentTypeFilterRegexp: /^text\/|^application\/json$|^application\/xml$/,
};

export default (
  replacements: Record<string, string>,
  options: Options = defaultOptions
) => (_req: Request, res: Response, next: NextFunction) => {
  hijackResponse(res, function(err, res) {
    const contentType = res.get('content-type');
    if (options.contentTypeFilterRegexp.test(contentType)) {
      if (err) {
        res.unhijack(); // Make the original res object work again
        return next(err);
      }
      res.removeHeader('Content-Length');
      res.pipe(stringReplaceStream(replacements)).pipe(res);
    } else {
      return res.unhijack();
    }
  });
  next();
};
