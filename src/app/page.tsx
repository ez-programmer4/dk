"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiLogIn,
  FiArrowRight,
  FiPlus,
  FiGlobe,
  FiChevronDown,
  FiChevronRight,
  FiSun,
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
  FiDatabase,
  FiAward,
  FiClock,
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
  FiHelpCircle,
  FiMail,
  FiMapPin,
  FiPieChart,
  FiFileText,
  FiCalendar,
  FiHome
} from "react-icons/fi";
import SchoolRegistrationSidePanel from "@/components/SchoolRegistrationSidePanel";
import { motion } from "framer-motion";

export default function Home() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  const [theme, setTheme] = useState('light');

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
      description: "Complete student lifecycle management from registration to graduation with comprehensive profiles and progress tracking.",
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
    { number: "1000+", label: "Active Students", iconName: "Users", description: "Across 150+ schools" },
    { number: "150+", label: "Partner Schools", iconName: "Award", description: "Islamic institutions worldwide" },
    { number: "24/7", label: "Support", iconName: "Clock", description: "Round-the-clock assistance" },
    { number: "99.9%", label: "Uptime", iconName: "TrendingUp", description: "Reliable performance" }
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
      <section className="py-28 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-black/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-900/3 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <div className="inline-flex items-center px-4 py-2 bg-black/5 rounded-full text-sm font-medium text-gray-700 mb-6">
              <FiClock className="w-4 h-4 mr-2" />
              4-Step Implementation Process
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-black mb-8 leading-tight">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Transform your Islamic school with our streamlined implementation.
              From registration to full operation in just weeks, not months.
            </p>
          </motion.div>

          {/* Enhanced Step Layout */}
          <div className="relative max-w-7xl mx-auto">
            {/* Progress Line with Animation */}
            <div className="hidden lg:block absolute top-32 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent">
              <motion.div
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                viewport={{ once: true }}
                className="h-full bg-gradient-to-r from-black via-gray-600 to-black rounded-full"
              ></motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 relative">
              {[
                {
                  step: "01",
                  icon: <FiUserCheck className="w-8 h-8" />,
                  title: "Register",
                  description: "Create your school account and provide basic information. We'll handle the rest.",
                  detail: "5 minutes setup",
                  color: "from-black to-gray-800",
                  bgColor: "bg-black/5"
                },
                {
                  step: "02",
                  icon: <FiSettings className="w-8 h-8" />,
                  title: "Configure",
                  description: "Set up your school preferences, branding, and initial settings.",
                  detail: "Custom workflows",
                  color: "from-gray-800 to-black",
                  bgColor: "bg-gray-800/5"
                },
                {
                  step: "03",
                  icon: <FiUpload className="w-8 h-8" />,
                  title: "Import Data",
                  description: "Migrate your existing student and teacher data securely and easily.",
                  detail: "Secure migration",
                  color: "from-black to-gray-900",
                  bgColor: "bg-black/5"
                },
                {
                  step: "04",
                  icon: <FiPlay className="w-8 h-8" />,
                  title: "Go Live",
                  description: "Launch with full training, support, and continuous updates.",
                  detail: "Ongoing support",
                  color: "from-gray-900 to-black",
                  bgColor: "bg-gray-900/5"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  {/* Step Card */}
                  <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-black/20 h-full relative overflow-hidden">
                    {/* Subtle gradient overlay */}
                    <div className={`absolute inset-0 ${step.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    {/* Step Number Badge */}
                    <div className="relative mb-8">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-xl`}
                      >
                        {step.step}
                      </motion.div>
                      {/* Animated ring */}
                      <div className="absolute inset-0 rounded-3xl border-2 border-black/10 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    </div>

                    {/* Icon with hover effect */}
                    <div className="relative mb-6">
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-black mx-auto shadow-md group-hover:shadow-lg transition-all duration-300"
                      >
                        {step.icon}
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="text-center relative">
                      <h3 className="text-2xl font-bold text-black mb-4 group-hover:text-gray-900 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-6 text-base">
                        {step.description}
                      </p>

                      {/* Enhanced detail badge */}
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-black/5 to-gray-100/5 rounded-full border border-black/10 text-sm font-semibold text-gray-700 group-hover:border-black/20 transition-colors duration-300">
                        <div className="w-2 h-2 bg-black rounded-full mr-2 animate-pulse"></div>
                        {step.detail}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
                        <FiArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Connection indicator for mobile */}
                  <div className="flex justify-center mt-8 lg:hidden">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-md">
                      <FiChevronDown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="text-center mt-24"
            >
              <div className="inline-flex items-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Average implementation: 14 days</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-black to-gray-900 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                <span>Start Your Setup</span>
                <FiArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>

              <p className="text-sm text-gray-500 mt-4">
                No credit card required • Free 30-day trial
              </p>
            </motion.div>
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

            {/* Asymmetric Multiple Screen Layout */}
            <div className="relative h-[600px]">
              {/* Main Admin Dashboard - Large Screen */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 100 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="absolute top-0 right-0 w-96 h-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-30"
              >
                {/* Browser Header */}
                <div className="bg-black px-4 py-3 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-gray-800 rounded-md px-3 py-1">
                    <span className="text-xs text-gray-300">darulkubra.com/admin</span>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 bg-gray-50 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Admin Dashboard</h3>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">1,247</div>
                      <div className="text-xs text-gray-600">Students</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-600">96.8%</div>
                      <div className="text-xs text-gray-600">Attendance</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded text-xs">
                      <span className="text-green-600">●</span> Systems operational
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <span className="text-blue-600">●</span> Backup scheduled
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Student Portal - Medium Screen */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="absolute top-20 left-10 w-80 h-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-20"
              >
                {/* Mobile Header */}
                <div className="bg-black px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Student Portal</span>
                  <FiSmartphone className="w-4 h-4 text-white" />
                </div>

                {/* Student Content */}
                <div className="p-4 bg-blue-50 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Ahmed Al-Rashid</div>
                      <div className="text-xs text-gray-600">Grade 10 • Section A</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Today's Schedule</span>
                        <FiCalendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-xs text-gray-600">Math • 9:00 AM</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Assignments</span>
                        <FiFileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-xs text-gray-600">3 pending</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mobile App - Small Screen */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="absolute bottom-20 left-20 w-48 h-96 bg-black rounded-3xl shadow-2xl border-4 border-white overflow-hidden z-40"
              >
                {/* Mobile Notch */}
                <div className="bg-black rounded-t-3xl h-6 flex items-center justify-center">
                  <div className="w-20 h-2 bg-gray-800 rounded-full"></div>
                </div>

                {/* Mobile Content */}
                <div className="bg-white h-full p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-900">Darulkubra</span>
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">●</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Attendance</div>
                      <div className="text-xs text-blue-700">Marked for today ✓</div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-900 mb-1">Timetable</div>
                      <div className="text-xs text-green-700">Next: Arabic 10:30 AM</div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-purple-900 mb-1">Grades</div>
                      <div className="text-xs text-purple-700">Recent: A+ in Quran</div>
                    </div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-around">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <FiHome className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <FiCalendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <FiBell className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Analytics Dashboard - Floating Screen */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                viewport={{ once: true }}
                className="absolute bottom-10 right-20 w-72 h-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10"
              >
                {/* Analytics Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analytics Dashboard</span>
                    <FiBarChart className="w-4 h-4" />
                  </div>
                </div>

                {/* Analytics Content */}
                <div className="p-4 bg-gray-50 h-full">
                  <div className="flex items-end space-x-2 h-20 mb-3">
                    {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm flex-1"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Performance Trend</span>
                    <span className="text-green-600 font-medium">↗️ +15%</span>
                  </div>
                </div>
              </motion.div>

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-50" viewBox="0 0 1000 600">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" opacity="0.6" />
                  </marker>
                </defs>

                {/* Connection lines with arrows */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  d="M 400 200 Q 450 150 500 200"
                  stroke="#6B7280"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="5,5"
                />

                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.7 }}
                  d="M 300 350 Q 350 400 450 380"
                  stroke="#6B7280"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="5,5"
                />

                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.9 }}
                  d="M 650 450 Q 700 400 750 420"
                  stroke="#6B7280"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Floating Action Elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                viewport={{ once: true }}
                className="absolute top-10 right-10 w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg z-50"
              >
                <FiPlay className="w-5 h-5 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                viewport={{ once: true }}
                className="absolute bottom-32 left-32 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-50"
              >
                <FiCheckCircle className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect Darulkubra with your favorite tools and services for a unified educational ecosystem.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Zoom", icon: <FiVideo className="w-8 h-8" />, description: "Video conferencing integration", color: "from-blue-500 to-blue-600" },
              { name: "Stripe", icon: <FiCreditCard className="w-8 h-8" />, description: "Secure payment processing", color: "from-purple-500 to-purple-600" },
              { name: "Telegram", icon: <FiMessageSquare className="w-8 h-8" />, description: "Bot notifications & communication", color: "from-cyan-500 to-cyan-600" },
              { name: "Google Drive", icon: <FiUpload className="w-8 h-8" />, description: "Cloud storage & file management", color: "from-green-500 to-green-600" },
              { name: "Microsoft Teams", icon: <FiMonitor className="w-8 h-8" />, description: "Collaboration tools", color: "from-blue-600 to-indigo-600" },
              { name: "WhatsApp", icon: <FiPhone className="w-8 h-8" />, description: "SMS & messaging integration", color: "from-green-600 to-emerald-600" }
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${integration.color} rounded-2xl flex items-center justify-center mb-6 text-white`}>
                  {integration.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{integration.name}</h3>
                <p className="text-gray-600">{integration.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">Don't see your favorite tool? We're constantly adding new integrations.</p>
            <button className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
              <FiSettings className="mr-2 w-5 h-5" />
              Request Integration
            </button>
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
                  },
                  {
                    icon: <FiServer className="w-6 h-6" />,
                    title: "Regular Security Audits",
                    description: "Continuous security monitoring and regular third-party penetration testing."
                  },
                  {
                    icon: <FiDatabase className="w-6 h-6" />,
                    title: "Automated Backups",
                    description: "Daily automated backups with disaster recovery capabilities."
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

      {/* Awards & Recognition Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Awards & Recognition
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Recognized globally for excellence in Islamic education technology and innovation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: "Best EdTech Solution 2024", issuer: "Middle East Education Awards", icon: <FiAward className="w-8 h-8" /> },
              { title: "Islamic Education Innovation", issuer: "Global Islamic Education Summit", icon: <FiStar className="w-8 h-8" /> },
              { title: "Digital Transformation Award", issuer: "Saudi Education Excellence Awards", icon: <FiTarget className="w-8 h-8" /> },
              { title: "Technology Excellence", issuer: "Qatar Education Technology Awards", icon: <FiZap className="w-8 h-8" /> }
            ].map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 text-center"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                  {award.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{award.title}</h3>
                <p className="text-blue-100">{award.issuer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
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
                question: "Do you provide training for staff and teachers?",
                answer: "Yes, we provide comprehensive training including video tutorials, live sessions, and ongoing support. Our customer success team ensures smooth adoption."
              },
              {
                question: "What kind of support do you offer?",
                answer: "We offer 24/7 technical support, regular feature updates, security patches, and dedicated account management for enterprise clients."
              },
              {
                question: "Can I integrate with existing school systems?",
                answer: "Yes, we support integration with popular educational tools, payment gateways, communication platforms, and existing school management systems."
              }
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join hundreds of Islamic schools already transforming their operations with Darulkubra.
                Let's discuss how we can help your institution.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <FiMail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email Us</h4>
                    <p className="text-gray-600">support@darulkubra.com</p>
                    <p className="text-sm text-gray-500">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <FiPhone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Call Us</h4>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <FiMapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Visit Us</h4>
                    <p className="text-gray-600">123 Education Street<br />Tech City, TC 12345</p>
                    <p className="text-sm text-gray-500">Global headquarters</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setIsRegistrationModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FiPlus className="mr-3 w-5 h-5" />
                  Start Free Trial
                </button>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                  Schedule Demo
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gray-50 p-8 rounded-3xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@school.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School/Organization</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your needs..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FiMail className="mr-3 w-5 h-5" />
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-bold">Darulkubra</span>
            </div>

            <div className="flex space-x-8 text-sm">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Darulkubra. All rights reserved. Built with excellence for Islamic education.</p>
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