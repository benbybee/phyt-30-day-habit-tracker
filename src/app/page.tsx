import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-semibold">Join the Phyt</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        30 days of Whole Health. Track Fruits, Veggies, and Fiber &amp; Spice. Unlock a reward when you finish.
      </p>
      <Link href="/tracker" className={buttonVariants({ size: 'lg' })}>
        Start Tracker
      </Link>
    </main>
  );
}
