export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          {/* 14-Day Trial Badge */}
          <div className="mb-6">
            <span className="inline-block bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
              ✨ 14-Day Free Trial • No Credit Card Needed
            </span>
          </div>

          {/* Logo/Brand */}
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            JobKaart
          </h1>

          {/* Main Headline */}
          <p className="text-2xl lg:text-4xl font-semibold mb-4 text-blue-100">
            Stop Losing Jobs. Get Paid Faster.
          </p>
          <p className="text-lg lg:text-xl text-blue-200 italic mb-8">
            Moenie weer werk verloor nie. Kry vinniger betaling.
          </p>

          {/* Subheadline */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 mb-8">
              <p className="text-xl lg:text-2xl mb-4 italic">
                "I lose 2-3 quotes per month because I forget to follow up"
              </p>
              <p className="text-lg text-blue-100 mb-4">
                Sound familiar?
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-yellow-300">
                That's R8,000 - R12,000 lost every month
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="/signup"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-xl px-12 py-5 rounded-lg shadow-2xl transform transition hover:scale-105 hover:shadow-yellow-400/50"
          >
            Start Free Trial →
          </a>

          {/* Trust indicator */}
          <p className="mt-6 text-blue-200 text-sm">
            Built for SA tradespeople • 14-Day Free Trial • No Credit Card Required
          </p>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}