import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-white">
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 max-w-3xl">
        Your 30-Day Whole Health System™ Supplement Journey
      </h1>
      <p className="text-lg text-slate-700 max-w-2xl">
        Track your Fruits, Veggies, Fiber &amp; Spice Supplement, plus a custom health habit of your
        choice. Finish to get your reward.
      </p>
      <Link href="/tracker" className={buttonVariants({ size: 'lg' })}>
        Start Tracker
      </Link>
    </main>
  );
}
