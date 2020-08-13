declare module 'hijackresponse' {
  import { Response } from 'express';

  type HijackedResponse = Response & { unhijack: () => void };

  export default function hijackResponse(
    res: Response,
    callback: (err: Error, res: HijackedResponse) => void
  ): void;
}
