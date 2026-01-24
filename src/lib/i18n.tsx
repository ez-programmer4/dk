"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Lang = "en" | "am";

type Dict = Record<string, string>;

const en: Dict = {
  // General
  studentDashboard: "Student Dashboard",
  overview: "Overview",
  loading: "Loading",
  error: "Error",
  retry: "Try Again",
  active: "Active",
  invalidAccessLink:
    "Invalid access link. Please use the correct link provided by your teacher.",
  accessDenied: "Access Denied",

  // Loading & Error States
  loadingProgress: "Loading your progress...",
  pleaseWait: "Please wait a moment",
  noDataTitle: "No Data Found",
  noDataSubtitle: "Unable to load your progress data.",

  // Navigation/Tabs
  attendance: "Attendance",
  tests: "Tests",
  terbia: "Terbia",
  payments: "Payments",
  schedule: "Schedule",

  // Student Profile
  phone: "Phone",
  location: "Location",
  started: "Started",
  yourTeacher: "Your Teacher",
  packageLabel: "Package",
  scheduleLabel: "Schedule",

  // Days of Week
  allDays: "Every Day",
  mwf: "Monday, Wednesday, Friday",
  tts: "Tuesday, Thursday, Saturday",
  sundayOnly: "Sunday Only",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",

  // Attendance
  attendanceRate: "Attendance Rate",
  attendanceRecord: "Attendance Record",
  present: "Present",
  absent: "Absent",
  totalDays: "Total Days",
  presentDays: "Present Days",
  absentDays: "Absent Days",

  // Tests
  testResults: "Test Results",
  testsThisMonth: "Tests This Month",
  passed: "Passed",
  failed: "Failed",
  score: "Score",
  passingScore: "Passing Score",

  // Terbia
  terbiaLearning: "Terbia Learning",
  startLearning: "Start your learning journey on Terbia",
  launchTerbia: "Launch Terbia",
  beginCourses: "Begin your courses",
  courseName: "Course Name",
  progress: "Progress",
  completedChapters: "Completed Chapters",
  totalChapters: "Total Chapters",

  // Payments
  paymentSummary: "Payment Summary",
  paymentGateway: "Payment Gateway",
  totalDeposits: "Total Deposits",
  monthlyPayments: "Monthly Payments",
  remainingBalance: "Remaining Balance",
  balance: "Balance",
  paidMonths: "Paid Months",
  unpaidMonths: "Unpaid Months",
  recentDeposits: "Recent Deposits",
  monthsPaid: "months paid",
  freeMonth: "Free Month",
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  paid: "Paid",
  unpaid: "Unpaid",
  noPayments: "No payment data available",
  currentMonthStatus: "Current Month Status",
  paymentStatus: "Payment Status",
  monthlyFee: "Monthly Fee",
  paymentHistory: "Payment History",
  depositHistory: "Deposit History",
  transactionId: "Transaction ID",
  paymentDate: "Payment Date",
  amount: "Amount",
  reason: "Reason",
  status: "Status",
  allPaidUp: "All Paid Up!",
  paymentRequired: "Payment Required",
  currentMonthPaid: "Your payment for this month has been received. Thank you!",
  currentMonthUnpaid:
    "Your payment for this month is pending. Please make a payment.",
  currentMonthFree: "This month is free for you!",
  currentMonthPartial: "You have made a partial payment for this month.",
  noPaymentRecord:
    "No payment record found for this month. Please contact administration if you've already paid.",
  paymentDue: "Payment Due",
  partialPayment: "Partial Payment",
  deposit: "Deposit",
  stripe: "Stripe",
  chapa: "Chapa",
  manual: "Manual",
  reference: "Reference",
  transaction: "Transaction",
  stripeNotAvailableForETB: "Stripe is used for USD, not ETB",
  addDeposit: "Add Deposit",
  classFee: "Class fee",
  tripleFee: "3 x fee",
  remaining: "Remaining",
  autoApplyInfo:
    "After provider confirmation, deposits are auto-applied to your oldest unpaid months.",
  secureByChapa: "Securely processed by Chapa for ETB payments.",
  processingPayment: "Processing...",
  waitingForConfirmation: "Waiting for payment confirmation...",
  paymentConfirmed: "Payment confirmed! Updating your balance...",
  loadingHistory: "Loading payment history...",
  noPaymentHistory: "No payment history found",
  invalidDepositAmount: "Enter a valid deposit amount greater than zero.",
  paymentInitFailed: "Unable to start payment. Please try again.",
  paymentGatewayError:
    "Payment gateway returned an error. Please check your payment details and try again.",
  invalidPaymentUrl: "Invalid payment URL received. Please contact support.",
  amountPaid: "Amount Paid",
  amountRemaining: "Remaining",
  viewAllPayments: "View All Payments",
  viewAllDeposits: "View All Deposits",
  monthlyBreakdown: "Monthly Breakdown",
  dueAmount: "Due Amount",
  paidAmount: "Paid Amount",

  // Subscription & Package Management
  subscription: "Subscription",
  subscriptions: "Subscriptions",
  subscriptionPackages: "Subscription Packages",
  currentPackage: "Current Package",
  newPackage: "New Package",
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  cancel: "Cancel",
  subscribe: "Subscribe",
  subscribeNow: "Subscribe Now",
  subscribed: "Subscribed",
  upgradeNow: "UPGRADE NOW",
  downgradeNow: "DOWNGRADE NOW",
  upgradeSubscription: "Upgrade Subscription",
  downgradeSubscription: "Downgrade Subscription",
  cancelSubscription: "Cancel Subscription",
  otherSubscriptions: "Other Subscriptions",
  hideOtherSubscriptions: "Hide Other Subscriptions",
  subscribeAgain: "Subscribe Again",
  upgradeConfirmation: "You will be charged immediately for the upgrade",
  downgradeConfirmation:
    "Your subscription will be downgraded at the end of your current billing period",
  cancelConfirmation:
    "We're sorry to see you go. Your subscription will remain active until the end of your current billing period.",
  cancelling: "Cancelling...",
  keepSubscription: "Keep Subscription",
  whatHappensNext: "What Happens Next?",
  keepAccessUntilEnd:
    "You'll keep full access until the end of your billing period",
  noRefunds: "No refunds will be issued for the remaining time",
  noAutoRenewal: "Your subscription will not renew automatically",
  canResubscribe: "You can resubscribe anytime in the future",
  considerAlternatives: "Consider These Alternatives",
  beforeCancelMessage:
    "Before you cancel, consider these options that might better suit your needs:",
  downgradeOption: "Downgrade to a lower tier plan",
  pauseOption: "Pause your subscription temporarily",
  contactSupport: "Contact support for special arrangements",
  subscriptionTimeline: "SUBSCRIPTION TIMELINE",
  upgrading: "Upgrading...",
  downgrading: "Downgrading...",
  processing: "Processing...",
  chargeImmediately: "Charge immediately",
  effectiveAtPeriodEnd: "Effective at period end",
  instantAccess: "INSTANT ACCESS",
  secureSpot: "Secure spot",
  new: "NEW",
  current: "CURRENT",
  accessUntil: "ACCESS UNTIL",
  noPackagesAvailable: "No subscription packages available",

  // Proration & Calculations
  prorationBreakdown: "Proration Breakdown",
  prorationExplanation: "Proration explanation",
  monthlyRate: "Monthly Rate",
  dailyRate: "Daily Rate",
  daysUsed: "Days Used",
  daysRemaining: "Days Remaining",
  days: "days",
  day: "day",
  month: "month",
  months: "months",
  creditCalculation: "Credit Calculation",
  unusedTimeCredit: "Unused Time Credit",
  minusCredit: "Minus Credit",
  credit: "Credit",
  creditAvailable: "credit available",
  netCalculation: "Net Calculation",
  newPackagePrice: "New Package Price",
  amountToCharge: "Amount to Charge",
  upgradeChargeExplanation: "Upgrade charge explanation",
  downgradeChargeExplanation: "Downgrade charge explanation",
  downgradeCreditExplanation: "Downgrade credit explanation",
  netCredit: "Net Credit",
  immediateCharge: "Immediate Charge",
  upgradeWarning:
    "You will be charged immediately for the prorated difference. Your subscription will be upgraded right away.",

  // Payment History & Details
  monthlyPaymentHistory: "Monthly payment breakdown",
  currentMonth: "CURRENT",
  paymentMethod: "Payment Method",
  paymentSource: "Payment Source",
  paymentDetails: "Payment Details",
  paymentInfo: "Payment Information",
  paymentOptions: "Payment Options",
  selectPaymentMethod: "Select Payment Method",
  confirmPayment: "Confirm Payment",
  paymentSuccessful: "Payment Successful",
  paymentFailed: "Payment Failed",
  paymentPending: "Payment Pending",
  paymentCancelled: "Payment Cancelled",
  paymentExpired: "Payment Expired",

  // Active Subscription
  activeSubscription: "ACTIVE SUBSCRIPTION",
  yourCurrentPlan: "Your current active subscription plan",
  subscriptionProgress: "Subscription Progress",
  complete: "Complete",
  startDate: "Start Date",
  endDate: "End Date",
  plan: "PLAN",
  access: "access",
  allPremiumFeatures: "All premium features included",
  prioritySupport: "Priority support",
  unlimitedAccess: "Unlimited access",
  advancedAnalytics: "Advanced analytics",
  activeSubscriber: "active subscriber",
  activeSubscribers: "active subscribers",
  trustedByStudents: "Trusted by students worldwide",
  premiumPlans: "Premium Plans",
  choosePackage: "Choose the perfect plan for your learning journey",
  loadingPackages: "Loading packages...",
  perMonth: "per month",
  popular: "POPULAR",
  transactions: "transactions",
  paymentProgress: "Payment Progress",
  confirmCancellation: "Confirm Cancellation",
  overviewOfPayments: "Complete overview of your payment history",
  securePayment: "Secure payment processing",
  noDepositsYet: "No deposits yet",
  noMonthlyPaymentsYet: "No monthly payments yet",

  // Schedule
  scheduledTimes: "Scheduled Times",
  zoomSessions: "Zoom Sessions",
  zoomSession: "Zoom Session",
  last30Days: "Last 30 days",
  timeSlot: "Time Slot",
  until: "Until",
  noSchedule: "No scheduled times found",

  // Recent Activity
  recentActivity: "Recent Activity",
  attendanceStatus: "Attendance",

  // Student Selection
  selectAccount: "Select Your Account",
  chooseStudent: "Choose the student account to view",
  tapToView: "Tap on any student card to view their progress",

  // Common Actions
  viewDetails: "View Details",
  refresh: "Refresh",
  back: "Back",

  // Teacher Info
  teacher: "Teacher",
};

