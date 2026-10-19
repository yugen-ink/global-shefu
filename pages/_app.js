
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>KronoClue — A Mystery Shaped by Time</title>
        <meta
          name="description"
          content="Create a mystery, reveal four clues, and let others deduce the answer."
        />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
