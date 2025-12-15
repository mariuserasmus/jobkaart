export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">JobKaart</h3>
            <p className="text-gray-400">
              Simple job management for South African tradespeople.
            </p>
            <p className="text-gray-400 mt-2">
              Stop losing jobs. Get paid faster.
            </p>
            <div className="mt-4">
              <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                FREE Forever
              </span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="mailto:hello@jobkaart.co.za" className="hover:text-white transition">
                  hello@jobkaart.co.za
                </a>
              </li>
              <li>Now Live & Ready to Use</li>
              <li className="mt-4">
                <a href="#" className="text-blue-400 hover:text-blue-300 transition text-sm">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Who Is This For?</h4>
            <ul className="space-y-2 text-gray-400">
              <li>✓ Plumbers</li>
              <li>✓ Electricians</li>
              <li>✓ Handymen</li>
              <li>✓ Painters</li>
              <li>✓ Pool Services</li>
              <li>✓ Solo tradies & small teams</li>
            </ul>
          </div>

          {/* Privacy & Data Protection */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Your Data</h4>
            <div className="text-gray-400 text-sm space-y-2">
              <p>
                🔒 <span className="font-semibold">POPIA Compliant</span>
              </p>
              <p>
                Your customer data stays yours. We never share or sell your information.
              </p>
              <p className="mt-3">
                ✓ Secure cloud storage<br />
                ✓ Encrypted connections<br />
                ✓ Delete anytime
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} JobKaart. Built for SA tradespeople.</p>
          <p className="mt-1 text-sm italic">
            Gebou vir Suid-Afrikaanse ambagsmense
          </p>
          <p className="mt-3 text-sm">
            R299/month • No contracts • Cancel anytime
          </p>
        </div>
      </div>
    </footer>
  )
}