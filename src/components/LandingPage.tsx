import { Link, useLocation } from 'react-router-dom';
import { ChefHat, Sparkles, Camera, ArrowRight, HeartPulse, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const location = useLocation();
  const isLoggedInHome = location.pathname === '/home';

  return (
    <div className="bg-gradient-to-b from-orange-50 via-white to-white min-h-screen">
      {!isLoggedInHome && (
        <header className="absolute inset-x-0 top-0 z-50">
          <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
            <div className="flex lg:flex-1">
              <span className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                <ChefHat className="w-8 h-8 text-orange-500" />
                PantryCheff
              </span>
            </div>
            <div className="flex flex-1 justify-end gap-4">
              <Link
                to="/auth"
                className="text-sm font-semibold leading-6 text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/auth"
                className="text-sm font-semibold leading-6 text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
              >
                Sign up <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </nav>
        </header>
      )}

      <main className="isolate" id="main-content">
        <section
          className={`relative flex items-center ${isLoggedInHome ? 'pt-6' : 'pt-14'} min-h-screen`}
          aria-label="Hero"
        >
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-amber-200 to-orange-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <div className="mx-auto max-w-2xl text-center">
              <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 shadow-sm backdrop-blur-sm bg-white/50">
                  Announcing AI-Powered Pantry Scanning.{' '}
                  <Link to="/auth" className="font-semibold text-orange-600">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Sign up to try it <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
                Stop wasting food. Start{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  cooking smarter.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 mb-10">
                PantryCheff is your AI pantry tracker and recipe generator: cook with ingredients
                you already have. Find recipes that match your pantry, scan your fridge with AI, and
                cut food waste—no more &quot;What&apos;s for dinner?&quot;
              </p>
              <div className="flex items-center justify-center gap-x-6">
                <Link
                  to="/auth"
                  className="rounded-xl bg-orange-500 px-8 py-4 text-sm font-semibold text-white shadow-xl hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                >
                  <ChefHat className="w-5 h-5" />
                  Start Cooking for Free
                </Link>
                <a
                  href="#features"
                  className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-1 hover:text-orange-600 transition-colors"
                >
                  Learn more about features <ArrowRight className="w-4 h-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-red-200 to-orange-400 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 id="features-heading" className="text-base font-semibold leading-7 text-orange-600">
              Cook faster
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to master your kitchen
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              PantryCheff is built to eliminate food waste and reduce grocery bills by intelligently
              combining what you own with what you can create.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16 group">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 group-hover:bg-orange-600 transition-colors shadow-sm">
                    <Camera className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  AI Pantry Scanner
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Take a photo of your fridge or pantry. Our AI automatically identifies
                  ingredients, quantities, and logs them to your digital inventory seamlessly.
                </dd>
              </div>
              <div className="relative pl-16 group">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 group-hover:bg-orange-600 transition-colors shadow-sm">
                    <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Smart Recipe Matching
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Our engine scans thousands of recipes and ranks them by &apos;Match %&apos; based
                  on what you already have in stock, identifying exactly what missing pieces you
                  need.
                </dd>
              </div>
              <div className="relative pl-16 group">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 group-hover:bg-orange-600 transition-colors shadow-sm">
                    <HeartPulse className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Intelligent Substitutions
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Missing an ingredient? Don&apos;t run to the store. Ask PantryCheff&apos;s AI to
                  suggest clever substitutions using items you already own.
                </dd>
              </div>
              <div className="relative pl-16 group">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 group-hover:bg-orange-600 transition-colors shadow-sm">
                    <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Integrated Shopping List
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Add missing recipe ingredients to your shopping list with a single click. Keep
                  track of what to buy for your next grocery run.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="bg-orange-50" aria-label="Get started">
          <div className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ready to transform your cooking?
                <br />
                Join thousands of smart home chefs.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
                Stop throwing away expired food and start creating incredible meals. Get started in
                less than a minute.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/auth"
                  className="rounded-xl bg-orange-600 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all hover:scale-105"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-white border-t border-gray-100" role="contentinfo">
          <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center flex-col md:flex-row items-center space-x-6 md:order-2 gap-4">
              <span className="text-sm leading-5 text-gray-500">
                &copy; 2026 PantryCheff, Inc. All rights reserved.
              </span>
            </div>
            <div className="mt-8 md:order-1 md:mt-0">
              <span className="flex items-center justify-center gap-2 text-xl font-bold text-gray-900">
                <ChefHat className="w-6 h-6 text-orange-500" />
                PantryCheff
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
