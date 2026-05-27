import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background: 'linear-gradient(180deg, #7a9bbd 0%, #ffffff 60%)' }}
    >
      <h1 className="text-5xl font-semibold text-slate-900">Join the Phyt</h1>
      <p className="text-lg text-slate-700 max-w-2xl">
        Your 30-Day Whole Health System Journey. Track your Fruits, Veggies, Fiber &amp;
        Spice, plus a custom health habit of your choice. Finish to get your reward.
      </p>
      <Link href="/tracker" className={buttonVariants({ size: 'lg' })}>
        Start Tracker
      </Link>
    </main>
  );
}
