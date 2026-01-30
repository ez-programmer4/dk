"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  FiLogIn,
  FiArrowRight,
  FiPlus,
  FiUsers,
  FiTrendingUp,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiBarChart,
  FiDollarSign,
  FiSmartphone,
  FiAward,
  FiGlobe,
  FiHeart,
  FiTarget,
  FiZap,
  FiChevronDown,
  FiPlay,
  FiBookOpen,
  FiSettings,
  FiCreditCard,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiMessageSquare,
  FiEye,
  FiLock,
  FiServer,
  FiCode,
  FiDatabase,
  FiMonitor,
  FiLayers,
  FiActivity,
  FiThumbsUp,
  FiDownload,
  FiUpload,
  FiSearch,
  FiFilter,
  FiBell,
  FiUserCheck,
  FiBriefcase,
  FiHome,
  FiCamera,
  FiVideo,
  FiHeadphones,
  FiHelpCircle
} from "react-icons/fi";
import SchoolRegistrationModal from "@/components/SchoolRegistrationModal";

export default function Home() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Student Management",
      description: "Complete student lifecycle management from registration to graduation with comprehensive profiles and progress tracking.",
      details: ["Digital enrollment system", "Academic record management", "Progress monitoring", "Certificate generation", "Parent communication portal"]
    },
    {
      icon: <FiBarChart className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Real-time insights and reporting dashboards to monitor performance, attendance, and academic progress.",
      details: ["Performance dashboards", "Attendance analytics", "Custom report builder", "Data visualization", "Predictive insights", "Comparative analysis"]
    },
    {
      icon: <FiDollarSign className="w-8 h-8" />,
      title: "Payment Processing",
      description: "Secure payment gateway integration with automated fee collection, invoicing, and financial reporting.",
      details: ["Online payment processing", "Automated invoicing", "Financial reporting", "Payment tracking", "Multi-currency support", "Receipt generation"]
    },
    {
      icon: <FiSmartphone className="w-8 h-8" />,
      title: "Mobile Access",
      description: "Responsive design with mobile apps for students, teachers, and parents to access information on-the-go.",
      details: ["Mobile-optimized interface", "Push notifications", "Offline access", "Cross-platform support", "Biometric authentication", "Real-time updates"]
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Security & Privacy",
      description: "Enterprise-grade security with role-based access control and data encryption to protect sensitive information.",
      details: ["End-to-end encryption", "GDPR compliance", "Role-based access", "Regular audits", "Data backup", "Privacy controls"]
    },
    {
      icon: <FiZap className="w-8 h-8" />,
      title: "Automation",
      description: "Streamline administrative tasks with automated notifications, attendance tracking, and report generation.",
      details: ["Auto notifications", "Smart scheduling", "Bulk operations", "Workflow automation", "Report generation", "Task management"]
    },
    {
      icon: <FiActivity className="w-8 h-8" />,
      title: "Real-time Monitoring",
      description: "Live dashboards and alerts for immediate insights into school operations and student activities.",
      details: ["Live dashboards", "Instant alerts", "Activity monitoring", "Performance metrics", "System health", "Usage analytics"]
    },
    {
      icon: <FiLayers className="w-8 h-8" />,
      title: "Multi-tenant Architecture",
      description: "Isolated school environments with dedicated resources while maintaining centralized management.",
      details: ["School isolation", "Resource allocation", "Central management", "Scalable infrastructure", "Custom configurations", "Data segregation"]
    },
    {
      icon: <FiDatabase className="w-8 h-8" />,
      title: "Data Management",
      description: "Comprehensive data backup, recovery, and management capabilities to ensure data integrity.",
      details: ["Automated backups", "Disaster recovery", "Data integrity", "Quick restoration", "Archive management", "Compliance reporting"]
    }
  ];

  const stats = [
    { number: "1000+", label: "Active Students", icon: <FiUsers />, description: "Across 150+ schools" },
    { number: "150+", label: "Partner Schools", icon: <FiAward />, description: "Islamic institutions worldwide" },
    { number: "98%", label: "Uptime", icon: <FiTrendingUp />, description: "99.9% availability guarantee" },
    { number: "24/7", label: "Support", icon: <FiClock />, description: "Round-the-clock assistance" },
    { number: "50+", label: "Countries", icon: <FiGlobe />, description: "Global Islamic education network" },
    { number: "99.8%", label: "Satisfaction", icon: <FiThumbsUp />, description: "School administrator approval" }
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
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Darulkubra
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Login
              </Link>
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
              >
                <FiStar className="w-4 h-4 mr-2" />
                Trusted by 150+ Islamic Schools Worldwide
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              >
                Modern Islamic School
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Management Platform
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Transform your Islamic educational institution with our comprehensive digital platform.
                Streamline administration, enhance learning, and foster community engagement.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={() => setIsRegistrationModalOpen(true)}
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                >
                  <FiPlus className="mr-3 w-5 h-5" />
                  Start Free Trial
                  <FiArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                </button>

                <button className="group inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                  <FiPlay className="mr-3 w-5 h-5" />
                  Watch Demo
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="flex items-center justify-center lg:justify-start mt-8 space-x-8 text-sm text-gray-500"
              >
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
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image/Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl transform rotate-3 opacity-10"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">Dashboard Overview</h3>
                        <p className="text-blue-100">Real-time insights at your fingertips</p>
                      </div>
                      <FiBarChart className="w-12 h-12" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900">1,247</p>
                        </div>
                        <FiUsers className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">Attendance Rate</p>
                          <p className="text-2xl font-bold text-green-600">96.8%</p>
                        </div>
                        <FiCheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">All systems operational</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <FiClock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-800">Last backup: 2 minutes ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <span className="text-sm mb-2">Scroll to explore</span>
              <FiChevronDown className="w-6 h-6 animate-bounce" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
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
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-blue-600">{stat.icon}</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run a
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Modern Islamic School
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive features designed specifically for Islamic educational institutions,
              combining traditional values with modern technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>

                {/* Feature Details */}
                <div className="space-y-2">
                  {feature.details?.slice(0, 4).map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-center text-sm text-gray-600">
                      <FiCheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                  {feature.details && feature.details.length > 4 && (
                    <div className="text-sm text-blue-600 font-medium mt-3">
                      +{feature.details.length - 4} more features
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Transform Your School?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of Islamic schools already using Darulkubra to streamline their operations
              and enhance educational outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <FiPlus className="mr-3 w-5 h-5" />
                Start Your Free Trial
                <FiArrowRight className="ml-3" />
              </button>

              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                <FiLogIn className="mr-3 w-5 h-5" />
                Login to Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Islamic Schools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what school leaders are saying about their experience with Darulkubra.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed text-sm">"{testimonial.content}"</p>

                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.school}</div>
                  </div>
                </div>

                {testimonial.achievement && (
                  <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium">
                    {testimonial.achievement}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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
              How Darulkubra Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your Islamic school with our streamlined implementation process.
              From registration to full operation in just weeks.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200"></div>

            {[
              {
                step: "01",
                icon: <FiUserCheck className="w-12 h-12" />,
                title: "Register Your School",
                description: "Start with a simple registration process. Provide your school details and we'll set up your dedicated environment.",
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "02",
                icon: <FiSettings className="w-12 h-12" />,
                title: "Configure & Customize",
                description: "Customize your school settings, branding, and workflows to match your specific requirements and preferences.",
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "03",
                icon: <FiUpload className="w-12 h-12" />,
                title: "Import Your Data",
                description: "Easily migrate your existing student, teacher, and administrative data using our secure import tools.",
                color: "from-green-500 to-green-600"
              },
              {
                step: "04",
                icon: <FiPlay className="w-12 h-12" />,
                title: "Go Live & Scale",
                description: "Launch your digital transformation with training, support, and continuous feature updates.",
                color: "from-orange-500 to-orange-600"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <div className="mb-6 relative">
                  <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <div className="text-white">{step.icon}</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
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

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                {/* Mock Dashboard Interface */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold">School Dashboard</h4>
                      <p className="text-sm opacity-90">Real-time overview</p>
                    </div>
                    <FiMonitor className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Total Students</span>
                      <FiUsers className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">1,247</div>
                    <div className="text-xs text-blue-600">↗️ +12% this month</div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Attendance Rate</span>
                      <FiCheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">96.8%</div>
                    <div className="text-xs text-green-600">↗️ +2.1% this week</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">All systems operational</span>
                    </div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiClock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-800">Next backup in 2 hours</span>
                    </div>
                    <span className="text-xs text-blue-600">Scheduled</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiBell className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-purple-800">3 new notifications</span>
                    </div>
                    <span className="text-xs text-purple-600">Unread</span>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <FiZap className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <FiHeart className="w-5 h-5" />
              </div>
            </motion.div>
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-xl font-bold">Darulkubra</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering Islamic educational institutions with modern technology while preserving
                traditional values and fostering academic excellence.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <FiGlobe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <FiHeart className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <FiTarget className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Darulkubra. All rights reserved. Built with excellence for Islamic education.</p>
          </div>
        </div>
      </footer>

      {/* School Registration Modal */}
      <SchoolRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
