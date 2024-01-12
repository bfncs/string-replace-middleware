import { NextFunction, Request, Response } from 'express';
import hijackResponse from 'hijackresponse';
import stringReplaceStream, { MatchReplacement } from './stringReplaceStream';

export type ReplaceFunction = (req: Request, res: Response) => MatchReplacement;

const defaultOptions = {
  contentTypeFilterRegexp: /^text\/|^application\/json$|^application\/xml$/,
  useRegExp: false,
};
type Options = typeof defaultOptions;

export const stringReplace = (
  replacements: Record<string, string | ReplaceFunction>,
  options: Partial<Options> = {}
) => {
  const opts = { ...defaultOptions, ...options };

  // Split string and function replacements so we don't have to process them on every request
  const stringReplacements: Record<string, string> = {};
  const functionReplacements: Record<string, ReplaceFunction> = {};
  Object.keys(replacements).forEach(function(key, _index) {
    const replacement = replacements[key];
    if (typeof replacement === 'function') {
      functionReplacements[key] = replacement;
    } else {
      stringReplacements[key] = replacement;
    }
  });
  const hasFunctionReplacements = Object.keys(functionReplacements).length > 0;

  return (req: Request, originalResponse: Response, next: NextFunction) => {
    hijackResponse(originalResponse, function(err, res) {
      const contentType = res.get('content-type') || '';
      if (opts.contentTypeFilterRegexp.test(contentType)) {
        if (err) {
          res.unhijack(); // Make the original res object work again
          return next(err);
        }
        res.removeHeader('content-length');

        let scopedReplacements: Record<string, MatchReplacement>;
        if (hasFunctionReplacements) {
          // If we have dynamic replacements, calculate for this request
          scopedReplacements = { ...stringReplacements };
          Object.keys(functionReplacements).forEach(function(key, _index) {
            scopedReplacements[key] = functionReplacements[key](req, res);
          });
        } else {
          // No dynamic replacements, safe to share the global
          scopedReplacements = stringReplacements;
        }

        res
          .pipe(
            stringReplaceStream(scopedReplacements, {
              useRegExp: options.useRegExp,
            })
          )
          .pipe(res);
      } else {
        return res.unhijack();
      }
    });
    next();
  };
};

module.exports = stringReplace;
module.exports.stringReplace = stringReplace;
