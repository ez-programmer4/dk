"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiLogIn,
  FiArrowRight,
  FiPlus,
  FiGlobe,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSun,
  FiMinus,
  FiMoon,
  FiMonitor,
  FiMenu,
  FiX,
  FiUsers,
  FiUser,
  FiBarChart,
  FiDollarSign,
  FiSmartphone,
  FiShield,
  FiZap,
  FiActivity,
  FiLayers,
  FiDownload,
  FiDatabase,
  FiAward,
  FiClock,
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
  FiTrendingUp,
  FiStar,
  FiPlay,
  FiCheckCircle,
  FiUserCheck,
  FiSettings,
  FiUpload,
  FiPhone,
  FiVideo,
  FiCreditCard,
  FiMessageSquare,
  FiBell,
  FiLock,
  FiServer,
  FiEye,
  FiCode,
  FiTarget,
  FiHeart,
  FiHeadphones,
  FiHelpCircle,
  FiMail,
  FiMapPin,
  FiPieChart,
  FiFileText,
  FiCalendar,
  FiHome,
  FiCheck
} from "react-icons/fi";
import SchoolRegistrationSidePanel from "@/components/SchoolRegistrationSidePanel";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Language options
  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'AR', name: 'አማርኛ', flag: 'am' },
   
  ];

  // Theme toggle function
  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const features = [
    {
      iconName: "Users",
      title: "Student Management",
      description: "Complete student lifecycle management from registration t0 completion with comprehensive profiles and progress tracking.",
      details: ["Digital enrollment system", "Academic record management", "Progress monitoring", "Certificate generation", "Parent communication portal"]
    },
    {
      iconName: "BarChart",
      title: "Advanced Analytics",
      description: "Real-time insights and reporting dashboards to monitor performance, attendance, and academic progress.",
      details: ["Performance dashboards", "Attendance analytics", "Custom report builder", "Data visualization", "Predictive insights", "Comparative analysis"]
    },
    {
      iconName: "DollarSign",
      title: "Payment Processing",
      description: "Secure payment gateway integration with automated fee collection, invoicing, and financial reporting.",
      details: ["Online payment processing", "Automated invoicing", "Financial reporting", "Payment tracking", "Multi-currency support", "Receipt generation"]
    },
    {
      iconName: "Smartphone",
      title: "Mobile Access",
      description: "Responsive design with mobile apps for students, teachers, and parents to access information on-the-go.",
      details: ["Mobile-optimized interface", "Push notifications", "Offline access", "Cross-platform support", "Biometric authentication", "Real-time updates"]
    },
    {
      iconName: "Shield",
      title: "Security & Privacy",
      description: "Enterprise-grade security with role-based access control and data encryption to protect sensitive information.",
      details: ["End-to-end encryption", "GDPR compliance", "Role-based access", "Regular audits", "Data backup", "Privacy controls"]
    },
    {
      iconName: "Zap",
      title: "Automation",
      description: "Streamline administrative tasks with automated notifications, attendance tracking, and report generation.",
      details: ["Auto notifications", "Smart scheduling", "Bulk operations", "Workflow automation", "Report generation", "Task management"]
    },
    {
      iconName: "Activity",
      title: "Real-time Monitoring",
      description: "Live dashboards and alerts for immediate insights into school operations and student activities.",
      details: ["Live dashboards", "Instant alerts", "Activity monitoring", "Performance metrics", "System health", "Usage analytics"]
    },
    {
      iconName: "Layers",
      title: "Multi-tenant Architecture",
      description: "Isolated school environments with dedicated resources while maintaining centralized management.",
      details: ["School isolation", "Resource allocation", "Central management", "Scalable infrastructure", "Custom configurations", "Data segregation"]
    },
    {
      iconName: "Database",
      title: "Data Management",
      description: "Comprehensive data backup, recovery, and management capabilities to ensure data integrity.",
      details: ["Automated backups", "Disaster recovery", "Data integrity", "Quick restoration", "Archive management", "Compliance reporting"]
    }
  ];

  const stats = [
    { number: "7000+", label: "Active Students", iconName: "Users", description: "Across schools" },

    { number: "24/7", label: "Support", iconName: "Clock", description: "Round-the-clock assistance" },
    { number: "90.9%", label: "Uptime", iconName: "TrendingUp", description: "Reliable performance" }
  ];

  const testimonials = [
    {
      name: "Ahmed Al-Rashid",
      role: "School Director",
      school: "Al-Noor Islamic Academy, UAE",
      content: "Darulkubra has transformed how we manage our school. The comprehensive features and user-friendly interface have made our daily operations much more efficient. Our teachers love the automated attendance system.",
      avatar: "A",
      rating: 5,
      achievement: "Increased efficiency by 40%"
    },
    {
      name: "Fatima Hassan",
      role: "Academic Coordinator",
      school: "Dar Al-Huda School, Saudi Arabia",
      content: "The analytics and reporting capabilities are exceptional. We can now track student progress in real-time and make data-driven decisions. The parent portal has improved communication tremendously.",
      avatar: "F",
      rating: 5,
      achievement: "Improved student outcomes by 25%"
    },
    {
      name: "Omar Abdullah",
      role: "IT Administrator",
      school: "Islamic Education Center, Qatar",
      content: "Outstanding support team and robust security features. We've never felt more confident about our student data being protected. The multi-tenant architecture ensures complete data isolation.",
      avatar: "O",
      rating: 5,
      achievement: "Enhanced data security 100%"
    },
    {
      name: "Dr. Aisha Mohammed",
      role: "Principal",
      school: "Al-Furqan Academy, Malaysia",
      content: "The mobile accessibility has been a game-changer for our teachers and parents. The automated fee collection has eliminated billing headaches, and the reporting tools are invaluable for accreditation.",
      avatar: "A",
      rating: 5,
      achievement: "Streamlined administration by 60%"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {/* Professional Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/98 backdrop-blur-lg shadow-xl border-b border-gray-200/50'
          : 'bg-white/95 backdrop-blur-md'
      }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3 transition-transform duration-200 hover:scale-102">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-100 border-2 border-black rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-sm">D</span>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent tracking-tight">
                Darulkubra
              </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-black transition-colors duration-200 rounded-lg hover:bg-gray-50">
                  <FiGlobe className="w-4 h-4" />
                  <span className="text-sm font-medium">{currentLanguage}</span>
                  <FiChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                </button>

                <div className="navbar-dropdown absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setCurrentLanguage(lang.code)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        {currentLanguage === lang.code && (
                          <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="relative group">
                <button className="p-2 text-gray-700 hover:text-black transition-colors duration-200 rounded-lg hover:bg-gray-50">
                  {theme === 'light' ? (
                    <FiSun className="w-5 h-5" />
                  ) : theme === 'dark' ? (
                    <FiMoon className="w-5 h-5" />
                  ) : (
                    <FiMonitor className="w-5 h-5" />
                  )}
                </button>

                <div className="navbar-dropdown absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => toggleTheme('light')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <FiSun className="w-4 h-4" />
                      <span>Light</span>
                      {theme === 'light' && <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>}
                    </button>
                    <button
                      onClick={() => toggleTheme('dark')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <FiMoon className="w-4 h-4" />
                      <span>Dark</span>
                      {theme === 'dark' && <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>}
                    </button>
                    <button
                      onClick={() => toggleTheme('system')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <FiMonitor className="w-4 h-4" />
                      <span>System</span>
                      {theme === 'system' && <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <Link
                href="/login"
                className="hidden sm:block px-4 py-2 text-gray-700 hover:text-black transition-colors duration-200 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Login
              </Link>

              {/* Get Started Button */}
              <motion.button
                onClick={() => setIsSidePanelOpen(true)}
                className="bg-gradient-to-r from-black to-gray-900 text-white px-6 py-2 rounded-lg hover:from-gray-900 hover:to-black transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </motion.button>

              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-700 hover:text-black transition-colors duration-300"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <FiX className="w-6 h-6" />
                  ) : (
                    <FiMenu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-4">
                {/* Mobile Language Selector */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900 mb-2">Language</div>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setCurrentLanguage(lang.code);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-left text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {currentLanguage === lang.code && (
                          <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Theme Selector */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900 mb-2">Theme</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        toggleTheme('light');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiSun className="w-4 h-4" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleTheme('dark');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiMoon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleTheme('system');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiMonitor className="w-4 h-4" />
                      <span>Auto</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link
                    href="/login"
                    className="block w-full px-4 py-3 text-center text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <button
                    onClick={() => {
                      setIsSidePanelOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-black to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all duration-300 font-medium shadow-lg"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gray-100 rounded-full filter blur-3xl opacity-30"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-gray-200 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gray-100 rounded-full filter blur-3xl opacity-25"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mb-6 border border-gray-200">
                <FiStar className="w-4 h-4 mr-2 text-gray-600" />
                Trusted by  Islamic Schools Worldwide
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight tracking-tight">
                Darulkubra Academy
                <span className="block text-gray-600 font-light">
                  Academy Management Platform
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Transform your Islamic educational institution with our comprehensive digital platform.
                Streamline administration, enhance learning, and foster community engagement.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setIsSidePanelOpen(true)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-black to-gray-900 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FiPlus className="mr-3 w-5 h-5" />
                  Start Free Trial
                  <FiArrowRight className="ml-3" />
                </button>

                <button className="inline-flex items-center px-8 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                  <FiPlay className="mr-3 w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start mt-8 space-x-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  No setup fees
                </div>
                <div className="flex items-center">
                  <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  30-day free trial
                </div>
                <div className="flex items-center">
                  <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>

            {/* Right Content - Professional Dashboard Preview */}
            <div className="relative">
              {/* Subtle shadow and background integration */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl transform rotate-1 opacity-60 -z-10"></div>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl -z-10"></div>

              {/* Main dashboard container */}
              <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden transform hover:shadow-2xl transition-shadow duration-500">
                {/* White and black accent bar */}
                <div className="h-1 bg-gradient-to-r from-white via-gray-200 to-black"></div>

                {/* Dashboard header */}
                <div className="p-8 pb-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-50 border-2 border-black rounded-xl flex items-center justify-center shadow-lg">
                      <FiBarChart className="w-5 h-5 text-black" />
                    </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Dashboard Overview</h3>
                        <p className="text-sm text-gray-500">Real-time insights and analytics</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500 font-medium">Live</span>
                    </div>
                  </div>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* Total Students */}
                    <div className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                          <FiUsers className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          <FiTrendingUp className="w-3 h-3 mr-1" />
                          <span className="text-xs font-semibold">+12%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">1,247</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full w-4/5 transition-all duration-1000 ease-out"></div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <FiTrendingUp className="w-3 h-3 mr-1" />
                          <span className="text-xs font-semibold">+2.1%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Attendance Rate</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">96.8%</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full w-[96%] transition-all duration-1000 ease-out"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-gray-200 transition-colors duration-300">
                      <div className="text-2xl font-bold text-gray-900 mb-1">4.8</div>
                      <p className="text-xs text-gray-500 font-medium">Avg Grade</p>
                      <div className="flex justify-center mt-2">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-gray-200 transition-colors duration-300">
                      <div className="text-2xl font-bold text-gray-900 mb-1">89%</div>
                      <p className="text-xs text-gray-500 font-medium">Completion</p>
                      <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-1 rounded-full w-[89%] transition-all duration-1000 ease-out"></div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-gray-200 transition-colors duration-300">
                      <div className="text-2xl font-bold text-gray-900 mb-1">24</div>
                      <p className="text-xs text-gray-500 font-medium">Active Classes</p>
                      <div className="flex justify-center mt-2">
                        <div className="w-6 h-6 bg-cyan-50 rounded-lg flex items-center justify-center">
                          <FiActivity className="w-3 h-3 text-cyan-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl hover:bg-emerald-50 transition-colors duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">All systems operational</p>
                          <p className="text-xs text-gray-500">Zero downtime this month</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl hover:bg-blue-50 transition-colors duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FiClock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Last backup completed</p>
                          <p className="text-xs text-gray-500">2 minutes ago • 99.9% success rate</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Compact Data Visualization */}
                  <div className="mt-6 space-y-4">
                    {/* Trend Chart & Pie Chart Row */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Compact Trend Chart */}
                      <div className="col-span-2 p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100/50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-gray-900">Performance Trends</p>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-600">LIVE</span>
                          </div>
                        </div>

                        <div className="relative h-20 mb-2">
                          <svg className="w-full h-full" viewBox="0 0 200 80">
                            <defs>
                              <linearGradient id="trend1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#000" stopOpacity="0.9"/>
                                <stop offset="100%" stopColor="#000" stopOpacity="0.3"/>
                              </linearGradient>
                              <linearGradient id="trend2" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6B7280" stopOpacity="0.9"/>
                                <stop offset="100%" stopColor="#6B7280" stopOpacity="0.3"/>
                              </linearGradient>
                            </defs>
                            <path d="M0,60 Q25,45 50,50 T100,40 T150,35 T200,30" stroke="url(#trend1)" strokeWidth="2" fill="none"/>
                            <path d="M0,70 Q25,60 50,65 T100,55 T150,50 T200,45" stroke="url(#trend2)" strokeWidth="1.5" fill="none" style={{animationDelay: '0.3s'}}/>
                          </svg>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-0.5 bg-black"></div>
                              <span>Perf</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-0.5 bg-gray-500"></div>
                              <span>Attend</span>
                            </div>
                          </div>
                          <span>30d</span>
                        </div>
                      </div>

                      {/* Compact Pie Chart */}
                      <div className="p-4 bg-gradient-to-br from-white to-gray-50 border border-gray-100/50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-gray-900">Grades</p>
                          <FiPieChart className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="relative h-16 flex items-center justify-center">
                          <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 100 100">
                            <defs>
                              <linearGradient id="miniGradeA" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#000"/>
                                <stop offset="100%" stopColor="#374151"/>
                              </linearGradient>
                              <linearGradient id="miniGradeB" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6B7280"/>
                                <stop offset="100%" stopColor="#9CA3AF"/>
                              </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="35" fill="none" stroke="#F3F4F6" strokeWidth="6"/>
                            <circle cx="50" cy="50" r="35" fill="none" stroke="url(#miniGradeA)" strokeWidth="6" strokeDasharray="70 219.9" strokeDashoffset="0"/>
                            <circle cx="50" cy="50" r="35" fill="none" stroke="url(#miniGradeB)" strokeWidth="6" strokeDasharray="56 219.9" strokeDashoffset="-70"/>
                          </svg>

                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">92%</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-3 mt-2">
                          <div className="flex items-center space-x-1 text-xs">
                            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                            <span className="text-gray-600">A</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                            <span className="text-gray-600">B</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Activity & Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Compact Activity Feed */}
                      <div className="p-4 bg-gradient-to-br from-white to-gray-50 border border-gray-100/50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-gray-900">Live Activity</p>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <FiUser className="w-3 h-3 text-green-600" />
                            <span className="text-gray-700 truncate">Ahmed logged in • 2m ago</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <FiFileText className="w-3 h-3 text-blue-600" />
                            <span className="text-gray-700 truncate">Grade submitted • 5m ago</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <FiMessageSquare className="w-3 h-3 text-purple-600" />
                            <span className="text-gray-700 truncate">Parent message • 8m ago</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>47 active</span>
                            <span>99.8% uptime</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="p-4 bg-gradient-to-br from-black via-gray-900 to-black border border-gray-600 rounded-xl text-white">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-bold text-white">AI Insights</p>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className="text-xl font-bold text-green-400 mb-1">96.8%</div>
                            <p className="text-xs text-gray-300">Attendance</p>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-blue-400 mb-1">4.8</div>
                            <p className="text-xs text-gray-300">Avg Grade</p>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-purple-400 mb-1">24</div>
                            <p className="text-xs text-gray-300">Classes</p>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white mb-1">1.2k</div>
                            <p className="text-xs text-gray-300">Students</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-300">
                          <FiTrendingUp className="w-3 h-3 text-green-400" />
                          <span>+12.5% growth</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <span className="text-sm mb-2">Scroll to explore</span>
              <FiChevronDown className="w-6 h-6 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
        <motion.div
                key={index}
          initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    {stat.iconName === "Users" && <FiUsers />}
                    {stat.iconName === "Award" && <FiAward />}
                    {stat.iconName === "Clock" && <FiClock />}
                    {stat.iconName === "TrendingUp" && <FiTrendingUp />}
                  </div>
                </div>
                <div className="text-2xl font-bold text-black mb-1">{stat.number}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Simple & Modern */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              Powerful Features for Modern Schools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your Islamic school efficiently.
            </p>
          </div>

          {/* Modern Card Layout */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.slice(0, 6).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-black/10 h-full">
                  {/* Icon with background */}
                  <div className="relative mb-6">
                    <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {feature.iconName === "Users" && <FiUsers className="w-6 h-6" />}
                      {feature.iconName === "BarChart" && <FiBarChart className="w-6 h-6" />}
                      {feature.iconName === "DollarSign" && <FiDollarSign className="w-6 h-6" />}
                      {feature.iconName === "Smartphone" && <FiSmartphone className="w-6 h-6" />}
                      {feature.iconName === "Shield" && <FiShield className="w-6 h-6" />}
                      {feature.iconName === "Zap" && <FiZap className="w-6 h-6" />}
                      {feature.iconName === "Activity" && <FiActivity className="w-6 h-6" />}
                      {feature.iconName === "Layers" && <FiLayers className="w-6 h-6" />}
                      {feature.iconName === "Database" && <FiDatabase className="w-6 h-6" />}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-black mb-3 group-hover:text-gray-900 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Subtle hover indicator */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center">
                      <FiArrowRight className="w-4 h-4 text-black/40" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
              Ready to Transform Your School?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of Islamic schools already using Darulkubra to streamline their operations
              and enhance educational outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsSidePanelOpen(true)}
                className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300"
              >
                <FiPlus className="mr-3 w-5 h-5" />
                Start Free Trial
                <FiArrowRight className="ml-3" />
              </button>

              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-all duration-300"
              >
                <FiLogIn className="mr-3 w-5 h-5" />
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* How It Works Section - Enhanced Professional Design */}
      <section id="how-it-works" className="py-32 relative" style={{ backgroundColor: 'whitesmoke' }}>
           {/* Creative Implementation Journey */}
        {/* Warm Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B4513' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm-2 0c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm-6-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Creative Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full text-sm font-semibold mb-8 shadow-lg">
              <FiZap className="w-5 h-5 mr-3" />
              YOUR JOURNEY STARTS HERE
            </div>
            <h2 className="text-6xl lg:text-7xl font-bold text-black mb-8 leading-tight">
              Transform
              <span className="block text-gray-700">Your Vision</span>
            </h2>
            <p className="text-2xl text-gray-800 max-w-4xl mx-auto leading-relaxed">
              Four simple steps to revolutionize your educational institution.
              From setup to success, we're with you every step of the way.
            </p>
          </div>

          {/* Interactive Journey Cards */}
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {[
                {
                  step: "01",
                  title: "Welcome Aboard",
                  subtitle: "Your journey begins",
                  description: "Quick account creation with personalized guidance. We handle the setup so you can focus on what matters most.",
                  icon: FiUserCheck,
                  color: "from-gray-800 to-black",
                  time: "2 min",
                  highlight: "Instant access"
                },
                {
                  step: "02",
                  title: "Shape Your Space",
                  subtitle: "Make it yours",
                  description: "Customize your digital environment. Add your school's branding, configure workflows, and set user permissions.",
                  icon: FiSettings,
                  color: "from-gray-800 to-black",
                  time: "1-2 days",
                  highlight: "Full customization"
                },
                {
                  step: "03",
                  title: "Bring Your Data",
                  subtitle: "Seamless migration",
                  description: "Secure transfer of all your important information. Students, teachers, records - everything moves safely.",
                  icon: FiUpload,
                  color: "from-gray-800 to-black",
                  time: "3-5 days",
                  highlight: "100% secure"
                },
                {
                  step: "04",
                  title: "Launch & Thrive",
                  subtitle: "Your success story",
                  description: "Go live with confidence. Comprehensive training, ongoing support, and continuous improvements await.",
                  icon: FiPlay,
                  color: "from-gray-800 to-black",
                  time: "Ongoing",
                  highlight: "24/7 support"
                }
              ].map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="group relative">
                    {/* Floating Background */}
                    <div className="absolute -inset-4 bg-black/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>

                    {/* Main Card */}
                    <div className="relative bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                      {/* Step Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {step.step}
                        </div>
                      </div>

                      {/* Icon */}
                      <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8" />
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-black mb-1">{step.title}</h3>
                          <p className="text-sm text-gray-600 font-medium">{step.subtitle}</p>
                        </div>

                        <p className="text-gray-700 leading-relaxed text-sm">
                          {step.description}
                        </p>

                        {/* Time & Highlight */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center text-sm">
                            <FiClock className="w-4 h-4 mr-2 text-black" />
                            <span className="font-semibold text-black">{step.time}</span>
                          </div>
                          <div className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full">
                            {step.highlight}
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Border */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`}></div>
                    </div>

                    {/* Connecting Arrow (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 bg-amber-800 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <FiArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Creative CTA Section */}
            <div className="text-center mt-20">
              {/* Progress Indicator */}
              <div className="flex justify-center items-center space-x-4 mb-8">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((dot) => (
                    <div key={dot} className="w-3 h-3 bg-amber-300 rounded-full"></div>
                  ))}
                </div>
                <span className="text-black font-semibold">4 Steps to Success</span>
              </div>

              {/* Main CTA */}
              <div className="max-w-2xl mx-auto mb-8">
                <h3 className="text-4xl font-bold text-black mb-4">
                  Ready to Begin Your Transformation?
                </h3>
                <p className="text-xl text-gray-700">
                  Join thousands of educational institutions already thriving with Darulkubra.
                  Your success story starts with one click.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                <button
                  onClick={() => setIsRegistrationModalOpen(true)}
                  className="group px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-bold rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center">
                    Start Your Journey
                    <FiArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
                <button className="px-10 py-5 border-3 border-amber-800 text-amber-900 font-bold rounded-3xl hover:bg-amber-50 transition-all duration-300">
                  Learn More
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-center space-x-2 text-black">
                  <FiShield className="w-5 h-5" />
                  <span className="font-semibold">Free 30-Day Trial</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-black">
                  <FiClock className="w-5 h-5" />
                  <span className="font-semibold">Average 14 Days Setup</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-black">
                  <FiHeadphones className="w-5 h-5" />
                  <span className="font-semibold">Dedicated Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Process Demo */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                See It In Action
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Experience how Darulkubra transforms school management with our interactive demo.
                Watch real workflows in action.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <FiMonitor />, title: "Admin Dashboard", desc: "Complete school overview at a glance" },
                  { icon: <FiUsers />, title: "Student Portal", desc: "Personalized learning experience" },
                  { icon: <FiBarChart />, title: "Analytics Center", desc: "Data-driven insights and reports" },
                  { icon: <FiPhone />, title: "Mobile App", desc: "Access anywhere, anytime" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-8 inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FiPlay className="mr-3 w-5 h-5" />
                Watch Full Demo
              </motion.button>
            </motion.div>

            {/* Interactive Slider - Responsive Design */}
            <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-4">
              {/* Mobile-First Slider Navigation */}
              <div className="flex flex-col items-center space-y-6 mb-8">
                {/* Tab Labels - Responsive Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md md:max-w-none">
                  {[
                    { id: 'admin', label: 'Admin', icon: FiBarChart },
                    { id: 'student', label: 'Student', icon: FiUsers },
                    { id: 'mobile', label: 'Mobile', icon: FiSmartphone },
                    { id: 'analytics', label: 'Analytics', icon: FiTrendingUp }
                  ].map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => setActiveTab(slide.id)}
                      className={`px-3 py-3 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 ${
                        activeTab === slide.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <slide.icon className="w-4 h-4" />
                      <span className="text-xs md:text-sm">{slide.label}</span>
                    </button>
                  ))}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center space-x-4">
                  {/* Previous Button */}
                  <button
                    onClick={() => {
                      const slides = ['admin', 'student', 'mobile', 'analytics'];
                      const currentIndex = slides.indexOf(activeTab);
                      const prevIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
                      setActiveTab(slides[prevIndex]);
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                  >
                    <FiChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                  </button>

                  {/* Progress Indicators */}
                  <div className="flex space-x-2">
                    {['admin', 'student', 'mobile', 'analytics'].map((slideId, index) => (
                      <button
                        key={slideId}
                        onClick={() => setActiveTab(slideId)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                          activeTab === slideId
                            ? 'bg-blue-500 scale-125'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => {
                      const slides = ['admin', 'student', 'mobile', 'analytics'];
                      const currentIndex = slides.indexOf(activeTab);
                      const nextIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
                      setActiveTab(slides[nextIndex]);
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                  >
                    <FiChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Tab Content Container */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {/* Admin Dashboard Tab */}
                  {activeTab === 'admin' && (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <FiBarChart className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">Admin Dashboard</h3>
                              <p className="text-gray-300 text-sm">Real-time analytics & insights</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-medium">Live</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        {/* Interactive KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          <motion.div
                            className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <FiUsers className="w-6 h-6 text-blue-600" />
                              <span className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full">+12%</span>
                            </div>
                            <div className="text-3xl font-bold text-blue-900 mb-1">1,247</div>
                            <div className="text-sm text-blue-700">Active Students</div>
                            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "87%" }}
                                transition={{ duration: 1.5, delay: 0.2 }}
                              />
                            </div>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <FiCheckCircle className="w-6 h-6 text-green-600" />
                              <span className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full">+2.1%</span>
                            </div>
                            <div className="text-3xl font-bold text-green-900 mb-1">96.8%</div>
                            <div className="text-sm text-green-700">Attendance Rate</div>
                            <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "96.8%" }}
                                transition={{ duration: 1.5, delay: 0.4 }}
                              />
                            </div>
                          </motion.div>
                        </div>

                        {/* Advanced Analytics Chart */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-900">Enrollment Trend</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">+15%</span>
                              <span className="text-xs text-gray-500">30 days</span>
                            </div>
                          </div>
                          <div className="h-32 relative">
                            <svg className="w-full h-full" viewBox="0 0 200 80">
                              <defs>
                                <linearGradient id="enrollmentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                                </linearGradient>
                                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                                </linearGradient>
                              </defs>

                              {/* Grid lines */}
                              <path d="M0,20 L200,20 M0,40 L200,40 M0,60 L200,60" stroke="#e5e7eb" strokeWidth="1"/>

                              {/* Area chart */}
                              <motion.path
                                d="M0,70 Q25,65 50,60 T100,45 T150,35 T200,30 L200,80 L0,80 Z"
                                fill="url(#enrollmentGradient)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: 0.5 }}
                              />

                              {/* Line chart */}
                              <motion.path
                                d="M0,70 Q25,65 50,60 T100,45 T150,35 T200,30"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: 0.7 }}
                              />

                              {/* Data points */}
                              {[70,65,60,45,35,30].map((y, i) => (
                                <motion.circle
                                  key={i}
                                  cx={i * 40}
                                  cy={y}
                                  r="3"
                                  fill="#3b82f6"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.9 + i * 0.1 }}
                                  className="cursor-pointer hover:r-4"
                                />
                              ))}
                            </svg>

                            {/* Interactive tooltips */}
                            <div className="absolute top-4 left-8 bg-white p-2 rounded-lg shadow-lg border border-gray-200 opacity-0 hover:opacity-100 transition-opacity">
                              <div className="text-xs text-gray-600">Week 1: 142 enrollments</div>
                            </div>
                          </div>
                        </div>

                        {/* System Health & Activity */}
                        <div className="grid grid-cols-1 gap-4">
                          <motion.div
                            className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border border-emerald-200"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <svg className="w-10 h-10" viewBox="0 0 36 36">
                                    <motion.path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="3"
                                      strokeDasharray="85, 100"
                                      initial={{ strokeDasharray: "0, 100" }}
                                      animate={{ strokeDasharray: "95, 100" }}
                                      transition={{ duration: 2, delay: 1 }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-green-700">95%</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">System Health</div>
                                  <div className="text-xs text-gray-600">All systems operational</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">99.9%</div>
                                <div className="text-xs text-gray-600">Uptime</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Database: Online</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-700">Backup: Active</span>
                              </div>
                            </div>
                          </motion.div>

                          {/* Recent Activity Feed */}
                          <motion.div
                            className="bg-white p-4 rounded-xl border border-gray-200"
                            whileHover={{ y: -1 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-900">Recent Activity</span>
                              <div className="flex items-center space-x-2">
                                <motion.div
                                  className="w-2 h-2 bg-green-500 rounded-full"
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <span className="text-xs text-gray-600">Live</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <motion.div
                                className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                              >
                                <FiUser className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-800">Ahmed logged in • 2m ago</span>
                              </motion.div>
                              <motion.div
                                className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                              >
                                <FiFileText className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800">Grade submitted • 5m ago</span>
                              </motion.div>
                              <motion.div
                                className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.6 }}
                              >
                                <FiMessageSquare className="w-4 h-4 text-purple-600" />
                                <span className="text-sm text-purple-800">Parent message • 8m ago</span>
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Student Portal Tab */}
                  {activeTab === 'student' && (
                    <motion.div
                      key="student"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <FiUsers className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">Student Portal</h3>
                              <p className="text-gray-300 text-sm">Personalized learning experience</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-medium">Online</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        {/* Student Profile Header */}
                        <div className="flex items-center space-x-4 mb-6">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                            whileHover={{ scale: 1.05 }}
                          >
                            A
                          </motion.div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 text-lg">Ahmed Al-Rashid</div>
                            <div className="text-sm text-gray-600">Grade 10 • Section A • Student ID: 2024001</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 font-medium">Active Student</span>
                            </div>
                          </div>
                        </div>

                        {/* Today's Schedule */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-4">Today's Schedule</h4>
                          <div className="space-y-3">
                            {[
                              { subject: 'Mathematics', time: '9:00 AM', room: 'Room 201', status: 'current', progress: 65 },
                              { subject: 'Arabic Language', time: '10:30 AM', room: 'Room 105', status: 'upcoming', progress: 0 },
                              { subject: 'Islamic Studies', time: '1:00 PM', room: 'Room 301', status: 'upcoming', progress: 0 },
                              { subject: 'Science', time: '2:30 PM', room: 'Lab 1', status: 'upcoming', progress: 0 }
                            ].map((class_, index) => (
                              <motion.div
                                key={index}
                                className={`p-4 rounded-xl border transition-all duration-300 ${
                                  class_.status === 'current'
                                    ? 'bg-blue-50 border-blue-200 shadow-md'
                                    : 'bg-white border-gray-200 hover:shadow-md'
                                }`}
                                whileHover={{ scale: class_.status === 'current' ? 1 : 1.01 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      class_.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                                    }`}></div>
                                    <span className="font-medium text-gray-900">{class_.subject}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">{class_.time}</div>
                                    <div className="text-xs text-gray-600">{class_.room}</div>
                                  </div>
                                </div>
                                {class_.status === 'current' && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>Class Progress</span>
                                      <span>{class_.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <motion.div
                                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${class_.progress}%` }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Academic Performance Chart */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 md:p-5 rounded-xl border border-indigo-200 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-900">Academic Performance</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+8%</span>
                              <span className="text-xs text-gray-500">This month</span>
                            </div>
                          </div>

                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <div className="text-2xl font-bold text-indigo-600 mb-1">85%</div>
                              <div className="text-xs text-gray-600">Overall Grade</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <div className="text-2xl font-bold text-green-600 mb-1">92%</div>
                              <div className="text-xs text-gray-600">Attendance</div>
                            </div>
                          </div>

                          {/* Subject Performance Radar */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-sm font-medium text-gray-900 mb-3">Subject Performance</div>
                            <div className="relative h-32 flex items-center justify-center">
                              <svg className="w-24 h-24" viewBox="0 0 100 100">
                                <defs>
                                  <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3"/>
                                  </linearGradient>
                                </defs>

                                {/* Radar background circles */}
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                                <circle cx="50" cy="50" r="25" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                                <circle cx="50" cy="50" r="10" fill="none" stroke="#e5e7eb" strokeWidth="1"/>

                                {/* Radar lines */}
                                <line x1="50" y1="10" x2="50" y2="90" stroke="#e5e7eb" strokeWidth="1"/>
                                <line x1="10" y1="50" x2="90" y2="50" stroke="#e5e7eb" strokeWidth="1"/>

                                {/* Performance polygon */}
                                <motion.polygon
                                  points="50,20 70,35 65,65 35,65 30,35"
                                  fill="url(#radarGradient)"
                                  stroke="#6366f1"
                                  strokeWidth="2"
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 0.7, scale: 1 }}
                                  transition={{ duration: 1, delay: 0.8 }}
                                />

                                {/* Data points */}
                                <circle cx="50" cy="20" r="3" fill="#6366f1"/>
                                <circle cx="70" cy="35" r="3" fill="#8b5cf6"/>
                                <circle cx="65" cy="65" r="3" fill="#ec4899"/>
                                <circle cx="35" cy="65" r="3" fill="#10b981"/>
                                <circle cx="30" cy="35" r="3" fill="#f59e0b"/>
                              </svg>

                              {/* Subject labels */}
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 text-xs text-gray-600">Math</div>
                              <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 text-xs text-gray-600">Arabic</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 text-xs text-gray-600">Science</div>
                              <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 text-xs text-gray-600">Islamic</div>
                              <div className="absolute top-1/4 right-1/4 text-xs text-gray-600">English</div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                          <motion.button
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiFileText className="w-5 h-5 mx-auto mb-2" />
                            <div className="text-sm">View Assignments</div>
                          </motion.button>

                          <motion.button
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiMessageSquare className="w-5 h-5 mx-auto mb-2" />
                            <div className="text-sm">Contact Teacher</div>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Mobile App Tab */}
                  {activeTab === 'mobile' && (
                    <motion.div
                      key="mobile"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <FiSmartphone className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">Mobile App</h3>
                              <p className="text-gray-300 text-sm">Complete mobile experience</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-medium">Live</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        {/* Phone Mockup */}
                        <div className="flex justify-center mb-6">
                          <div className="relative">
                            {/* Phone frame */}
                            <div className="w-40 h-80 md:w-48 md:h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                              <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                                {/* Status bar */}
                                <div className="bg-black text-white px-4 py-1 flex justify-between items-center text-xs">
                                  <span>9:41</span>
                                  <div className="flex space-x-1">
                                    <span>📶</span>
                                    <span>📶</span>
                                    <span>🔋</span>
                                  </div>
                                </div>

                                {/* App Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm">Darulkubra</span>
                                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                      <span className="text-xs">●</span>
                                    </div>
                                  </div>
                                  <div className="text-xs opacity-90 mt-1">Welcome back, Ahmed!</div>
                                </div>

                                {/* App Content */}
                                <div className="p-4 space-y-4">
                                  {/* Quick Stats */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <motion.div
                                      className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                                      whileHover={{ scale: 1.02 }}
                                    >
                                      <div className="text-lg font-bold text-blue-600">96%</div>
                                      <div className="text-xs text-blue-700">Attendance</div>
                                    </motion.div>
                                    <motion.div
                                      className="bg-green-50 p-3 rounded-lg border border-green-200"
                                      whileHover={{ scale: 1.02 }}
                                    >
                                      <div className="text-lg font-bold text-green-600">A+</div>
                                      <div className="text-xs text-green-700">Grade</div>
                                    </motion.div>
                                  </div>

                                  {/* Today's Classes */}
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Today's Classes</h4>
                                    <div className="space-y-2">
                                      <motion.div
                                        className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200"
                                        whileHover={{ scale: 1.01 }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-sm font-medium">Mathematics</span>
                                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">9:00 AM</span>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-1">
                                          <motion.div
                                            className="bg-blue-500 h-1 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: "65%" }}
                                            transition={{ duration: 1.5, delay: 0.3 }}
                                          />
                                        </div>
                                      </motion.div>

                                      <motion.div
                                        className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                                        whileHover={{ scale: 1.01 }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-sm font-medium">Arabic Language</span>
                                          <span className="text-xs text-gray-600">10:30 AM</span>
                                        </div>
                                      </motion.div>
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Actions</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                      <motion.button
                                        className="bg-blue-500 text-white p-3 rounded-lg flex flex-col items-center"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <FiCheckCircle className="w-4 h-4 mb-1" />
                                        <span className="text-xs">Mark</span>
                                      </motion.button>
                                      <motion.button
                                        className="bg-green-500 text-white p-3 rounded-lg flex flex-col items-center"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <FiCalendar className="w-4 h-4 mb-1" />
                                        <span className="text-xs">Schedule</span>
                                      </motion.button>
                                      <motion.button
                                        className="bg-purple-500 text-white p-3 rounded-lg flex flex-col items-center"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <FiMessageSquare className="w-4 h-4 mb-1" />
                                        <span className="text-xs">Chat</span>
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Navigation */}
                                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2">
                                  <div className="flex justify-around">
                                    <motion.button
                                      className="flex flex-col items-center text-blue-500"
                                      whileHover={{ scale: 1.1 }}
                                    >
                                      <FiHome className="w-5 h-5 mb-1" />
                                      <span className="text-xs">Home</span>
                                    </motion.button>
                                    <motion.button
                                      className="flex flex-col items-center text-gray-400"
                                      whileHover={{ scale: 1.1 }}
                                    >
                                      <FiCalendar className="w-5 h-5 mb-1" />
                                      <span className="text-xs">Schedule</span>
                                    </motion.button>
                                    <motion.button
                                      className="flex flex-col items-center text-gray-400"
                                      whileHover={{ scale: 1.1 }}
                                    >
                                      <FiBell className="w-5 h-5 mb-1" />
                                      <span className="text-xs">Alerts</span>
                                    </motion.button>
                                    <motion.button
                                      className="flex flex-col items-center text-gray-400"
                                      whileHover={{ scale: 1.1 }}
                                    >
                                      <FiUser className="w-5 h-5 mb-1" />
                                      <span className="text-xs">Profile</span>
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Phone highlights */}
                            <motion.div
                              className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-black rounded-b-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* Mobile Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <motion.div
                            className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200"
                            whileHover={{ scale: 1.02, y: -2 }}
                          >
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                              <FiZap className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Offline Mode</h4>
                            <p className="text-xs text-gray-600">Access content without internet</p>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200"
                            whileHover={{ scale: 1.02, y: -2 }}
                          >
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                              <FiBell className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Smart Notifications</h4>
                            <p className="text-xs text-gray-600">Personalized alerts & reminders</p>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200"
                            whileHover={{ scale: 1.02, y: -2 }}
                          >
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                              <FiDownload className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Resource Download</h4>
                            <p className="text-xs text-gray-600">Save materials for later</p>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200"
                            whileHover={{ scale: 1.02, y: -2 }}
                          >
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                              <FiMessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Instant Chat</h4>
                            <p className="text-xs text-gray-600">Direct communication</p>
                          </motion.div>
                        </div>

                        {/* Download Stats */}
                        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">App Performance</h4>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600">Excellent</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-blue-600">4.8</div>
                              <div className="text-xs text-gray-600">App Store</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-600">10K+</div>
                              <div className="text-xs text-gray-600">Downloads</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-600">99%</div>
                              <div className="text-xs text-gray-600">Uptime</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Analytics Tab */}
                  {activeTab === 'analytics' && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                              <FiTrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">Analytics Dashboard</h3>
                              <p className="text-gray-300 text-sm">Advanced data insights & reporting</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-medium">Real-time</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <motion.div
                            className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <FiTrendingUp className="w-6 h-6 text-green-600" />
                              <span className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full">+15%</span>
                            </div>
                            <div className="text-3xl font-bold text-green-900">94.2%</div>
                            <div className="text-sm text-green-700">Student Engagement</div>
                            <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                              <motion.div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "94.2%" }}
                                transition={{ duration: 1.5, delay: 0.2 }}
                              />
                            </div>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <FiUsers className="w-6 h-6 text-blue-600" />
                              <span className="text-blue-600 text-sm font-medium bg-blue-100 px-2 py-1 rounded-full">+8%</span>
                            </div>
                            <div className="text-3xl font-bold text-blue-900">2.4K</div>
                            <div className="text-sm text-blue-700">Active Users</div>
                            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 1.5, delay: 0.4 }}
                              />
                            </div>
                          </motion.div>
                        </div>

                        {/* Advanced Performance Chart */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Performance Analytics</h4>
                            <div className="flex items-center space-x-3">
                              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Last 7 days</option>
                                <option>Last 30 days</option>
                                <option>Last 3 months</option>
                              </select>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">↗️ +15%</span>
                            </div>
                          </div>

                          <div className="h-32 md:h-40 relative mb-4">
                            <svg className="w-full h-full" viewBox="0 0 280 120">
                              <defs>
                                <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4"/>
                                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5"/>
                                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                                </linearGradient>
                                <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6"/>
                                  <stop offset="100%" stopColor="#1e40af"/>
                                </linearGradient>
                              </defs>

                              {/* Grid lines */}
                              <path d="M0,30 L280,30 M0,60 L280,60 M0,90 L280,90" stroke="#f3f4f6" strokeWidth="1"/>

                              {/* Area chart background */}
                              <motion.path
                                d="M0,110 Q35,100 70,85 T140,70 T210,60 T280,50 L280,120 L0,120 Z"
                                fill="url(#performanceGradient)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: 0.3 }}
                              />

                              {/* Bar chart overlay */}
                              {[
                                { x: 20, height: 60, label: 'M' },
                                { x: 50, height: 85, label: 'T' },
                                { x: 80, height: 70, label: 'W' },
                                { x: 110, height: 95, label: 'T' },
                                { x: 140, height: 80, label: 'F' },
                                { x: 170, height: 90, label: 'S' },
                                { x: 200, height: 75, label: 'S' }
                              ].map((bar, i) => (
                                <motion.rect
                                  key={i}
                                  x={bar.x}
                                  y={110 - bar.height}
                                  width="20"
                                  height={bar.height}
                                  fill="url(#barGradient)"
                                  initial={{ scaleY: 0 }}
                                  animate={{ scaleY: 1 }}
                                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                                  className="cursor-pointer hover:opacity-80"
                                />
                              ))}

                              {/* Data points on line */}
                              {[
                                { cx: 35, cy: 100, value: '85%' },
                                { cx: 105, cy: 75, value: '92%' },
                                { cx: 175, cy: 65, value: '88%' },
                                { cx: 245, cy: 55, value: '95%' }
                              ].map((point, i) => (
                                <motion.circle
                                  key={i}
                                  cx={point.cx}
                                  cy={point.cy}
                                  r="4"
                                  fill="#ef4444"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.5, delay: 1 + i * 0.2 }}
                                  className="cursor-pointer"
                                />
                              ))}
                            </svg>

                            {/* Interactive tooltip */}
                            <motion.div
                              className="absolute top-8 left-16 bg-gray-900 text-white p-2 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                            >
                              <div>Peak Performance: 95%</div>
                              <div className="text-gray-300">Thursday, 2:30 PM</div>
                            </motion.div>
                          </div>

                          {/* Chart labels */}
                          <div className="flex justify-between text-xs text-gray-500 px-4">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                          </div>
                        </div>

                        {/* Detailed Analytics Grid */}
                        <div className="grid grid-cols-1 gap-4 mb-6">
                          {/* Subject Performance Breakdown */}
                          <motion.div
                            className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900">Subject Performance</h4>
                              <FiBarChart className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="space-y-3">
                              {[
                                { subject: 'Mathematics', score: 92, change: '+5%', color: 'blue' },
                                { subject: 'Arabic Language', score: 88, change: '+2%', color: 'green' },
                                { subject: 'Islamic Studies', score: 95, change: '+8%', color: 'purple' },
                                { subject: 'Science', score: 87, change: '-1%', color: 'orange' }
                              ].map((item, index) => (
                                <motion.div
                                  key={index}
                                  className="flex items-center justify-between"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 * index }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 bg-${item.color}-500 rounded-full`}></div>
                                    <span className="text-sm font-medium text-gray-900">{item.subject}</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <motion.div
                                        className={`h-2 bg-${item.color}-500 rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.score}%` }}
                                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 w-8">{item.score}%</span>
                                    <span className={`text-xs ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                      {item.change}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                          {/* System Insights */}
                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-200"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900">System Insights</h4>
                              <div className="flex items-center space-x-2">
                                <motion.div
                                  className="w-2 h-2 bg-green-500 rounded-full"
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="text-xs text-green-600">Live monitoring</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FiServer className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium">Server Load</span>
                                </div>
                                <div className="text-lg font-bold text-blue-600">23%</div>
                                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                  <motion.div
                                    className="h-2 bg-blue-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: "23%" }}
                                    transition={{ duration: 1, delay: 0.8 }}
                                  />
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FiActivity className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">API Response</span>
                                </div>
                                <div className="text-lg font-bold text-green-600">145ms</div>
                                <div className="text-xs text-green-600 mt-1">Excellent</div>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FiDatabase className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium">Data Sync</span>
                                </div>
                                <div className="text-lg font-bold text-purple-600">99.9%</div>
                                <div className="text-xs text-purple-600 mt-1">Reliability</div>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FiShield className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-medium">Security</span>
                                </div>
                                <div className="text-lg font-bold text-orange-600">A+</div>
                                <div className="text-xs text-orange-600 mt-1">Grade</div>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Export & Actions */}
                        <div className="flex space-x-3">
                          <motion.button
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiDownload className="w-4 h-4 mr-2 inline" />
                            Export Report
                          </motion.button>
                          <motion.button
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiSettings className="w-4 h-4 mr-2 inline" />
                            Configure
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

              {/* Admin Dashboard - Grid Item 1 */}
             

              {/* Ultra-Enhanced Analytics Dashboard - Asymmetric Floating Screen */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
                viewport={{ once: true }}
                className="absolute bottom-10 right-20 w-80 h-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 hover:shadow-3xl transition-shadow duration-500"
                whileHover={{ scale: 1.02, rotate: 2 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Enhanced Analytics Header with Gradient */}
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 text-white px-5 py-4 relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <motion.div
                      className="absolute top-0 left-0 w-20 h-20 bg-white/20 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-lg"
                      animate={{
                        scale: [1.5, 1, 1.5],
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <FiBarChart className="w-4 h-4 text-white" />
                      </motion.div>
                      <div>
                        <span className="text-sm font-bold">Analytics Dashboard</span>
                        <div className="text-xs opacity-90">Real-time insights</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <motion.div
                        className="w-2 h-2 bg-green-300 rounded-full shadow-lg"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-xs font-medium">Live</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Analytics Content with Multiple Charts */}
                <div className="p-5 bg-gradient-to-br from-gray-50 to-white h-full overflow-hidden">
                  {/* Key Metrics Row */}
                  <motion.div
                    className="grid grid-cols-2 gap-4 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="text-lg font-bold text-green-600 mb-1">94.2%</div>
                      <div className="text-xs text-gray-600">Engagement</div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-green-600">↗️ +5.1%</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="text-lg font-bold text-blue-600 mb-1">2.4K</div>
                      <div className="text-xs text-gray-600">Active Users</div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-blue-600">↗️ +12%</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Enhanced Performance Chart */}
                  <motion.div
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">Weekly Performance</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">This Week</span>
                      </div>
                    </div>

                    {/* Interactive Bar Chart with Hover Effects */}
                    <div className="relative h-20 mb-3">
                      <div className="flex items-end space-x-2 h-full">
                        {[
                          { day: 'Mon', value: 65, color: 'from-blue-400 to-blue-600' },
                          { day: 'Tue', value: 78, color: 'from-green-400 to-green-600' },
                          { day: 'Wed', value: 82, color: 'from-purple-400 to-purple-600' },
                          { day: 'Thu', value: 75, color: 'from-orange-400 to-orange-600' },
                          { day: 'Fri', value: 88, color: 'from-pink-400 to-pink-600' },
                          { day: 'Sat', value: 72, color: 'from-indigo-400 to-indigo-600' },
                          { day: 'Sun', value: 85, color: 'from-teal-400 to-teal-600' }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 flex flex-col items-center group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                          >
                            <motion.div
                              className={`w-full bg-gradient-to-t ${item.color} rounded-t-lg shadow-sm relative overflow-hidden`}
                              style={{ height: `${item.value}%` }}
                              initial={{ height: 0 }}
                              animate={{ height: `${item.value}%` }}
                              transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {/* Animated shine effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent"
                                animate={{
                                  y: [-100, 100],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  delay: i * 0.3,
                                  ease: "easeInOut"
                                }}
                              />

                              {/* Value tooltip on hover */}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  {item.value}%
                                </div>
                              </div>
                            </motion.div>
                            <span className="text-xs text-gray-600 mt-2 font-medium">{item.day}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Trend indicator with animation */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Performance Trend</span>
                      <div className="flex items-center space-x-1">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <FiTrendingUp className="w-3 h-3 text-green-600" />
                        </motion.div>
                        <span className="text-xs text-green-600 font-medium">+15.2%</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Mini Subject Performance Radar */}
                  <motion.div
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-200"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-900">Subject Performance</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Real-time</span>
                    </div>

                    {/* Compact Radar Chart */}
                    <div className="relative h-16 flex items-center justify-center">
                      <svg className="w-16 h-16" viewBox="0 0 100 100">
                        {/* Radar grid */}
                        <polygon
                          points="50,15 80,35 80,65 50,85 20,65 20,35"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />

                        {/* Data polygon with animation */}
                        <motion.polygon
                          points="50,30 70,40 65,65 50,75 35,65 40,40"
                          fill="url(#radarMiniGradient)"
                          stroke="url(#radarMiniStroke)"
                          strokeWidth="2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                          transition={{ duration: 1, delay: 0.6 }}
                        />

                        <defs>
                          <linearGradient id="radarMiniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                          </linearGradient>
                          <linearGradient id="radarMiniStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6"/>
                            <stop offset="100%" stopColor="#8b5cf6"/>
                          </linearGradient>
                        </defs>

                        {/* Data points */}
                        {[
                          { cx: 50, cy: 30, subject: 'Math' },
                          { cx: 70, cy: 40, subject: 'Arabic' },
                          { cx: 65, cy: 65, subject: 'Science' },
                          { cx: 50, cy: 75, subject: 'Quran' },
                          { cx: 35, cy: 65, subject: 'English' },
                          { cx: 40, cy: 40, subject: 'History' }
                        ].map((point, i) => (
                          <motion.circle
                            key={i}
                            cx={point.cx}
                            cy={point.cy}
                            r="2"
                            fill="#3b82f6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                          />
                        ))}
                      </svg>
                    </div>

                    {/* Subject labels in compact format */}
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Math: 88%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600">Arabic: 92%</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Interactive hover effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                  />
                </div>
              </motion.div>


            </div>
          </div>
          </section>
        
    

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #000 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4"
            >
              <FiZap className="w-4 h-4 mr-2" />
              Seamless Integrations
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Connect & Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Integrate with industry-leading tools to create a unified educational ecosystem
              that works seamlessly across all your platforms.
            </p>
          </motion.div>

          {/* Premium Card Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                name: "Zoom",
                icon: FiVideo,
                description: "Video conferencing & virtual classrooms",
                category: "Communication",
                gradient: "from-blue-500 to-cyan-600",
                features: ["HD Video", "Recording", "Breakout Rooms"]
              },
              {
                name: "Stripe",
                icon: FiCreditCard,
                description: "Secure payment processing & billing",
                category: "Finance",
                gradient: "from-purple-500 to-pink-600",
                features: ["PCI Compliant", "Global Payments", "Subscriptions"]
              },
              {
                name: "Telegram",
                icon: FiMessageSquare,
                description: "Instant messaging & notifications",
                category: "Communication",
                gradient: "from-blue-400 to-blue-600",
                features: ["Bot Integration", "Groups", "File Sharing"]
              },
              {
                name: "CSF Files",
                icon: FiFileText,
                description: "Secure document management",
                category: "Storage",
                gradient: "from-green-500 to-emerald-600",
                features: ["Encrypted", "Version Control", "Collaboration"]
              }
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                  rotateX: 5,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                {/* Card Container */}
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${integration.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>

                  {/* Category Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {integration.category}
                    </span>
                    <div className={`w-8 h-8 bg-gradient-to-r ${integration.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                      <integration.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Integration Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {integration.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {integration.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2">
                    {integration.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: (index * 0.15) + (featureIndex * 0.1) }}
                        viewport={{ once: true }}
                        className="flex items-center text-xs text-gray-500"
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                        {feature}
                      </motion.div>
                    ))}
                  </div>

                  {/* Hover Indicator */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${integration.gradient} origin-left`}
                  ></motion.div>
                </div>

                {/* Floating Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 transform group-hover:scale-105"></div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-8 border border-gray-200">
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="max-w-md mx-auto"
              >
                <FiPlus className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Need More Integrations?
                </h3>
                <p className="text-gray-600 mb-6">
                  We're constantly expanding our integration ecosystem. Tell us what you need!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FiMail className="mr-2 w-5 h-5" />
                  Request Integration
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { number: "50+", label: "Integrations" },
              { number: "99.9%", label: "Uptime" },
              { number: "<100ms", label: "Response Time" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 * index }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="text-3xl font-bold text-blue-600 group-hover:text-purple-600 transition-colors duration-300 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Your school's data is protected by military-grade security measures and compliance standards.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: <FiLock className="w-6 h-6" />,
                    title: "End-to-End Encryption",
                    description: "All data is encrypted in transit and at rest using AES-256 encryption standards."
                  },
                  {
                    icon: <FiShield className="w-6 h-6" />,
                    title: "GDPR & Privacy Compliant",
                    description: "Fully compliant with global privacy regulations and data protection laws."
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: <FiLock />, label: "SSL Encryption", status: "Active" },
                    { icon: <FiShield />, label: "Firewall", status: "Protected" },
                    { icon: <FiDatabase />, label: "Backup", status: "Daily" },
                    { icon: <FiEye />, label: "Monitoring", status: "24/7" },
                    { icon: <FiCode />, label: "Code Security", status: "Scanned" },
                    { icon: <FiServer />, label: "Infrastructure", status: "Redundant" }
                  ].map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.label}</div>
                          <div className="text-xs text-green-600">{item.status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Security Score</h4>
                    <span className="text-2xl font-bold text-green-600">98/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full" style={{width: '98%'}}></div>
                  </div>
                  <p className="text-sm text-gray-600">Excellent security posture maintained</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about Darulkubra. Can't find what you're looking for?
              <a href="#contact" className="text-blue-600 hover:text-blue-700 ml-1">Contact our support team</a>.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: "How long does it take to implement Darulkubra?",
                answer: "Implementation typically takes 2-4 weeks, depending on your school's size and data migration needs. Our team provides full support throughout the process."
              },
              {
                question: "Is my data secure with Darulkubra?",
                answer: "Absolutely. We use enterprise-grade security with end-to-end encryption, regular security audits, and comply with GDPR and other privacy regulations."
              },
              {
                question: "Can I customize the system for my school's needs?",
                answer: "Yes, our platform is highly customizable. You can configure workflows, branding, user roles, and many other aspects to match your school's requirements."
              },
             
              {
                question: "What kind of support do you offer?",
                answer: "We offer 24/7 technical support, regular feature updates, security patches, and dedicated account management for enterprise clients."
              },
              
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiHelpCircle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
          </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Contact Section - Clean & Minimal */}
      <section id="contact" className="py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-gray-800 text-sm font-medium mb-8">
              <FiMessageSquare className="w-4 h-4 mr-2" />
              Contact Us
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Let's Work Together
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to transform your educational institution? Get in touch with our team.
            </p>
          </div>

          {/* Contact Cards Row */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiMail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">support@darulkubra.com</p>
              <p className="text-sm text-gray-500 mt-1">24h response</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiPhone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
              <p className="text-sm text-gray-500 mt-1">Mon-Fri 9AM-6PM</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiMapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-600">Addis Ababa, Ethiopia</p>
              <p className="text-sm text-gray-500 mt-1">Global HQ</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gray-50 rounded-3xl p-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Start Your Free Trial Today
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Join hundreds of schools already using Darulkubra to streamline their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors duration-200"
              >
                <FiPlus className="w-5 h-5 mr-2 inline" />
                Start Free Trial
              </button>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors duration-200">
                <FiVideo className="w-5 h-5 mr-2 inline" />
                Schedule Demo
              </button>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-16">
            <div className="bg-gray-100 rounded-2xl p-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.0005531!2d38.690956!3d9.0005531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8730371568d9%3A0x38a1ac1b78294dee!2sDARULKUBRA%20QURAN%20CENTER!5e0!3m2!1sen!2s!4v1704067200!5m2!1sen!2s"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl"
                title="Darulkubra Quran Center Location"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Professional Footer */}
      <footer className="bg-black text-white">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Company Info */}
              <div className="lg:col-span-1">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-black font-bold text-lg">D</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">Darulkubra</span>
                    <p className="text-sm text-gray-400">Islamic Education Technology</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Empowering Islamic educational institutions with cutting-edge technology
                  for seamless school management and student success.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <FiFacebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <FiTwitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <FiLinkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <FiInstagram className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Platform</h3>
                <ul className="space-y-4">
                  <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a></li>
                  <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How It Works</a></li>
                  <li><a href="#integrations" className="text-gray-400 hover:text-white transition-colors text-sm">Integrations</a></li>
                  <li><Link href="/super-admin" className="text-gray-400 hover:text-white transition-colors text-sm">Super Admin</Link></li>
                  <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Login</Link></li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Company</h3>
                <ul className="space-y-4">
                  <li><a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">About Darulkubra</a></li>
                  <li><a href="#mission" className="text-gray-400 hover:text-white transition-colors text-sm">Our Mission</a></li>
                  <li><a href="#team" className="text-gray-400 hover:text-white transition-colors text-sm">Our Team</a></li>
                  <li><a href="#careers" className="text-gray-400 hover:text-white transition-colors text-sm">Careers</a></li>
                  <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</a></li>
                </ul>
              </div>

              {/* Resources & Support */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Resources</h3>
                <ul className="space-y-4">
                  <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a></li>
                  <li><a href="#documentation" className="text-gray-400 hover:text-white transition-colors text-sm">Documentation</a></li>
                  <li><a href="#support" className="text-gray-400 hover:text-white transition-colors text-sm">Support Center</a></li>
                  <li><a href="#blog" className="text-gray-400 hover:text-white transition-colors text-sm">Blog & Updates</a></li>
                  <li><a href="#privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy & Security</a></li>
                </ul>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-12 pt-8 border-t border-gray-800">
              <div className="max-w-md mx-auto lg:mx-0">
                <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Get the latest updates on new features and Islamic education insights.
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-r-lg transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4 md:mb-0">
                <span>&copy; 2026 Darulkubra. All rights reserved.</span>
               
              </div>

              <div className="flex items-center space-x-6">
                {/* Trust Badges */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <FiShield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">SOC 2 Compliant</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <FiLock className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">GDPR Ready</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <FiAward className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* School Registration Side Panel */}
      <SchoolRegistrationSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .tracking-tight {
          letter-spacing: -0.025em;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        /* Professional Navbar Styling */
        .navbar-dropdown {
          transform-origin: top right;
        }

        .navbar-dropdown::before {
          content: '';
          position: absolute;
          top: -4px;
          right: 16px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid white;
          z-index: 51;
        }

        .navbar-dropdown::after {
          content: '';
          position: absolute;
          top: -5px;
          right: 15px;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid rgba(0, 0, 0, 0.1);
          z-index: 50;
        }

        /* Smooth transitions for theme changes */
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        /* Focus styles for accessibility */
        button:focus-visible,
        a:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}