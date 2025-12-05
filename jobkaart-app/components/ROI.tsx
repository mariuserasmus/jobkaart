export default function ROI() {
  const scrollToWaitingList = () => {
    document.getElementById('waiting-list')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main ROI Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-center mb-2">
                The Maths That Matters
              </h2>
              <p className="text-center text-blue-100 italic">
                Die somme wat saak maak
              </p>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-12">
              {/* The Calculation */}
              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-lg text-gray-700">Forgotten quotes per month</span>
                  <span className="text-2xl font-bold text-gray-900">2-3</span>
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-lg text-gray-700">Average quote value</span>
                  <span className="text-2xl font-bold text-gray-900">R4,000</span>
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-lg text-gray-700">Potential lost revenue per month</span>
                  <span className="text-2xl font-bold text-red-600">R8,000 - R12,000</span>
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-lg text-gray-700">JobKaart cost</span>
                  <span className="text-2xl font-bold text-blue-600">R299/month</span>
                </div>
              </div>

              {/* The Result */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-8 mb-8">
                <p className="text-center text-lg text-gray-700 mb-2">
                  If JobKaart helps you recover just ONE quote...
                </p>
                <p className="text-center text-4xl lg:text-5xl font-bold text-green-600 mb-2">
                  R3,701 NET PROFIT
                </p>
                <p className="text-center text-2xl text-gray-700">
                  That's a <span className="font-bold text-green-600">1,238% return</span> on investment
                </p>
              </div>

              {/* Quote Callout */}
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8">
                <p className="text-xl italic text-gray-800">
                  "The question isn't 'Is R299 expensive?' — it's 'Can I afford to keep losing R8,000 every month?'"
                </p>
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={scrollToWaitingList}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-10 py-4 rounded-lg shadow-lg transform transition hover:scale-105"
                >
                  Questions Before You Join?
                </button>
                <p className="mt-4 text-sm text-gray-600">
                  Launching Soon • R299/month • Cancel anytime
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
              WhatsApp + Notebook vs JobKaart
            </h3>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Task</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-red-600">WhatsApp + Notebook</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-600">JobKaart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Find customer number</td>
                    <td className="px-6 py-4 text-sm text-red-600">Scroll... 5+ mins</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">2 seconds</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Professional quote</td>
                    <td className="px-6 py-4 text-sm text-red-600">Paper/messy text</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">Beautiful PDF, 2 mins</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Know if customer read it</td>
                    <td className="px-6 py-4 text-sm text-red-600">No idea ✗</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">"Viewed 2pm today" ✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Follow-up reminders</td>
                    <td className="px-6 py-4 text-sm text-red-600">Forget regularly ✗</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">Auto @ 3 days ✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Know who owes money</td>
                    <td className="px-6 py-4 text-sm text-red-600">Guessing ✗</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">"R23,400 outstanding" ✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Partner can help invoice</td>
                    <td className="px-6 py-4 text-sm text-red-600">Phone calls all day ✗</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">Own login, sees all ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}