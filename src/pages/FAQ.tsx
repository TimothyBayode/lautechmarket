import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  User,
  MessageCircle,
  Search
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function FAQ() {
  useDocumentTitle("FAQs | LAUTECH Market");
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('general');
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set(['faq-1', 'faq-4']));

  const toggleFaq = (id: string) => {
    const newOpenFaqs = new Set(openFaqs);
    if (newOpenFaqs.has(id)) {
      newOpenFaqs.delete(id);
    } else {
      newOpenFaqs.add(id);
    }
    setOpenFaqs(newOpenFaqs);
  };

  const categories = [
    {
      id: 'general',
      title: 'General Questions',
      icon: <ShoppingBag className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-1',
          question: 'What is LAUTECH Market?',
          answer: 'LAUTECH Market is the official digital marketplace directory for the LAUTECH student community. We provide a safe, organized alternative to chaotic WhatsApp groups, allowing you to search, compare, and connect with verified student vendors instantly.'
        },
        {
          id: 'faq-2',
          question: 'Do I need an account to buy?',
          answer: 'No! Buyers can explore the marketplace, use the "Top 3 Picks" comparison tool, and contact vendors directly without creating an account. Only vendors require verified accounts to list their products.'
        },
        {
          id: 'faq-21',
          question: 'What is the "Instant Buy" ⚡ icon?',
          answer: 'The ⚡ icon indicates an "Instant Buy" vendor. These are high-reliability vendors who typically respond to students in under 30 minutes. The 🟢 icon means the vendor is currently active on their dashboard and ready to chat.'
        },
        {
          id: 'faq-22',
          question: 'How does the "Compare" tool work?',
          answer: 'Select up to 3 products using the comparison icon (double arrows). On desktop, you get a side-by-side technical breakdown. On mobile, we switch to a beautiful sectioned view for easy vertical scrolling through your top picks.'
        },
        {
          id: 'faq-g2',
          question: 'How does LAUTECH Market stay free for everyone?',
          answer: (
            <div className="space-y-3">
              <p>Yes! It is 100% free to list your products and for students to search for what they need. We want to empower every campus entrepreneur. To keep the lights on and keep improving the platform, we have a clear sustainability plan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Premium Visibility (Optional):</span> While listing is free, vendors who want to "jump the queue" can pay a small fee to be featured in our Hero Section or get a Verified Badge.</li>
                <li><span className="font-semibold">Corporate Partnerships:</span> We work with big brands that want to reach students. Instead of annoying ads, we provide them with high-level market insights to help them serve students better.</li>
                <li><span className="font-semibold">Future Professional Tools:</span> We are building advanced tools (like sales analytics and automated inventory) for power-users in the future.</li>
              </ul>
              <p className="font-medium text-emerald-700">Our goal isn't to charge you for being on the market; it's to help you sell more so we can grow together! 🚀</p>
            </div>
          )
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Trust',
      icon: <ShieldCheck className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-s1',
          question: 'How do I know a vendor is verified?',
          answer: 'Look for the "Verified Vendor" badge on their profile. These vendors have submitted their student IDs and business details to our admin team for manual review.'
        },
        {
          id: 'faq-s2',
          question: 'What should I do if a vendor is unresponsive?',
          answer: 'If a vendor doesn\'t respond within 24 hours, we recommend checking their "Trust Score." If you have a serious issue, report it via the "Contact Admin" section, and we will investigate their status.'
        },
        {
          id: 'faq-s3',
          question: 'Can I pay before seeing the item?',
          answer: 'For your security, we strongly recommend "Payment on Delivery" for physical goods, especially when meeting on campus. Only pay in advance for trusted, long-standing vendors with high Trust Scores.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Pricing',
      icon: <CreditCard className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-9',
          question: 'How do payments work?',
          answer: 'Payments happen directly between you and the vendor. Most student vendors accept Bank Transfers, Cash on Delivery, and OPay/PalmPay. We are currently testing a unified checkout system for future release.'
        },
        {
          id: 'faq-11',
          question: 'Why are prices different for the same item?',
          answer: 'LAUTECH Market is an open marketplace. Different vendors have different sourcing costs. Use our "Compare" tool to find the best deal based on both price and the vendor\'s Trust Score.'
        },
        {
          id: 'faq-12',
          question: 'Are there hidden charges?',
          answer: 'There are zero hidden platform fees. The price listed is the price you discuss with the vendor. Delivery fees (if applicable) are handled separately between you and the vendor.'
        }
      ]
    },
    {
      id: 'vendors',
      title: 'For Vendors',
      icon: <User className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-17',
          question: 'How do I start selling?',
          answer: 'Click "Sell on LAUTECH Market" in the footer. Fill out the application with your business name, WhatsApp contact, and category. Once approved by the Supreme Admin, you can start listing products instantly.'
        },
        {
          id: 'faq-v1',
          question: 'How can I rank #1 in search results?',
          answer: 'Rankings are dynamic! To stay at the top: 1) Maintain a high Trust Score by responding quickly. 2) Keep your dashboard open to show the 🟢 Active status. 3) Use high-quality product images.'
        },
        {
          id: 'faq-v2',
          question: 'What is a "Professional Slug"?',
          answer: 'It is your unique shop link (e.g., lautechmarket.com/store/your-name). You can share this on your WhatsApp Status or Instagram Bio to direct students straight to your verified catalog.'
        },
        {
          id: 'faq-23',
          question: 'How is my "Trust Score" calculated?',
          answer: 'Our AI calculates your score based on: Average response time to queries, product availability consistency, and direct student feedback/ratings. Scores above 90% get featured on the "Top Visits" leaderboard.'
        },
        {
          id: 'faq-18',
          question: 'Is it free to use?',
          answer: (
            <div className="space-y-3">
              <p>Yes! LAUTECH Market is 100% free for student vendors to list and sell. We are dedicated to supporting the university's entrepreneurial spirit.</p>
              <p>We sustain the platform through optional premium features and corporate data insights, ensuring the core marketplace always stays free for students.</p>
            </div>
          )
        }
      ]
    },
    {
      id: 'support',
      title: 'Support',
      icon: <MessageCircle className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-4',
          question: 'How do I contact the Admin?',
          answer: 'For critical issues, email lautechmarket.help@gmail.com. For quick support, use the WhatsApp button on the Contact page. Our team is usually active between 8:00 AM and 10:00 PM.'
        },
        {
          id: 'faq-sup1',
          question: 'Can I report a fraudulent vendor?',
          answer: 'Yes. Safety is our priority. If you encounter a scam or suspicious activity, use the "Report" button on the product page or message the Admin immediately. We have a zero-tolerance policy for fraud.'
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => {
      const searchStr = searchTerm.toLowerCase();
      const questionMatch = faq.question.toLowerCase().includes(searchStr);
      const answerMatch = typeof faq.answer === 'string'
        ? faq.answer.toLowerCase().includes(searchStr)
        : false; // For now, we only search in string answers
      return questionMatch || answerMatch;
    })
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={() => { /* No search needed on FAQ page */ }} categories={[]} />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-emerald-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Find quick answers to common questions about shopping, orders, vendors, and more.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions... (e.g., 'shipping', 'returns', 'payment')"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
              {searchTerm ? `Found ${filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0)} results` : 'Type to search questions and answers'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${openCategory === category.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.icon}
                <span>{category.title}</span>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {filteredCategories
              .filter(category => !openCategory || category.id === openCategory)
              .map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                      {category.icon}
                      <span>{category.title}</span>
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {category.faqs.map((faq) => (
                      <div key={faq.id} className="p-6">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors pr-8">
                            {faq.question}
                          </h3>
                          {openFaqs.has(faq.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>

                        {openFaqs.has(faq.id) && (
                          <div className="mt-4 pl-2">
                            <div className="border-l-2 border-emerald-500 pl-4">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-center text-white">
            <div className="max-w-2xl mx-auto">
              <MessageCircle className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-emerald-100 mb-6">
                Can't find the answer you're looking for? Our support team is ready to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}