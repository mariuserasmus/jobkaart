export default function Features() {
  const features = [
    {
      icon: '📱',
      title: 'Never Lose a Customer Number',
      description: 'Find anyone in 2 seconds. No more scrolling through WhatsApp chats for 10 minutes.'
    },
    {
      icon: '📄',
      title: 'Professional Quotes in 2 Minutes',
      description: 'Beautiful PDF quotes with your logo. No more paper that goes through the wash.'
    },
    {
      icon: '👀',
      title: 'Know Who Viewed Your Quote',
      description: 'Get notified when customers open your quote. Call them while it\'s fresh in their mind.'
    },
    {
      icon: '💰',
      title: 'Track What You\'re Owed',
      description: 'See exactly who owes you money: "R23,400 outstanding" — front and center on your dashboard.'
    },
    {
      icon: '👫',
      title: 'Your Wife Can Invoice (Finally)',
      description: 'Give your partner their own login. They see everything needed to create invoices. No more phone calls.'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            5 Things JobKaart Does Really Well
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            No complex features. No confusing menus. Just what you actually need.
          </p>
          <p className="text-lg text-gray-500 italic">
            5 Dinge wat JobKaart regtig goed doen
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-8 hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}

          {/* CTA Card */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-8 flex flex-col justify-center items-center text-center hover:shadow-xl transition-shadow">
            <p className="text-2xl font-bold text-blue-900 mb-4">
              That's it. Nothing more.
            </p>
            <p className="text-blue-900">
              5 features done damn good beats 20 features done half-baked.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}