const am: Dict = {
  // General - አጠቃላይ
  studentDashboard: "ተማሪ ዳሽቦርድ",
  overview: "አጠቃላይ እይታ",
  loading: "በመጫን ላይ",
  error: "ስህተት",
  retry: "እንደገና ይሞክሩ",
  active: "ንቁ",
  invalidAccessLink: "ልክ ያልሆነ የመዳረሻ አገናኝ። እባክዎ በመምህርዎ የተሰጠውን ትክክለኛ አገናኝ ይጠቀሙ።",
  accessDenied: "መዳረሻ ተከልክሏል",

  // Loading & Error States - የመጫን እና የስህተት ሁኔታዎች
  loadingProgress: "እድገትዎን በመጫን ላይ...",
  pleaseWait: "እባክዎ ትንሽ ይጠብቁ",
  noDataTitle: "መረጃ አልተገኘም",
  noDataSubtitle: "የእድገት መረጃዎን መጫን አልተቻለም።",

  // Navigation/Tabs - አሰሳ
  attendance: "ተገኝነት",
  tests: "ፈተናዎች",
  terbia: "ተርቢያ",
  payments: "ክፍያዎች",
  schedule: "የጊዜ ሰሌዳ",

  // Student Profile - የተማሪ መገለጫ
  phone: "ስልክ",
  location: "አድራሻ",
  started: "የጀመረበት",
  yourTeacher: "መምህርዎ",
  packageLabel: "የትምህርት ፓኬጅ",
  scheduleLabel: "የጊዜ ሰሌዳ",

  // Days of Week - የሳምንት ቀናት
  allDays: "በየቀኑ",
  mwf: "ሰኞ፣ ረቡዕ፣ አርብ",
  tts: "ማክሰኞ፣ ሐሙስ፣ ቅዳሜ",
  sundayOnly: "እሁድ ብቻ",
  monday: "ሰኞ",
  tuesday: "ማክሰኞ",
  wednesday: "ረቡዕ",
  thursday: "ሐሙስ",
  friday: "አርብ",
  saturday: "ቅዳሜ",
  sunday: "እሁድ",

  // Attendance - ተገኝነት
  attendanceRate: "የተገኝነት መጠን",
  attendanceRecord: "የተገኝነት መዝገብ",
  present: "ተገኝቷል",
  absent: "ተቅርቧል",
  totalDays: "ጠቅላላ ቀናት",
  presentDays: "የተገኙ ቀናት",
  absentDays: "የቀሩ ቀናት",

  // Tests - ፈተናዎች
  testResults: "የፈተና ውጤቶች",
  testsThisMonth: "በዚህ ወር ፈተናዎች",
  passed: "አልፏል",
  failed: "አልተሳካም",
  score: "ውጤት",
  passingScore: "ማለፊያ ውጤት",

  // Terbia - ተርቢያ
  terbiaLearning: "ተርቢያ መማሪያ",
  startLearning: "በተርቢያ የመማር ጉዞዎን ይጀምሩ",
  launchTerbia: "ተርቢያን ይክፈቱ",
  beginCourses: "ኮርሶችዎን ይጀምሩ",
  courseName: "የኮርስ ስም",
  progress: "እድገት",
  completedChapters: "የተጠናቀቁ ምዕራፎች",
  totalChapters: "ጠቅላላ ምዕራፎች",

  // Payments - ክፍያዎች
  paymentSummary: "የክፍያ ማጠቃለያ",
  paymentGateway: "የክፍያ መንገድ",
  totalDeposits: "ጠቅላላ ተቀማጭ ገንዘብ",
  monthlyPayments: "ወርሃዊ ክፍያዎች",
  remainingBalance: "የቀረ ሂሳብ",
  balance: "ሂሳብ",
  paidMonths: "የተከፈሉ ወራት",
  unpaidMonths: "ያልተከፈሉ ወራት",
  recentDeposits: "የቅርብ ጊዜ ተቀማጭ ገንዘቦች",
  monthsPaid: "ወራት ተከፍለዋል",
  freeMonth: "ነፃ ወር",
  approved: "ጸድቋል",
  pending: "በመጠባበቅ ላይ",
  rejected: "ተቀባይነት አላገኘም",
  paid: "ተከፍሏል",
  unpaid: "አልተከፈለም",
  noPayments: "የክፍያ መረጃ አልተገኘም",
  currentMonthStatus: "የአሁኑ ወር ሁኔታ",
  paymentStatus: "የክፍያ ሁኔታ",
  monthlyFee: "ወርሃዊ ክፍያ",
  paymentHistory: "የክፍያ ታሪክ",
  depositHistory: "የተቀማጭ ገንዘብ ታሪክ",
  transactionId: "የግብይት መለያ",
  paymentDate: "የክፍያ ቀን",
  amount: "መጠን",
  reason: "ምክንያት",
  status: "ሁኔታ",
  allPaidUp: "ሁሉም ተከፍሏል!",
  paymentRequired: "ክፍያ ያስፈልጋል",
  currentMonthPaid: "የዚህ ወር ክፍያዎ ተቀብለናል። እናመሰግናለን!",
  currentMonthUnpaid: "የዚህ ወር ክፍያዎ በመጠባበቅ ላይ ነው። እባክዎ ክፍያ ያድርጉ።",
  currentMonthFree: "ይህ ወር ለእርስዎ ነፃ ነው!",
  currentMonthPartial: "ለዚህ ወር ከፊል ክፍያ አድርገዋል።",
  noPaymentRecord: "ለዚህ ወር የክፍያ መረጃ አልተገኘም። ቀደም ብለው ከከፈሉ እባክዎ አስተዳደርን ያግኙ።",
  paymentDue: "መክፈል ያለብዎት",
  partialPayment: "ከፊል ክፍያ",
  deposit: "ተቀማጭ",
  stripe: "ስትራይፕ",
  chapa: "ቻፓ",
  manual: "በእጅ",
  reference: "ማመሳከሪያ",
  transaction: "ግብይት",
  stripeNotAvailableForETB: "ስትራይፕ ለዶላር (USD) ብቻ ነው እንጂ ለብር (ETB) አይደለም",
  addDeposit: "ተቀማጭ ገንዘብ ጨምር",
  classFee: "የክፍያ መጠን",
  tripleFee: "3 ጊዜ ክፍያ",
  remaining: "የቀረ",
  autoApplyInfo: "ከአቅርቦት ማረጋገጥ በኋላ ተቀማጭ ገንዘብ በአሮጌ ያልተከፈሉ ወራት ላይ በራሱ ይተግባራል።",
  secureByChapa: "ለETB ክፍያዎች በChapa በደህና ይተካል።",
  processingPayment: "በማስኬድ ላይ...",
  waitingForConfirmation: "የክፍያ ማረጋገጫን በመጠበቅ ላይ...",
  paymentConfirmed: "ክፍያ ተረጋገጠ! ሂሳብዎ በመዘመን ላይ...",
  loadingHistory: "የክፍያ ታሪክ በመጫን ላይ...",
  noPaymentHistory: "የክፍያ ታሪክ አልተገኘም",
  invalidDepositAmount: "ከዜሮ የላቀ የሚሆን ትክክለኛ መጠን ያስገቡ።",
  paymentInitFailed: "ክፍያ ጀመር አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
  paymentGatewayError:
    "ከክፍያ አቅራቢ ስህተት ተመልሷል። የክፍያ ዝርዝሮችዎን ያረጋግጡ እና እንደገና ይሞክሩ።",
  invalidPaymentUrl: "የማይሰራ የክፍያ አድራሻ ተቀባ። እባክዎ ድጋፍን ያግኙ።",
  amountPaid: "የተከፈለ መጠን",
  amountRemaining: "የቀረ",
  viewAllPayments: "ሁሉንም ክፍያዎች ይመልከቱ",
  viewAllDeposits: "ሁሉንም ተቀማጭ ገንዘቦች ይመልከቱ",
  monthlyBreakdown: "ወርሃዊ ዝርዝር",
  dueAmount: "መክፈል ያለብዎት መጠን",
  paidAmount: "የተከፈለ መጠን",

  // Subscription & Package Management - የደንበኝነት እና የፓኬጅ አስተዳደር
  subscription: "ደንበኝነት",
  subscriptions: "ደንበኝነቶች",
  subscriptionPackages: "የደንበኝነት ፓኬጆች",
  currentPackage: "የአሁኑ ፓኬጅ",
  newPackage: "አዲስ ፓኬጅ",
  upgrade: "አሻሽል",
  downgrade: "አሽቅል",
  cancel: "ሰርዝ",
  subscribe: "ደንበኝ ሁን",
  subscribeNow: "አሁኑኑ ደንበኝ ሁን",
  subscribed: "ደንበኝ ሆነዋል",
  upgradeNow: "አሁኑኑ አሻሽል",
  downgradeNow: "አሁኑኑ አሽቅል",
  upgradeSubscription: "ደንበኝነት አሻሽል",
  downgradeSubscription: "ደንበኝነት አሽቅል",
  cancelSubscription: "ደንበኝነት ሰርዝ",
  otherSubscriptions: "ሌሎች ደንበኝነቶች",
  hideOtherSubscriptions: "ሌሎች ደንበኝነቶችን ደብቅ",
  subscribeAgain: "እንደገና ይመዝግቡ",
  upgradeConfirmation: "ለአሻሽል ወዲያውኑ ይከፈልዎታል",
  downgradeConfirmation: "ደንበኝነትዎ በአሁኑ የክፍያ ጊዜ መጨረሻ ላይ ይቀንሳል",
  cancelConfirmation:
    "እንደገና ማግኘትዎን እናዝናለን። ደንበኝነትዎ እስከ አሁኑ የክፍያ ጊዜ መጨረሻ ድረስ ንቁ ይሆናል።",
  cancelling: "በመሰረዝ ላይ...",
  keepSubscription: "ደንበኝነት ይቆይ",
  whatHappensNext: "ምን ይከሰታል?",
  keepAccessUntilEnd: "እስከ የክፍያ ጊዜ መጨረሻ ድረስ ሙሉ መዳረሻ ይኖርዎታል",
  noRefunds: "ለቀሪው ጊዜ የተመለሰ ገንዘብ አይሰጥም",
  noAutoRenewal: "ደንበኝነትዎ በራስ-ሰር አይደራረብም",
  canResubscribe: "በወደፊት በማንኛውም ጊዜ እንደገና መመዝገብ ይችላሉ",
  considerAlternatives: "እነዚህን ምርጫዎች አስቡ",
  beforeCancelMessage: "ከመሰረዝዎ በፊት፣ እነዚህ ምርጫዎች የእርስዎን ፍላጎት ሊያሟሉ ይችላሉ፡",
  downgradeOption: "ወደ ዝቅተኛ ደረጃ ምድብ መቀነስ",
  pauseOption: "ደንበኝነትዎን ለጊዜያዊ ማቆም",
  contactSupport: "ለልዩ ስምምነቶች ድጋፍ ያግኙ",
  subscriptionTimeline: "የደንበኝነት የጊዜ መስመር",
  upgrading: "በመሻሻል ላይ...",
  downgrading: "በመቀነስ ላይ...",
  processing: "በማስኬድ ላይ...",
  chargeImmediately: "ወዲያውኑ ክፍያ ያድርጉ",
  effectiveAtPeriodEnd: "በጊዜ መጨረሻ ላይ ይተገበራል",
  instantAccess: "ወዲያውኑ መዳረሻ",
  secureSpot: "ደህንነቱ የተጠበቀ ቦታ",
  new: "አዲስ",
  current: "አሁኑ",
  accessUntil: "እስከ የሚደረስ",
  noPackagesAvailable: "የደንበኝነት ፓኬጆች አልተገኙም",

  // Proration & Calculations - የክፍያ ስሌት
  prorationBreakdown: "የክፍያ ስሌት ዝርዝር",
  prorationExplanation: "የክፍያ ስሌት ማብራሪያ",
  monthlyRate: "ወርሃዊ መጠን",
  dailyRate: "ዕለታዊ መጠን",
  daysUsed: "የተጠቀሙ ቀናት",
  daysRemaining: "የቀሩ ቀናት",
  days: "ቀናት",
  day: "ቀን",
  month: "ወር",
  months: "ወራት",
  creditCalculation: "የክሬዲት ስሌት",
  unusedTimeCredit: "ያልተጠቀሙ ጊዜ ክሬዲት",
  minusCredit: "ክሬዲት መቀነስ",
  credit: "ክሬዲት",
  creditAvailable: "ክሬዲት ይገኛል",
  netCalculation: "የንጹህ ስሌት",
  newPackagePrice: "የአዲስ ፓኬጅ ዋጋ",
  amountToCharge: "የሚከፈለው መጠን",
  upgradeChargeExplanation: "የአሻሽል ክፍያ ማብራሪያ",
  downgradeChargeExplanation: "የቀነስ ክፍያ ማብራሪያ",
  downgradeCreditExplanation: "የቀነስ ክሬዲት ማብራሪያ",
  netCredit: "የተጣራ ክሬዲት",
  immediateCharge: "ወዲያውኑ ክፍያ",
  upgradeWarning: "ለተመጣጣኝ ልዩነት ወዲያውኑ ይከፈልዎታል። ደንበኝነትዎ ወዲያውኑ ይሻሻላል።",

  // Payment History & Details - የክፍያ ታሪክ እና ዝርዝሮች
  monthlyPaymentHistory: "ወርሃዊ ክፍያ ዝርዝር",
  currentMonth: "አሁኑ",
  paymentMethod: "የክፍያ ዘዴ",
  paymentSource: "የክፍያ ምንጭ",
  paymentDetails: "የክፍያ ዝርዝሮች",
  paymentInfo: "የክፍያ መረጃ",
  paymentOptions: "የክፍያ አማራጮች",
  selectPaymentMethod: "የክፍያ ዘዴ ይምረጡ",
  confirmPayment: "ክፍያ ያረጋግጡ",
  paymentSuccessful: "ክፍያ በተሳካ ሁኔታ",
  paymentFailed: "ክፍያ አልተሳካም",
  paymentPending: "ክፍያ በመጠባበቅ ላይ",
  paymentCancelled: "ክፍያ ተሰርዟል",
  paymentExpired: "ክፍያ ጊዜው አልፏል",

  // Active Subscription - ንቁ ደንበኝነት
  activeSubscription: "ንቁ ደንበኝነት",
  yourCurrentPlan: "የአሁኑ ንቁ የደንበኝነት ፓኬጅዎ",
  subscriptionProgress: "የደንበኝነት እድገት",
  complete: "ተጠናቋል",
  startDate: "የመጀመሪያ ቀን",
  endDate: "የመጨረሻ ቀን",
  plan: "ፓኬጅ",
  access: "መዳረሻ",
  allPremiumFeatures: "ሁሉም ፕሪሚየም ባህሪያት ተካትተዋል",
  prioritySupport: "የቅድሚያ ድጋፍ",
  unlimitedAccess: "ያልተገደበ መዳረሻ",
  advancedAnalytics: "የላቀ ትንተና",
  activeSubscriber: "ንቁ ደንበኛ",
  activeSubscribers: "ንቁ ደንበኞች",
  trustedByStudents: "በተማሪዎች በዓለም አቀፍ ደረጃ የታመነ",
  premiumPlans: "ፕሪሚየም ፓኬጆች",
  choosePackage: "ለመማር ጉዞዎ ተገቢውን ፓኬጅ ይምረጡ",
  loadingPackages: "ፓኬጆች በመጫን ላይ...",
  perMonth: "በወር",
  popular: "ታዋቂ",
  transactions: "ግብይቶች",
  paymentProgress: "የክፍያ እድገት",
  confirmCancellation: "ስረዝን ያረጋግጡ",
  overviewOfPayments: "የክፍያ ታሪክዎ ሙሉ እይታ",
  securePayment: "ደህንነቱ የተጠበቀ የክፍያ ሂደት",
  noDepositsYet: "እስካሁን ምንም ክፍያዎች የሉም",
  noMonthlyPaymentsYet: "እስካሁን ምንም ወራዊ ክፍያዎች የሉም",

  // Schedule - የጊዜ ሰሌዳ
  scheduledTimes: "የታቀዱ ሰዓቶች",
  zoomSessions: "የዙም ክፍለ ጊዜዎች",
  zoomSession: "የዙም ክፍለ ጊዜ",
  last30Days: "ባለፉት 30 ቀናት",
  timeSlot: "የጊዜ ክፍተት",
  until: "እስከ",
  noSchedule: "የታቀዱ ሰዓቶች አልተገኙም",

  // Recent Activity - የቅርብ ጊዜ እንቅስቃሴ
  recentActivity: "የቅርብ ጊዜ እንቅስቃሴ",
  attendanceStatus: "ተገኝነት",

  // Student Selection - የተማሪ ምርጫ
  selectAccount: "መለያዎን ይምረጡ",
  chooseStudent: "ለመመልከት የተማሪ መለያ ይምረጡ",
  tapToView: "እድገታቸውን ለመመልከት የትኛውንም የተማሪ ካርድ ይንኩ",

  // Common Actions - የተለመዱ ድርጊቶች
  viewDetails: "ዝርዝር ይመልከቱ",
  refresh: "አድስ",
  back: "ወደኋላ",

  // Teacher Info - የመምህር መረጃ
  teacher: "መምህር",

  // Teacher Permissions - የመምህር ፈቃዶች
  permissionManagementAmharic: "የፈቃድ አስተዳደር",
  permissionManagementDescAmharic:
    "የፈቃድ ታሪክዎን ይመልከቱ እና ለአዲስ ጥያቄዎች ከመምህርዎ ጋር ያልፍፅፅት",
  contactControllerAmharic: "ከመምህርዎ ጋር ያልፍፅፅት",
  contactControllerDescAmharic: "ለፈቃድ ጥያቄዎች እና ድጋፍ",
  controllerCodeAmharic: "ኮድ",
  howToRequestPermissionAmharic: "ፈቃድ እንዴት ለመጠየቅ አለበት",
  contactControllerDirectlyAmharic: "ከመምህርዎ ጋር በቀጥታ ያልፍፅፅት",
  provideDateTimeReasonAmharic: "ቀን፣ የጊዜ ክፍተት እና ምክንያት ያቅርቡ",
  controllerCreatesPermissionAmharic: "መምህር ፈቃድን ያስያዛል",
  checkHistoryBelowAmharic: "ታሪክን ከታች ይመልከቱ",
  controllerInfoUnavailableAmharic: "የመምህር መረጃ አይገኝም",
  controllerInfoUnavailableDescAmharic:
    "የመምህር መረጃዎን መጫን አልተቻለም። ችግር ካለበት እባክዎ አስተዳደርን ያግኙ።",
  permissionHistoryAmharic: "የፈቃድ ታሪክ",
  permissionHistoryDescAmharic: "የፈቃድ ጥያቄዎችዎን ይከተሉ",
  totalRequestsAmharic: "ጠቅላላ ጥያቄዎች",
  noPermissionsFoundAmharic: "ፈቃዶች አልተገኙም",
  noPermissionsFoundDescAmharic:
    "በዚህ ወር ምንም የፈቃድ ጥያቄዎች የሉዎትም። ፈቃድ ለመጠየቅ ከመምህርዎ ጋር ያልፍፅፅት።",
  termsAcceptedAmharic: "ውሎች ተቀበሉ",
};

const dicts: Record<Lang, Dict> = { en, am };

type I18nCtx = {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("dk_lang") : null;
    if (saved === "en" || saved === "am") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("dk_lang", l);
    } catch {}
  };

  const t = useMemo(() => {
    const d = dicts[lang] || en;
    return (key: string) => d[key] || en[key] || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
