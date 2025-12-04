import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Package, 
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
          answer: 'Lautech Market is the #1 online directory for student vendors in Ogbomoso. We replace the chaos of messy WhatsApp groups with a clean, searchable platform.'
        },
        {
          id: 'faq-2',
          question: 'How do I create an account?',
          answer: 'As a buyer, you do not need to create an account before you can purchase products. However, a vendor has to go through the admins before their product go live.'
        },
        {
          id: 'faq-3',
          question: 'Is LAUTECH Market available nationwide?',
          answer: 'No! LAUTECH Market is specifically available for students/vendors within LAUTECH and Ogbomoso. We plan to expand to other universities and cities in the future.'
        },
        {
          id: 'faq-4',
          question: 'How do I contact customer support?',
          answer: 'You can reach our customer support team through: 1) The contact form on our Contact page 2) Email: lautechmarket.help@gmail.com 3) WhatsApp: +234 815 199 3706 4) Live chat also available on our website'
        }
      ]
    },
    {
      id: 'orders',
      title: 'Orders & Shipping',
      icon: <Truck className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-5',
          question: 'How long does delivery take?',
          answer: 'Delivery times vary based on your location and the vendor\'s processing time. Typically, orders are delivered within 1-3 business days for Ogbomoso locations.'
        },
        {
          id: 'faq-6',
          question: 'How do I track my order?',
          answer: 'A feature for order tracking is coming soon! For now, you can contact the vendor directly through the contact information provided on the website.'
        },
        {
          id: 'faq-7',
          question: 'What are the shipping costs?',
          answer: 'Shipping costs is calculated by the vendor typically based on your location and the size/weight of the items.'
        },
        {
          id: 'faq-8',
          question: 'Do you offer express shipping?',
          answer: 'No! We do not offer shipping at the moment.'
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
          question: 'What payment methods do you accept?',
          answer: 'Vendors are responsible for their payment methods. Very soon the website will support several payment methods.'
        },
        {
          id: 'faq-10',
          question: 'Is payment on delivery available?',
          answer: 'We strictly advise support for payment on delivery as a payment method. However, some vendors may offer it at their discretion.'
        },
        {
          id: 'faq-11',
          question: 'Why are prices different from vendors?',
          answer: 'LAUTECH Market is a multi-vendor platform, so different vendors may sell the same product at different prices based on their sourcing and business strategy. You can compare prices from multiple vendors before purchasing.'
        },
        {
          id: 'faq-12',
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees! The price you see is what you pay.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Refunds',
      icon: <Package className="w-5 h-5" />,
      faqs: [
        {
          id: 'faq-13',
          question: 'What is your return policy?',
          answer: 'Contact the vendor directly to discuss the return process.'
        },
        {
          id: 'faq-14',
          question: 'How do I initiate a return?',
          answer: 'Vendors handle their own return processes. But if you still need help, contact our support team through the Contact page.'
        },
        {
          id: 'faq-15',
          question: 'How long do refunds take?',
          answer: 'Refund processing vary according to the vendor and is at their discretion.'
        },
        {
          id: 'faq-16',
          question: 'Who pays for return shipping?',
          answer: 'This totally depends on the discussion you must have had with the vendor.'
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
          question: 'How do I become a vendor?',
          answer: 'To become a vendor: 1) Click "Sell on LAUTECH Market" in the footer 2) Complete the application form 3) Submit required documents 4) Our team will review and contact you.'
        },
        {
          id: 'faq-18',
          question: 'What are the vendor fees?',
          answer: 'We currently do not charge any fees at the moment.'
        },
        {
          id: 'faq-19',
          question: 'How do vendors get paid?',
          answer: 'Vendors receive payments directly from buyers according to the goods being purchased.'
        },
        {
          id: 'faq-20',
          question: 'What support do vendors get?',
          answer: 'Vendors receive: • Dedicated account manager • Marketing and promotion • Customer support handling.'
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={() => {}} categories={[]} />
      
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                  openCategory === category.id
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