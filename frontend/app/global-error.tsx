'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="en"><body style={{ background: '#050508', color: '#F5F7FB', fontFamily: 'sans-serif', padding: 32 }}><main><h1>NEXI is temporarily unavailable</h1><p>Reload the page to try again.</p></main></body></html>;
}
