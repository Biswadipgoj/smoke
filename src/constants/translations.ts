// src/constants/translations.ts
export type Locale = 'en' | 'hi' | 'bn';

export type TranslationKeys = {
  // Common
  appName: string;
  loading: string;
  skip: string;
  next: string;
  done: string;
  cancel: string;
  save: string;
  delete: string;
  confirm: string;
  back: string;
  or: string;

  // Tab labels
  tabHome: string;
  tabCoach: string;
  tabProgress: string;
  tabAchievements: string;
  tabSettings: string;

  // Home
  homeGreetingMorning: string;
  homeGreetingAfternoon: string;
  homeGreetingEvening: string;
  homeGreetingNight: string;
  homeCravingBtn: string;
  homeLogCig: string;
  homeTodayCount: string;
  homeBaselineCount: string;
  homeMoneySaved: string;
  homeMoneyToday: string;
  homeStreakCurrent: string;
  homeStreakBest: string;
  homeStreakDays: string;
  homeStreakDay: string;
  homeNudgeDefault: string;
  homeNudgeMorning: string;
  homeNudgeEvening: string;

  // Log Cigarette
  logTitle: string;
  logContextQuestion: string;
  logContextStress: string;
  logContextSocial: string;
  logContextHabit: string;
  logContextBoredom: string;
  logContextAlcohol: string;
  logContextOther: string;
  logNote: string;
  logNotePlaceholder: string;
  logSubmit: string;
  loggedSuccess: string;
  loggedMessage: string;

  // Delay Session
  delayTitle: string;
  delaySubtitle: string;
  delayIntensityLabel: string;
  delayContextLabel: string;
  delayStartBtn: string;
  delayInhale: string;
  delayHold: string;
  delayExhale: string;
  delayTimeLeft: string;
  delayMinutes: string;
  delaySeconds: string;
  delayAiMessage1: string;
  delayAiMessage2: string;
  delayAiMessage3: string;
  delayAiMessage4: string;
  delayAiMessage5: string;
  delayOutcomeTitle: string;
  delayOutcomeSuccess: string;
  delayOutcomeSmoked: string;
  delayOutcomeSuccessMsg: string;
  delayOutcomeSmokedMsg: string;
  delayEndEarly: string;

  // Coach
  coachTitle: string;
  coachInputPlaceholder: string;
  coachSend: string;
  coachQuick1: string;
  coachQuick2: string;
  coachQuick3: string;
  coachQuick4: string;
  coachDisclaimer: string;
  coachCrisisMsg: string;
  coachCrisisResources: string;
  coachTyping: string;
  coachOffline: string;

  // Progress
  progressTitle: string;
  progressHealthTitle: string;
  progressMoneyTitle: string;
  progressMoneySaved: string;
  progressMoneyProjected: string;
  progressPatternsTitle: string;
  progressCigsPerDay: string;
  progressDaysTracked: string;
  progressFreeTime: string;
  progressAchieved: string;
  progressUpcoming: string;

  // Health milestones
  milestone20min: string;
  milestone12hr: string;
  milestone24hr: string;
  milestone48hr: string;
  milestone1week: string;
  milestone1month: string;
  milestone3months: string;
  milestone6months: string;
  milestone1year: string;
  milestone5years: string;
  milestone10years: string;
  milestone20minDesc: string;
  milestone12hrDesc: string;
  milestone24hrDesc: string;
  milestone48hrDesc: string;
  milestone1weekDesc: string;
  milestone1monthDesc: string;
  milestone3monthsDesc: string;
  milestone6monthsDesc: string;
  milestone1yearDesc: string;
  milestone5yearsDesc: string;
  milestone10yearsDesc: string;

  // Achievements
  achievementsTitle: string;
  achievementEarned: string;
  achievementUpcoming: string;
  achievementFirstDelay: string;
  achievementFirstDelayDesc: string;
  achievement5Delays: string;
  achievement5DelaysDesc: string;
  achievement7DayStreak: string;
  achievement7DayStreakDesc: string;
  achievement30DayStreak: string;
  achievement30DayStreakDesc: string;
  achievementFirstLog: string;
  achievementFirstLogDesc: string;
  achievement100Saved: string;
  achievement100SavedDesc: string;
  achievementOneWeekFree: string;
  achievementOneWeekFreeDesc: string;

  // Onboarding
  onboardingWelcomeTitle: string;
  onboardingWelcomeSubtitle: string;
  onboardingWelcomeBtn: string;
  onboardingGuestBtn: string;
  onboardingLangTitle: string;
  onboardingLangSubtitle: string;
  onboardingBaselineTitle: string;
  onboardingBaselineSubtitle: string;
  onboardingDailyCount: string;
  onboardingDailyCountPlaceholder: string;
  onboardingCostPerPack: string;
  onboardingCostPlaceholder: string;
  onboardingCigsPerPack: string;
  onboardingCurrency: string;
  onboardingMotivationTitle: string;
  onboardingMotivationSubtitle: string;
  onboardingMotivFamily: string;
  onboardingMotivHealth: string;
  onboardingMotivMoney: string;
  onboardingMotivFeel: string;
  onboardingMotivOther: string;
  onboardingGoalTitle: string;
  onboardingGoalSubtitle: string;
  onboardingGoalQuit: string;
  onboardingGoalQuitDesc: string;
  onboardingGoalReduce: string;
  onboardingGoalReduceDesc: string;
  onboardingGoalTrack: string;
  onboardingGoalTrackDesc: string;
  onboardingDone: string;

  // Settings
  settingsTitle: string;
  settingsLanguage: string;
  settingsTheme: string;
  settingsThemeDark: string;
  settingsThemeLight: string;
  settingsThemeSystem: string;
  settingsNotifications: string;
  settingsNotificationsOn: string;
  settingsNotificationsOff: string;
  settingsAccount: string;
  settingsExport: string;
  settingsDelete: string;
  settingsDeleteConfirm: string;
  settingsDeleteWarning: string;
  settingsCrisis: string;
  settingsAbout: string;
  settingsVersion: string;

  // Auth
  authLoginTitle: string;
  authEmail: string;
  authPassword: string;
  authLogin: string;
  authSignup: string;
  authGoogle: string;
  authMagicLink: string;
  authNoAccount: string;
  authHaveAccount: string;
  authForgotPassword: string;
  authGuestNote: string;
  authEmailSent: string;

  // Errors
  errorGeneric: string;
  errorNetwork: string;
  errorAuth: string;
  errorSync: string;

  // Companion / personas
  companionWord: string;
  personaMentor: string;
  personaMentorTagline: string;
  personaFriend: string;
  personaFriendTagline: string;
  personaGuide: string;
  personaGuideTagline: string;
  onboardingPersonaTitle: string;
  onboardingPersonaSubtitle: string;
  settingsCompanion: string;

  // Home — data as narrative
  homeStorySectionTitle: string;
  homeCleanAirTitle: string;
  homeCleanAirCaption: string;
  homeAvoidedTitle: string;
  homeAvoidedCaption: string;
  homeLifeTitle: string;
  homeLifeCaption: string;
  homeMoneyPrefix: string;
  moneyStoryStart: string;
  moneyStoryCoffee: string;
  moneyStoryMeal: string;
  moneyStoryDinner: string;
  moneyStoryTreat: string;
  moneyStoryGetaway: string;
  unitMin: string;

  // Coach empty state
  coachEmptyTitle: string;
  coachEmptySubtitle: string;

  // Intervention hub
  interveneTitle: string;
  interveneSubtitle: string;
  interveneCalming: string;
  interveneCalmingDesc: string;
  interveneCognitive: string;
  interveneCognitiveDesc: string;
  interveneIncentive: string;
  interveneIncentiveDesc: string;
  intervenePhysical: string;
  intervenePhysicalDesc: string;
  interveneDistraction: string;
  interveneDistractionDesc: string;
  interveneChooseAnother: string;
  interveneReflectDone: string;
  cognitiveIntro: string;
  cognitivePrompt1: string;
  cognitivePrompt2: string;
  cognitivePrompt3: string;
  physicalIntro: string;
  physicalStep1: string;
  physicalStep2: string;
  physicalStep3: string;
  distractionIntro: string;
  distractionTask1: string;
  distractionTask2: string;
  distractionTask3: string;
  incentiveIntro: string;
};

const en: TranslationKeys = {
  appName: 'SmokeLess AI',
  loading: 'Loading...',
  skip: 'Skip for now',
  next: 'Continue',
  done: 'Done',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  confirm: 'Confirm',
  back: 'Back',
  or: 'or',

  tabHome: 'Today',
  tabCoach: 'Coach',
  tabProgress: 'Progress',
  tabAchievements: 'Milestones',
  tabSettings: 'Settings',

  homeGreetingMorning: 'Good morning',
  homeGreetingAfternoon: 'Good afternoon',
  homeGreetingEvening: 'Good evening',
  homeGreetingNight: 'Still up?',
  homeCravingBtn: "I'm craving",
  homeLogCig: 'Log a cigarette',
  homeTodayCount: "Today's cigarettes",
  homeBaselineCount: 'Your baseline',
  homeMoneySaved: 'Money saved',
  homeMoneyToday: 'today',
  homeStreakCurrent: 'Current streak',
  homeStreakBest: 'Best ever',
  homeStreakDays: 'days',
  homeStreakDay: 'day',
  homeNudgeDefault: 'Every craving you delay is a victory — even the small ones.',
  homeNudgeMorning: 'Starting the morning smoke-free is one of the best things you can do today.',
  homeNudgeEvening: "You've made it through most of the day. The evening stretch is the final push.",

  logTitle: 'Log a Cigarette',
  logContextQuestion: 'What brought this on? (optional)',
  logContextStress: 'Stress',
  logContextSocial: 'Social',
  logContextHabit: 'Habit',
  logContextBoredom: 'Boredom',
  logContextAlcohol: 'Alcohol',
  logContextOther: 'Other',
  logNote: 'Note',
  logNotePlaceholder: 'Anything else going on? (optional)',
  logSubmit: 'Log it',
  loggedSuccess: 'Logged',
  loggedMessage: "Honest tracking is how progress works. You're doing it right.",

  delayTitle: 'Urge Delay Session',
  delaySubtitle: 'Let the craving pass — it usually takes just a few minutes.',
  delayIntensityLabel: 'How strong is the urge?',
  delayContextLabel: "What's going on?",
  delayStartBtn: 'Start session',
  delayInhale: 'Breathe in',
  delayHold: 'Hold',
  delayExhale: 'Breathe out',
  delayTimeLeft: 'remaining',
  delayMinutes: 'min',
  delaySeconds: 'sec',
  delayAiMessage1: 'Cravings peak and pass, usually within 3–5 minutes. You are already through the hardest part.',
  delayAiMessage2: 'Notice the urge without fighting it. You are the observer, not the craving.',
  delayAiMessage3: 'Your body is healing every minute. This moment of delay is meaningful.',
  delayAiMessage4: 'One breath at a time. You do not need to quit forever right now — just for this moment.',
  delayAiMessage5: 'You have gotten through cravings before. This one will pass too.',
  delayOutcomeTitle: 'Session complete',
  delayOutcomeSuccess: 'I made it through ✨',
  delayOutcomeSmoked: 'I smoked anyway — that\'s okay',
  delayOutcomeSuccessMsg: 'That was real progress. Each delay rewires the pattern a little.',
  delayOutcomeSmokedMsg: "Smoking after a craving delay still reduced the total. That counts. Tomorrow is another chance.",
  delayEndEarly: 'End session',

  coachTitle: 'Your Coach',
  coachInputPlaceholder: 'Talk to your coach...',
  coachSend: 'Send',
  coachQuick1: 'Help me through a craving',
  coachQuick2: 'I just slipped up',
  coachQuick3: "How am I doing?",
  coachQuick4: "I'm stressed and want to smoke",
  coachDisclaimer: 'SmokeLess AI is a behavioral support tool, not a medical service. For health emergencies, contact a professional.',
  coachCrisisMsg: "I hear that you're struggling. Please know you're not alone. If you're having thoughts of harming yourself, please reach out to a crisis line immediately.",
  coachCrisisResources: 'Crisis Resources: iCall India: 9152987821 | Vandrevala Foundation: 1860-2662-345',
  coachTyping: 'Coach is thinking...',
  coachOffline: "I'm having trouble connecting right now. Here's something to remember: this craving will pass. Take 3 slow breaths and notice the feeling without acting on it.",

  progressTitle: 'Your Progress',
  progressHealthTitle: 'Health Recovery',
  progressMoneyTitle: 'Money Saved',
  progressMoneySaved: 'Total saved',
  progressMoneyProjected: 'Projected yearly savings',
  progressPatternsTitle: 'Patterns',
  progressCigsPerDay: 'avg per day',
  progressDaysTracked: 'days tracked',
  progressFreeTime: 'delay sessions',
  progressAchieved: 'Achieved',
  progressUpcoming: 'Upcoming',

  milestone20min: '20 Minutes',
  milestone12hr: '12 Hours',
  milestone24hr: '24 Hours',
  milestone48hr: '48 Hours',
  milestone1week: '1 Week',
  milestone1month: '1 Month',
  milestone3months: '3 Months',
  milestone6months: '6 Months',
  milestone1year: '1 Year',
  milestone5years: '5 Years',
  milestone10years: '10 Years',
  milestone20minDesc: 'Heart rate and blood pressure begin to drop toward normal levels.',
  milestone12hrDesc: 'Carbon monoxide in your blood returns to normal, and oxygen levels rise.',
  milestone24hrDesc: 'Your heart attack risk already begins to decrease.',
  milestone48hrDesc: 'Nerve endings begin to regrow. Your sense of smell and taste start improving.',
  milestone1weekDesc: 'Circulation improves and lung function increases noticeably.',
  milestone1monthDesc: 'Coughing and shortness of breath decrease. Cilia in the lungs begin to regain normal function.',
  milestone3monthsDesc: 'Lung function continues to improve. Your risk of infection decreases.',
  milestone6monthsDesc: 'Many people notice significantly improved energy and breathing.',
  milestone1yearDesc: 'Your risk of coronary heart disease is now half that of someone who still smokes.',
  milestone5yearsDesc: 'Your stroke risk is now similar to that of a non-smoker.',
  milestone10yearsDesc: 'Your risk of lung cancer is about half that of someone who still smokes.',

  achievementsTitle: 'Milestones',
  achievementEarned: 'Earned',
  achievementUpcoming: 'Keep going',
  achievementFirstDelay: 'First Delay',
  achievementFirstDelayDesc: 'Completed your first urge delay session.',
  achievement5Delays: 'Delay Champion',
  achievement5DelaysDesc: 'Completed 5 urge delay sessions.',
  achievement7DayStreak: 'One Week Strong',
  achievement7DayStreakDesc: 'Maintained a 7-day smoke-free streak.',
  achievement30DayStreak: 'Monthly Milestone',
  achievement30DayStreakDesc: 'A full month of your journey. Remarkable.',
  achievementFirstLog: 'Honest Tracker',
  achievementFirstLogDesc: 'Logged your first entry. Honest data is the foundation of change.',
  achievement100Saved: '₹100 Saved',
  achievement100SavedDesc: "You've saved your first ₹100. Small wins add up.",
  achievementOneWeekFree: 'Week Free',
  achievementOneWeekFreeDesc: 'Seven smoke-free days. Your lungs are already noticing.',

  onboardingWelcomeTitle: 'Welcome to SmokeLess AI',
  onboardingWelcomeSubtitle: "Your calm, non-judgmental coach for reducing smoking — one moment at a time.",
  onboardingWelcomeBtn: 'Get started',
  onboardingGuestBtn: 'Try without an account',
  onboardingLangTitle: 'Choose your language',
  onboardingLangSubtitle: 'All coaching, notifications and reports will be in your selected language.',
  onboardingBaselineTitle: 'Your starting point',
  onboardingBaselineSubtitle: "This helps us track your progress accurately. You can update it any time.",
  onboardingDailyCount: 'Cigarettes per day (roughly)',
  onboardingDailyCountPlaceholder: 'e.g. 10',
  onboardingCostPerPack: 'Cost per pack',
  onboardingCostPlaceholder: 'e.g. 250',
  onboardingCigsPerPack: 'Cigarettes per pack',
  onboardingCurrency: 'Currency (₹, $, €...)',
  onboardingMotivationTitle: "What's driving you?",
  onboardingMotivationSubtitle: 'Choose as many as feel true — no wrong answers.',
  onboardingMotivFamily: 'My family',
  onboardingMotivHealth: 'My health',
  onboardingMotivMoney: 'Save money',
  onboardingMotivFeel: 'Feel better',
  onboardingMotivOther: 'My own reasons',
  onboardingGoalTitle: 'How do you want to approach this?',
  onboardingGoalSubtitle: "There's no single right path. Pick what feels honest.",
  onboardingGoalQuit: 'Quit completely',
  onboardingGoalQuitDesc: 'Working toward full cessation',
  onboardingGoalReduce: 'Reduce gradually',
  onboardingGoalReduceDesc: 'Cut down at my own pace',
  onboardingGoalTrack: 'Just track for now',
  onboardingGoalTrackDesc: "Understand my patterns first",
  onboardingDone: "Let's begin",

  settingsTitle: 'Settings',
  settingsLanguage: 'Language',
  settingsTheme: 'Appearance',
  settingsThemeDark: 'Dark',
  settingsThemeLight: 'Light',
  settingsThemeSystem: 'Follow system',
  settingsNotifications: 'Notifications',
  settingsNotificationsOn: 'On',
  settingsNotificationsOff: 'Off',
  settingsAccount: 'Account & Security',
  settingsExport: 'Export my data',
  settingsDelete: 'Delete account',
  settingsDeleteConfirm: 'Are you sure? This permanently deletes all your data.',
  settingsDeleteWarning: 'This cannot be undone.',
  settingsCrisis: 'Crisis resources',
  settingsAbout: 'About SmokeLess AI',
  settingsVersion: 'Version',

  authLoginTitle: 'Sign in',
  authEmail: 'Email address',
  authPassword: 'Password',
  authLogin: 'Sign in',
  authSignup: 'Create account',
  authGoogle: 'Continue with Google',
  authMagicLink: 'Send magic link',
  authNoAccount: "Don't have an account?",
  authHaveAccount: 'Already have an account?',
  authForgotPassword: 'Forgot password?',
  authGuestNote: "Guest data is stored on this device only. Create an account to back it up.",
  authEmailSent: 'Check your email — we sent you a sign-in link.',

  errorGeneric: 'Something went wrong. Please try again.',
  errorNetwork: "Something didn't sync — we'll retry automatically.",
  errorAuth: 'Sign in failed. Please check your details.',
  errorSync: 'Could not save right now — queued for retry.',

  companionWord: 'companion',
  personaMentor: 'Wise Mentor',
  personaMentorTagline: 'Grounded and insightful — speaks with quiet wisdom.',
  personaFriend: 'Friend',
  personaFriendTagline: 'Warm and casual — celebrates every win with you.',
  personaGuide: 'Calm Guide',
  personaGuideTagline: 'Gentle and present, like a slow, steady breath.',
  onboardingPersonaTitle: 'Choose your companion',
  onboardingPersonaSubtitle: "They'll walk this journey with you. You can change them any time.",
  settingsCompanion: 'Your companion',

  homeStorySectionTitle: 'Your story so far',
  homeCleanAirTitle: 'Clean breathing',
  homeCleanAirCaption: 'minutes of easier breaths reclaimed',
  homeAvoidedTitle: 'Not smoked',
  homeAvoidedCaption: "cigarettes you chose not to light",
  homeLifeTitle: 'Life regained',
  homeLifeCaption: 'estimated minutes returned to you',
  homeMoneyPrefix: "That's enough for",
  moneyStoryStart: 'a small treat, very soon',
  moneyStoryCoffee: 'a good cup of coffee',
  moneyStoryMeal: 'a proper meal out',
  moneyStoryDinner: 'a celebratory dinner',
  moneyStoryTreat: 'a gift for someone you love',
  moneyStoryGetaway: 'a little weekend getaway',
  unitMin: 'min',

  coachEmptyTitle: "I'm here with you",
  coachEmptySubtitle: "I know your progress, your triggers, and your wins. Tell me what's on your mind — no judgment, ever.",

  interveneTitle: 'Ride the wave',
  interveneSubtitle: 'A craving is a wave — it rises, crests, and always falls. Pick what you need right now.',
  interveneCalming: 'Breathe',
  interveneCalmingDesc: 'A guided breathing space to settle your body.',
  interveneCognitive: 'Future self',
  interveneCognitiveDesc: 'Reconnect with the reason you started.',
  interveneIncentive: 'See your wins',
  interveneIncentiveDesc: 'Watch what your progress is already buying back.',
  intervenePhysical: 'Reset your body',
  intervenePhysicalDesc: 'Small physical actions that ease the urge.',
  interveneDistraction: 'Shift focus',
  interveneDistractionDesc: 'A tiny challenge to let the wave pass.',
  interveneChooseAnother: 'Choose something else',
  interveneReflectDone: 'I feel steadier now',
  cognitiveIntro: 'Take a slow breath and sit with one of these:',
  cognitivePrompt1: 'Picture yourself a year from now, breathing easily on a morning walk. What does that version of you feel?',
  cognitivePrompt2: 'Remember why you started. Who — or what — are you doing this for?',
  cognitivePrompt3: 'This craving passes whether you smoke or not. What would the you-you-want-to-be choose right now?',
  physicalIntro: 'Cravings live in the body. Move through these three:',
  physicalStep1: 'Drink a full glass of water, slowly.',
  physicalStep2: 'Stand and stretch your arms overhead for 20 seconds.',
  physicalStep3: 'Roll your shoulders back five times and unclench your jaw.',
  distractionIntro: 'Give your mind a small, absorbing task for two minutes:',
  distractionTask1: 'Name five things you can see, four you can hear, three you can touch.',
  distractionTask2: 'Count backwards from 100 in sevens: 100, 93, 86…',
  distractionTask3: 'Send someone you care about a single kind sentence.',
  incentiveIntro: 'Every craving you ride is already paying off:',
};

const hi: TranslationKeys = {
  appName: 'SmokeLess AI',
  loading: 'लोड हो रहा है...',
  skip: 'अभी छोड़ें',
  next: 'जारी रखें',
  done: 'हो गया',
  cancel: 'रद्द करें',
  save: 'सहेजें',
  delete: 'हटाएं',
  confirm: 'पुष्टि करें',
  back: 'वापस',
  or: 'या',

  tabHome: 'आज',
  tabCoach: 'कोच',
  tabProgress: 'प्रगति',
  tabAchievements: 'उपलब्धियां',
  tabSettings: 'सेटिंग्स',

  homeGreetingMorning: 'सुप्रभात',
  homeGreetingAfternoon: 'नमस्कार',
  homeGreetingEvening: 'शुभ संध्या',
  homeGreetingNight: 'अभी भी जाग रहे हैं?',
  homeCravingBtn: 'तलब लग रही है',
  homeLogCig: 'सिगरेट नोट करें',
  homeTodayCount: 'आज की सिगरेट',
  homeBaselineCount: 'आपकी आधार रेखा',
  homeMoneySaved: 'बचाया पैसा',
  homeMoneyToday: 'आज',
  homeStreakCurrent: 'वर्तमान स्ट्रीक',
  homeStreakBest: 'सबसे अच्छा',
  homeStreakDays: 'दिन',
  homeStreakDay: 'दिन',
  homeNudgeDefault: 'हर तलब जो आप टालते हैं वह एक जीत है — चाहे छोटी हो।',
  homeNudgeMorning: 'बिना सिगरेट के सुबह शुरू करना आज का सबसे अच्छा काम है।',
  homeNudgeEvening: 'आप लगभग पूरे दिन से गुजर चुके हैं। शाम का समय आखिरी कदम है।',

  logTitle: 'सिगरेट नोट करें',
  logContextQuestion: 'इसकी वजह क्या रही? (वैकल्पिक)',
  logContextStress: 'तनाव',
  logContextSocial: 'दोस्तों के साथ',
  logContextHabit: 'आदत',
  logContextBoredom: 'बोरियत',
  logContextAlcohol: 'शराब के साथ',
  logContextOther: 'अन्य',
  logNote: 'नोट',
  logNotePlaceholder: 'कुछ और जोड़ना चाहते हैं? (वैकल्पिक)',
  logSubmit: 'नोट करें',
  loggedSuccess: 'दर्ज हो गया',
  loggedMessage: 'ईमानदारी से नोट करना ही प्रगति का तरीका है। आप सही कर रहे हैं।',

  delayTitle: 'तलब देरी सत्र',
  delaySubtitle: 'तलब को गुजरने दें — यह आमतौर पर कुछ ही मिनटों में होती है।',
  delayIntensityLabel: 'तलब कितनी तेज है?',
  delayContextLabel: 'क्या हो रहा है?',
  delayStartBtn: 'सत्र शुरू करें',
  delayInhale: 'सांस लें',
  delayHold: 'रोकें',
  delayExhale: 'सांस छोड़ें',
  delayTimeLeft: 'शेष',
  delayMinutes: 'मिनट',
  delaySeconds: 'सेकंड',
  delayAiMessage1: 'तलब 3-5 मिनट में अपने आप गुजर जाती है। आप पहले से ही सबसे कठिन हिस्से से गुजर चुके हैं।',
  delayAiMessage2: 'तलब को देखें, उससे लड़ें नहीं। आप देखने वाले हैं, तलब नहीं।',
  delayAiMessage3: 'आपका शरीर हर मिनट ठीक हो रहा है। यह देरी का पल मायने रखती है।',
  delayAiMessage4: 'एक-एक सांस। आपको अभी हमेशा के लिए छोड़ने की जरूरत नहीं — बस इस पल के लिए।',
  delayAiMessage5: 'आप पहले भी तलब से गुजर चुके हैं। यह भी गुजर जाएगी।',
  delayOutcomeTitle: 'सत्र पूरा हुआ',
  delayOutcomeSuccess: 'मैं कर गया ✨',
  delayOutcomeSmoked: 'मैंने फिर भी पी — कोई बात नहीं',
  delayOutcomeSuccessMsg: 'यह सच्ची प्रगति थी। हर देरी पैटर्न को थोड़ा बदलती है।',
  delayOutcomeSmokedMsg: 'तलब के बाद सिगरेट पीने से भी कुल संख्या कम हुई। यह भी मायने रखता है।',
  delayEndEarly: 'सत्र समाप्त करें',

  coachTitle: 'आपका कोच',
  coachInputPlaceholder: 'अपने कोच से बात करें...',
  coachSend: 'भेजें',
  coachQuick1: 'तलब से गुजरने में मदद करें',
  coachQuick2: 'मैं थोड़ा फिसल गया',
  coachQuick3: 'मैं कैसा कर रहा हूं?',
  coachQuick4: 'मुझे तनाव है और सिगरेट पीना चाहता हूं',
  coachDisclaimer: 'SmokeLess AI एक व्यवहार सहायता उपकरण है, चिकित्सा सेवा नहीं। स्वास्थ्य आपातकाल में किसी पेशेवर से संपर्क करें।',
  coachCrisisMsg: 'मैं समझता हूं कि आप संघर्ष कर रहे हैं। आप अकेले नहीं हैं। अगर आप खुद को नुकसान पहुंचाने के बारे में सोच रहे हैं, तो कृपया तुरंत किसी संकट हेल्पलाइन से संपर्क करें।',
  coachCrisisResources: 'संकट सहायता: iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345',
  coachTyping: 'कोच सोच रहा है...',
  coachOffline: 'अभी कनेक्ट करने में समस्या है। याद रखें: यह तलब गुजर जाएगी। 3 धीमी सांसें लें।',

  progressTitle: 'आपकी प्रगति',
  progressHealthTitle: 'स्वास्थ्य सुधार',
  progressMoneyTitle: 'बचाया पैसा',
  progressMoneySaved: 'कुल बचत',
  progressMoneyProjected: 'वार्षिक बचत का अनुमान',
  progressPatternsTitle: 'पैटर्न',
  progressCigsPerDay: 'प्रति दिन औसत',
  progressDaysTracked: 'दिन ट्रैक किए',
  progressFreeTime: 'देरी सत्र',
  progressAchieved: 'प्राप्त',
  progressUpcoming: 'आगामी',

  milestone20min: '20 मिनट',
  milestone12hr: '12 घंटे',
  milestone24hr: '24 घंटे',
  milestone48hr: '48 घंटे',
  milestone1week: '1 सप्ताह',
  milestone1month: '1 महीना',
  milestone3months: '3 महीने',
  milestone6months: '6 महीने',
  milestone1year: '1 साल',
  milestone5years: '5 साल',
  milestone10years: '10 साल',
  milestone20minDesc: 'हृदय गति और रक्तचाप सामान्य स्तर की ओर कम होने लगते हैं।',
  milestone12hrDesc: 'रक्त में कार्बन मोनोऑक्साइड सामान्य हो जाती है, ऑक्सीजन का स्तर बढ़ता है।',
  milestone24hrDesc: 'दिल के दौरे का जोखिम कम होने लगता है।',
  milestone48hrDesc: 'तंत्रिका अंत फिर से बढ़ने लगते हैं। गंध और स्वाद में सुधार शुरू होता है।',
  milestone1weekDesc: 'रक्त परिसंचरण में सुधार और फेफड़ों की क्षमता बढ़ती है।',
  milestone1monthDesc: 'खांसी और सांस की तकलीफ कम होती है। फेफड़ों में सिलिया सामान्य काम करने लगती है।',
  milestone3monthsDesc: 'फेफड़ों की कार्यक्षमता में सुधार जारी रहता है। संक्रमण का जोखिम कम होता है।',
  milestone6monthsDesc: 'कई लोगों को ऊर्जा और सांस लेने में उल्लेखनीय सुधार दिखता है।',
  milestone1yearDesc: 'हृदय रोग का जोखिम धूम्रपान करने वाले की तुलना में आधा हो जाता है।',
  milestone5yearsDesc: 'स्ट्रोक का जोखिम अब धूम्रपान न करने वाले के समान है।',
  milestone10yearsDesc: 'फेफड़ों के कैंसर का जोखिम अब धूम्रपान करने वाले की तुलना में लगभग आधा है।',

  achievementsTitle: 'उपलब्धियां',
  achievementEarned: 'अर्जित',
  achievementUpcoming: 'आगे बढ़ते रहें',
  achievementFirstDelay: 'पहली देरी',
  achievementFirstDelayDesc: 'अपना पहला तलब देरी सत्र पूरा किया।',
  achievement5Delays: 'देरी चैंपियन',
  achievement5DelaysDesc: '5 तलब देरी सत्र पूरे किए।',
  achievement7DayStreak: 'एक सप्ताह मजबूत',
  achievement7DayStreakDesc: '7 दिन का धूम्रपान-मुक्त स्ट्रीक।',
  achievement30DayStreak: 'मासिक मील का पत्थर',
  achievement30DayStreakDesc: 'एक पूरा महीना। उल्लेखनीय।',
  achievementFirstLog: 'ईमानदार ट्रैकर',
  achievementFirstLogDesc: 'पहली एंट्री नोट की। ईमानदारी बदलाव की नींव है।',
  achievement100Saved: '₹100 बचाए',
  achievement100SavedDesc: 'आपने पहले ₹100 बचाए। छोटी जीतें जुड़ती हैं।',
  achievementOneWeekFree: 'एक सप्ताह मुक्त',
  achievementOneWeekFreeDesc: 'सात धूम्रपान-मुक्त दिन। आपके फेफड़े पहले से नोटिस कर रहे हैं।',

  onboardingWelcomeTitle: 'SmokeLess AI में स्वागत है',
  onboardingWelcomeSubtitle: 'धूम्रपान कम करने के लिए आपका शांत, गैर-न्यायिक कोच — एक पल में।',
  onboardingWelcomeBtn: 'शुरू करें',
  onboardingGuestBtn: 'बिना अकाउंट के आज़माएं',
  onboardingLangTitle: 'अपनी भाषा चुनें',
  onboardingLangSubtitle: 'सभी कोचिंग, सूचनाएं और रिपोर्ट आपकी चुनी भाषा में होंगी।',
  onboardingBaselineTitle: 'आपका शुरुआती बिंदु',
  onboardingBaselineSubtitle: 'यह हमें आपकी प्रगति सटीक रूप से ट्रैक करने में मदद करता है।',
  onboardingDailyCount: 'प्रति दिन सिगरेट (लगभग)',
  onboardingDailyCountPlaceholder: 'जैसे 10',
  onboardingCostPerPack: 'एक पैक की कीमत',
  onboardingCostPlaceholder: 'जैसे 250',
  onboardingCigsPerPack: 'पैक में सिगरेट',
  onboardingCurrency: 'मुद्रा (₹, $, €...)',
  onboardingMotivationTitle: 'आपको क्या प्रेरित करता है?',
  onboardingMotivationSubtitle: 'जितने सच लगें उतने चुनें — कोई गलत जवाब नहीं।',
  onboardingMotivFamily: 'मेरा परिवार',
  onboardingMotivHealth: 'मेरा स्वास्थ्य',
  onboardingMotivMoney: 'पैसे बचाना',
  onboardingMotivFeel: 'बेहतर महसूस करना',
  onboardingMotivOther: 'मेरे अपने कारण',
  onboardingGoalTitle: 'आप इसे कैसे अपनाना चाहते हैं?',
  onboardingGoalSubtitle: 'कोई एक सही रास्ता नहीं है। जो सच लगे वह चुनें।',
  onboardingGoalQuit: 'पूरी तरह छोड़ना',
  onboardingGoalQuitDesc: 'पूर्ण छोड़ने की दिशा में काम करना',
  onboardingGoalReduce: 'धीरे-धीरे कम करना',
  onboardingGoalReduceDesc: 'अपनी गति से कम करना',
  onboardingGoalTrack: 'अभी सिर्फ ट्रैक करना',
  onboardingGoalTrackDesc: 'पहले अपने पैटर्न समझना',
  onboardingDone: 'चलिए शुरू करें',

  settingsTitle: 'सेटिंग्स',
  settingsLanguage: 'भाषा',
  settingsTheme: 'स्वरूप',
  settingsThemeDark: 'डार्क',
  settingsThemeLight: 'लाइट',
  settingsThemeSystem: 'सिस्टम अनुसार',
  settingsNotifications: 'सूचनाएं',
  settingsNotificationsOn: 'चालू',
  settingsNotificationsOff: 'बंद',
  settingsAccount: 'अकाउंट और सुरक्षा',
  settingsExport: 'मेरा डेटा निर्यात करें',
  settingsDelete: 'अकाउंट हटाएं',
  settingsDeleteConfirm: 'क्या आप निश्चित हैं? यह आपका सारा डेटा स्थायी रूप से हटा देगा।',
  settingsDeleteWarning: 'यह वापस नहीं किया जा सकता।',
  settingsCrisis: 'संकट संसाधन',
  settingsAbout: 'SmokeLess AI के बारे में',
  settingsVersion: 'संस्करण',

  authLoginTitle: 'साइन इन करें',
  authEmail: 'ईमेल पता',
  authPassword: 'पासवर्ड',
  authLogin: 'साइन इन',
  authSignup: 'अकाउंट बनाएं',
  authGoogle: 'Google से जारी रखें',
  authMagicLink: 'मैजिक लिंक भेजें',
  authNoAccount: 'अकाउंट नहीं है?',
  authHaveAccount: 'पहले से अकाउंट है?',
  authForgotPassword: 'पासवर्ड भूल गए?',
  authGuestNote: 'गेस्ट डेटा केवल इस डिवाइस पर है। बैकअप के लिए अकाउंट बनाएं।',
  authEmailSent: 'अपना ईमेल देखें — हमने आपको साइन-इन लिंक भेजा है।',

  errorGeneric: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
  errorNetwork: 'कुछ सिंक नहीं हुआ — हम स्वचालित रूप से पुनः प्रयास करेंगे।',
  errorAuth: 'साइन इन विफल। कृपया अपनी जानकारी जांचें।',
  errorSync: 'अभी सेव नहीं हो सका — पुनः प्रयास के लिए कतार में है।',

  companionWord: 'साथी',
  personaMentor: 'बुद्धिमान मार्गदर्शक',
  personaMentorTagline: 'गंभीर और अंतर्दृष्टिपूर्ण — शांत ज्ञान से बात करता है।',
  personaFriend: 'दोस्त',
  personaFriendTagline: 'गर्मजोश और सहज — हर जीत आपके साथ मनाता है।',
  personaGuide: 'शांत गाइड',
  personaGuideTagline: 'कोमल और मौजूद, एक धीमी, स्थिर सांस की तरह।',
  onboardingPersonaTitle: 'अपना साथी चुनें',
  onboardingPersonaSubtitle: 'वे इस सफर में आपके साथ चलेंगे। आप इन्हें कभी भी बदल सकते हैं।',
  settingsCompanion: 'आपका साथी',

  homeStorySectionTitle: 'अब तक की आपकी कहानी',
  homeCleanAirTitle: 'साफ सांसें',
  homeCleanAirCaption: 'आसान सांसों के वापस पाए मिनट',
  homeAvoidedTitle: 'नहीं पी',
  homeAvoidedCaption: 'सिगरेट जो आपने नहीं जलाईं',
  homeLifeTitle: 'वापस पाया जीवन',
  homeLifeCaption: 'अनुमानित मिनट जो आपको लौटे',
  homeMoneyPrefix: 'यह काफी है',
  moneyStoryStart: 'जल्द ही एक छोटी खुशी के लिए',
  moneyStoryCoffee: 'एक अच्छी कॉफी के लिए',
  moneyStoryMeal: 'बाहर एक अच्छे भोजन के लिए',
  moneyStoryDinner: 'एक जश्न के डिनर के लिए',
  moneyStoryTreat: 'किसी प्रिय के लिए तोहफे के लिए',
  moneyStoryGetaway: 'एक छोटी वीकेंड सैर के लिए',
  unitMin: 'मिनट',

  coachEmptyTitle: 'मैं आपके साथ हूं',
  coachEmptySubtitle: 'मुझे आपकी प्रगति, ट्रिगर और जीतें पता हैं। जो मन में है बताएं — कोई निर्णय नहीं, कभी नहीं।',

  interveneTitle: 'लहर के साथ बहें',
  interveneSubtitle: 'तलब एक लहर है — यह उठती है, चरम पर आती है और हमेशा गिरती है। अभी जो चाहिए वह चुनें।',
  interveneCalming: 'सांस लें',
  interveneCalmingDesc: 'शरीर को शांत करने के लिए निर्देशित सांस।',
  interveneCognitive: 'भविष्य का मैं',
  interveneCognitiveDesc: 'जिस कारण से शुरू किया उससे फिर जुड़ें।',
  interveneIncentive: 'अपनी जीतें देखें',
  interveneIncentiveDesc: 'देखें आपकी प्रगति क्या लौटा रही है।',
  intervenePhysical: 'शरीर को रीसेट करें',
  intervenePhysicalDesc: 'छोटे शारीरिक काम जो तलब कम करते हैं।',
  interveneDistraction: 'ध्यान बदलें',
  interveneDistractionDesc: 'लहर को गुजरने देने के लिए एक छोटी चुनौती।',
  interveneChooseAnother: 'कुछ और चुनें',
  interveneReflectDone: 'अब मैं ज्यादा स्थिर महसूस करता हूं',
  cognitiveIntro: 'एक धीमी सांस लें और इनमें से किसी पर ठहरें:',
  cognitivePrompt1: 'एक साल बाद खुद की कल्पना करें, सुबह की सैर में आसानी से सांस लेते हुए। वह आप कैसा महसूस करता है?',
  cognitivePrompt2: 'याद करें आपने क्यों शुरू किया। किसके लिए कर रहे हैं?',
  cognitivePrompt3: 'यह तलब गुजर जाएगी चाहे आप पिएं या नहीं। जो आप बनना चाहते हैं वह अभी क्या चुनेगा?',
  physicalIntro: 'तलब शरीर में रहती है। इन तीन से गुजरें:',
  physicalStep1: 'धीरे-धीरे एक पूरा गिलास पानी पिएं।',
  physicalStep2: 'खड़े होकर 20 सेकंड अपनी बाहें ऊपर फैलाएं।',
  physicalStep3: 'अपने कंधे पांच बार पीछे घुमाएं और जबड़ा ढीला करें।',
  distractionIntro: 'दो मिनट के लिए मन को एक छोटा काम दें:',
  distractionTask1: 'पांच चीजें बताएं जो आप देख सकते हैं, चार जो सुन सकते हैं, तीन जो छू सकते हैं।',
  distractionTask2: '100 से सात-सात घटाकर उल्टा गिनें: 100, 93, 86…',
  distractionTask3: 'किसी प्रिय को एक अच्छा वाक्य भेजें।',
  incentiveIntro: 'हर तलब जिसे आप संभालते हैं वह पहले से फायदा दे रही है:',
};

const bn: TranslationKeys = {
  appName: 'SmokeLess AI',
  loading: 'লোড হচ্ছে...',
  skip: 'এখন এড়িয়ে যান',
  next: 'চালিয়ে যান',
  done: 'সম্পন্ন',
  cancel: 'বাতিল',
  save: 'সংরক্ষণ',
  delete: 'মুছুন',
  confirm: 'নিশ্চিত করুন',
  back: 'পিছনে',
  or: 'বা',

  tabHome: 'আজ',
  tabCoach: 'কোচ',
  tabProgress: 'অগ্রগতি',
  tabAchievements: 'মাইলফলক',
  tabSettings: 'সেটিংস',

  homeGreetingMorning: 'শুভ সকাল',
  homeGreetingAfternoon: 'শুভ অপরাহ্ন',
  homeGreetingEvening: 'শুভ সন্ধ্যা',
  homeGreetingNight: 'এখনও জেগে আছেন?',
  homeCravingBtn: 'ইচ্ছে হচ্ছে',
  homeLogCig: 'সিগারেট নোট করুন',
  homeTodayCount: 'আজকের সিগারেট',
  homeBaselineCount: 'আপনার বেসলাইন',
  homeMoneySaved: 'সঞ্চিত অর্থ',
  homeMoneyToday: 'আজ',
  homeStreakCurrent: 'বর্তমান স্ট্রিক',
  homeStreakBest: 'সর্বোচ্চ',
  homeStreakDays: 'দিন',
  homeStreakDay: 'দিন',
  homeNudgeDefault: 'প্রতিটি আকাঙ্ক্ষা যা আপনি বিলম্বিত করেন তা একটি জয় — এমনকি ছোট হলেও।',
  homeNudgeMorning: 'ধূমপান ছাড়া সকাল শুরু করা আজকের সেরা কাজ।',
  homeNudgeEvening: 'আপনি প্রায় পুরো দিন পার করেছেন। সন্ধ্যাটাই শেষ ধাপ।',

  logTitle: 'সিগারেট নোট করুন',
  logContextQuestion: 'কারণটি কী ছিল? (ঐচ্ছিক)',
  logContextStress: 'চাপ',
  logContextSocial: 'বন্ধুদের সাথে',
  logContextHabit: 'অভ্যাস',
  logContextBoredom: 'বিরক্তি',
  logContextAlcohol: 'মদের সাথে',
  logContextOther: 'অন্যান্য',
  logNote: 'নোট',
  logNotePlaceholder: 'আরও কিছু যোগ করতে চান? (ঐচ্ছিক)',
  logSubmit: 'নোট করুন',
  loggedSuccess: 'নথিভুক্ত',
  loggedMessage: 'সৎভাবে ট্র্যাক করাই অগ্রগতির পথ। আপনি সঠিক করছেন।',

  delayTitle: 'আকাঙ্ক্ষা বিলম্ব সেশন',
  delaySubtitle: 'আকাঙ্ক্ষাটি কেটে যেতে দিন — সাধারণত কয়েক মিনিটেই হয়।',
  delayIntensityLabel: 'আকাঙ্ক্ষা কতটা তীব্র?',
  delayContextLabel: 'কী হচ্ছে?',
  delayStartBtn: 'সেশন শুরু করুন',
  delayInhale: 'শ্বাস নিন',
  delayHold: 'ধরুন',
  delayExhale: 'শ্বাস ছাড়ুন',
  delayTimeLeft: 'বাকি',
  delayMinutes: 'মিনিট',
  delaySeconds: 'সেকেন্ড',
  delayAiMessage1: 'আকাঙ্ক্ষা ৩-৫ মিনিটে নিজেই কেটে যায়। আপনি ইতিমধ্যে সবচেয়ে কঠিন অংশ পার করেছেন।',
  delayAiMessage2: 'আকাঙ্ক্ষাটি লক্ষ্য করুন, লড়াই করবেন না। আপনি পর্যবেক্ষক, আকাঙ্ক্ষা নন।',
  delayAiMessage3: 'আপনার শরীর প্রতি মিনিটে সুস্থ হচ্ছে। এই বিলম্বের মুহূর্তটি গুরুত্বপূর্ণ।',
  delayAiMessage4: 'একটি শ্বাসে একটি শ্বাস। আপনাকে এখনই চিরতরে ছাড়তে হবে না — শুধু এই মুহূর্তের জন্য।',
  delayAiMessage5: 'আপনি আগেও আকাঙ্ক্ষা কাটিয়েছেন। এটিও কেটে যাবে।',
  delayOutcomeTitle: 'সেশন সম্পন্ন',
  delayOutcomeSuccess: 'আমি পারলাম ✨',
  delayOutcomeSmoked: 'আমি তবুও খেলাম — ঠিক আছে',
  delayOutcomeSuccessMsg: 'এটি সত্যিকারের অগ্রগতি ছিল। প্রতিটি বিলম্ব প্যাটার্নটিকে একটু পরিবর্তন করে।',
  delayOutcomeSmokedMsg: 'বিলম্বের পরে সিগারেট খেলেও মোট সংখ্যা কমেছে। এটাও গণনা হয়।',
  delayEndEarly: 'সেশন শেষ করুন',

  coachTitle: 'আপনার কোচ',
  coachInputPlaceholder: 'আপনার কোচের সাথে কথা বলুন...',
  coachSend: 'পাঠান',
  coachQuick1: 'আকাঙ্ক্ষা কাটাতে সাহায্য করুন',
  coachQuick2: 'আমি একটু হোঁচট খেলাম',
  coachQuick3: 'আমি কেমন করছি?',
  coachQuick4: 'আমি চাপে আছি এবং ধূমপান করতে চাই',
  coachDisclaimer: 'SmokeLess AI একটি আচরণগত সহায়তা সরঞ্জাম, চিকিৎসা সেবা নয়। স্বাস্থ্য জরুরি অবস্থায় পেশাদারের সাথে যোগাযোগ করুন।',
  coachCrisisMsg: 'আমি বুঝতে পারছি আপনি সংগ্রাম করছেন। আপনি একা নন। যদি আপনি নিজেকে আঘাত করার কথা ভাবছেন, অনুগ্রহ করে এখনই একটি সংকট হেল্পলাইনে যোগাযোগ করুন।',
  coachCrisisResources: 'সংকট সহায়তা: iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345',
  coachTyping: 'কোচ ভাবছে...',
  coachOffline: 'এখন সংযোগ করতে সমস্যা হচ্ছে। মনে রাখুন: এই আকাঙ্ক্ষা কেটে যাবে। ৩টি ধীর শ্বাস নিন।',

  progressTitle: 'আপনার অগ্রগতি',
  progressHealthTitle: 'স্বাস্থ্য পুনরুদ্ধার',
  progressMoneyTitle: 'সঞ্চিত অর্থ',
  progressMoneySaved: 'মোট সাশ্রয়',
  progressMoneyProjected: 'বার্ষিক সাশ্রয়ের অনুমান',
  progressPatternsTitle: 'প্যাটার্ন',
  progressCigsPerDay: 'প্রতিদিন গড়',
  progressDaysTracked: 'দিন ট্র্যাক করা হয়েছে',
  progressFreeTime: 'বিলম্ব সেশন',
  progressAchieved: 'অর্জিত',
  progressUpcoming: 'আসছে',

  milestone20min: '২০ মিনিট',
  milestone12hr: '১২ ঘণ্টা',
  milestone24hr: '২৪ ঘণ্টা',
  milestone48hr: '৪৮ ঘণ্টা',
  milestone1week: '১ সপ্তাহ',
  milestone1month: '১ মাস',
  milestone3months: '৩ মাস',
  milestone6months: '৬ মাস',
  milestone1year: '১ বছর',
  milestone5years: '৫ বছর',
  milestone10years: '১০ বছর',
  milestone20minDesc: 'হৃদস্পন্দন এবং রক্তচাপ স্বাভাবিক মাত্রায় কমতে শুরু করে।',
  milestone12hrDesc: 'রক্তে কার্বন মনোক্সাইড স্বাভাবিক হয়, অক্সিজেনের মাত্রা বাড়ে।',
  milestone24hrDesc: 'হার্ট অ্যাটাকের ঝুঁকি কমতে শুরু করে।',
  milestone48hrDesc: 'স্নায়ু প্রান্ত পুনরায় বৃদ্ধি পেতে শুরু করে। গন্ধ ও স্বাদের অনুভূতি উন্নত হয়।',
  milestone1weekDesc: 'রক্ত সঞ্চালন উন্নত হয় এবং ফুসফুসের কার্যক্ষমতা বাড়ে।',
  milestone1monthDesc: 'কাশি ও শ্বাসকষ্ট কমে। ফুসফুসে সিলিয়া স্বাভাবিক কাজ শুরু করে।',
  milestone3monthsDesc: 'ফুসফুসের কার্যক্ষমতা উন্নত হতে থাকে। সংক্রমণের ঝুঁকি কমে।',
  milestone6monthsDesc: 'অনেকে শক্তি এবং শ্বাসে উল্লেখযোগ্য উন্নতি লক্ষ্য করেন।',
  milestone1yearDesc: 'হৃদরোগের ঝুঁকি ধূমপায়ীর তুলনায় অর্ধেক হয়ে যায়।',
  milestone5yearsDesc: 'স্ট্রোকের ঝুঁকি এখন অধূমপায়ীর মতো।',
  milestone10yearsDesc: 'ফুসফুস ক্যান্সারের ঝুঁকি এখন ধূমপায়ীর প্রায় অর্ধেক।',

  achievementsTitle: 'মাইলফলক',
  achievementEarned: 'অর্জিত',
  achievementUpcoming: 'এগিয়ে চলুন',
  achievementFirstDelay: 'প্রথম বিলম্ব',
  achievementFirstDelayDesc: 'প্রথম আকাঙ্ক্ষা বিলম্ব সেশন সম্পন্ন করেছেন।',
  achievement5Delays: 'বিলম্ব চ্যাম্পিয়ন',
  achievement5DelaysDesc: '৫টি আকাঙ্ক্ষা বিলম্ব সেশন সম্পন্ন করেছেন।',
  achievement7DayStreak: 'এক সপ্তাহ শক্তিশালী',
  achievement7DayStreakDesc: '৭ দিনের ধূমপানমুক্ত স্ট্রিক।',
  achievement30DayStreak: 'মাসিক মাইলফলক',
  achievement30DayStreakDesc: 'পুরো একটি মাস। অসাধারণ।',
  achievementFirstLog: 'সৎ ট্র্যাকার',
  achievementFirstLogDesc: 'প্রথম এন্ট্রি নথিভুক্ত করেছেন। সততাই পরিবর্তনের ভিত্তি।',
  achievement100Saved: '₹১০০ সঞ্চয়',
  achievement100SavedDesc: 'আপনি প্রথম ₹১০০ সঞ্চয় করেছেন। ছোট জয় যোগ হয়।',
  achievementOneWeekFree: 'এক সপ্তাহ মুক্ত',
  achievementOneWeekFreeDesc: 'সাত ধূমপানমুক্ত দিন। আপনার ফুসফুস ইতিমধ্যে পরিবর্তন লক্ষ্য করছে।',

  onboardingWelcomeTitle: 'SmokeLess AI-তে স্বাগতম',
  onboardingWelcomeSubtitle: 'ধূমপান কমানোর জন্য আপনার শান্ত, বিচারহীন কোচ — এক মুহূর্তে।',
  onboardingWelcomeBtn: 'শুরু করুন',
  onboardingGuestBtn: 'অ্যাকাউন্ট ছাড়া চেষ্টা করুন',
  onboardingLangTitle: 'আপনার ভাষা বেছে নিন',
  onboardingLangSubtitle: 'সমস্ত কোচিং, বিজ্ঞপ্তি ও প্রতিবেদন আপনার নির্বাচিত ভাষায় হবে।',
  onboardingBaselineTitle: 'আপনার শুরুর বিন্দু',
  onboardingBaselineSubtitle: 'এটি আপনার অগ্রগতি সঠিকভাবে ট্র্যাক করতে সাহায্য করে।',
  onboardingDailyCount: 'প্রতিদিন সিগারেট (মোটামুটি)',
  onboardingDailyCountPlaceholder: 'যেমন ১০',
  onboardingCostPerPack: 'প্রতি প্যাকের দাম',
  onboardingCostPlaceholder: 'যেমন ২৫০',
  onboardingCigsPerPack: 'প্যাকে সিগারেট',
  onboardingCurrency: 'মুদ্রা (₹, $, €...)',
  onboardingMotivationTitle: 'আপনাকে কী অনুপ্রাণিত করে?',
  onboardingMotivationSubtitle: 'যতটা সত্য মনে হয় বেছে নিন — কোনো ভুল উত্তর নেই।',
  onboardingMotivFamily: 'আমার পরিবার',
  onboardingMotivHealth: 'আমার স্বাস্থ্য',
  onboardingMotivMoney: 'অর্থ সাশ্রয়',
  onboardingMotivFeel: 'ভালো অনুভব করা',
  onboardingMotivOther: 'আমার নিজের কারণ',
  onboardingGoalTitle: 'আপনি কীভাবে এটি করতে চান?',
  onboardingGoalSubtitle: 'কোনো একটি সঠিক পথ নেই। যা সৎ মনে হয় তা বেছে নিন।',
  onboardingGoalQuit: 'সম্পূর্ণ ছেড়ে দিন',
  onboardingGoalQuitDesc: 'সম্পূর্ণ বন্ধের দিকে কাজ করা',
  onboardingGoalReduce: 'ধীরে ধীরে কমান',
  onboardingGoalReduceDesc: 'নিজের গতিতে কমানো',
  onboardingGoalTrack: 'এখন শুধু ট্র্যাক করুন',
  onboardingGoalTrackDesc: 'প্রথমে নিজের প্যাটার্ন বুঝুন',
  onboardingDone: 'চলুন শুরু করি',

  settingsTitle: 'সেটিংস',
  settingsLanguage: 'ভাষা',
  settingsTheme: 'চেহারা',
  settingsThemeDark: 'ডার্ক',
  settingsThemeLight: 'লাইট',
  settingsThemeSystem: 'সিস্টেম অনুযায়ী',
  settingsNotifications: 'বিজ্ঞপ্তি',
  settingsNotificationsOn: 'চালু',
  settingsNotificationsOff: 'বন্ধ',
  settingsAccount: 'অ্যাকাউন্ট ও নিরাপত্তা',
  settingsExport: 'আমার ডেটা রপ্তানি করুন',
  settingsDelete: 'অ্যাকাউন্ট মুছুন',
  settingsDeleteConfirm: 'আপনি কি নিশ্চিত? এটি আপনার সমস্ত ডেটা স্থায়ীভাবে মুছবে।',
  settingsDeleteWarning: 'এটি পূর্বাবস্থায় ফেরানো যাবে না।',
  settingsCrisis: 'সংকট সম্পদ',
  settingsAbout: 'SmokeLess AI সম্পর্কে',
  settingsVersion: 'সংস্করণ',

  authLoginTitle: 'সাইন ইন করুন',
  authEmail: 'ইমেল ঠিকানা',
  authPassword: 'পাসওয়ার্ড',
  authLogin: 'সাইন ইন',
  authSignup: 'অ্যাকাউন্ট তৈরি করুন',
  authGoogle: 'Google দিয়ে চালিয়ে যান',
  authMagicLink: 'ম্যাজিক লিংক পাঠান',
  authNoAccount: 'অ্যাকাউন্ট নেই?',
  authHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
  authForgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
  authGuestNote: 'গেস্ট ডেটা শুধুমাত্র এই ডিভাইসে। ব্যাকআপের জন্য অ্যাকাউন্ট তৈরি করুন।',
  authEmailSent: 'আপনার ইমেল দেখুন — আমরা সাইন-ইন লিংক পাঠিয়েছি।',

  errorGeneric: 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।',
  errorNetwork: 'কিছু সিঙ্ক হয়নি — আমরা স্বয়ংক্রিয়ভাবে পুনরায় চেষ্টা করব।',
  errorAuth: 'সাইন ইন ব্যর্থ। আপনার তথ্য পরীক্ষা করুন।',
  errorSync: 'এখন সংরক্ষণ করা যায়নি — পুনরায় চেষ্টার জন্য সারিতে আছে।',

  companionWord: 'সঙ্গী',
  personaMentor: 'জ্ঞানী পথপ্রদর্শক',
  personaMentorTagline: 'দৃঢ় ও অন্তর্দৃষ্টিসম্পন্ন — শান্ত প্রজ্ঞায় কথা বলে।',
  personaFriend: 'বন্ধু',
  personaFriendTagline: 'উষ্ণ ও সহজ — প্রতিটি জয় আপনার সাথে উদযাপন করে।',
  personaGuide: 'শান্ত গাইড',
  personaGuideTagline: 'কোমল ও উপস্থিত, ধীর স্থির শ্বাসের মতো।',
  onboardingPersonaTitle: 'আপনার সঙ্গী বেছে নিন',
  onboardingPersonaSubtitle: 'তারা এই যাত্রায় আপনার সাথে থাকবে। আপনি যেকোনো সময় বদলাতে পারেন।',
  settingsCompanion: 'আপনার সঙ্গী',

  homeStorySectionTitle: 'এ পর্যন্ত আপনার গল্প',
  homeCleanAirTitle: 'পরিষ্কার শ্বাস',
  homeCleanAirCaption: 'সহজ শ্বাসের ফিরে পাওয়া মিনিট',
  homeAvoidedTitle: 'ধরাননি',
  homeAvoidedCaption: 'যে সিগারেট আপনি জ্বালাননি',
  homeLifeTitle: 'ফিরে পাওয়া জীবন',
  homeLifeCaption: 'আপনাকে ফিরিয়ে দেওয়া আনুমানিক মিনিট',
  homeMoneyPrefix: 'এটি যথেষ্ট',
  moneyStoryStart: 'শীঘ্রই একটি ছোট আনন্দের জন্য',
  moneyStoryCoffee: 'একটি ভালো কফির জন্য',
  moneyStoryMeal: 'বাইরে একটি ভালো খাবারের জন্য',
  moneyStoryDinner: 'একটি উদযাপনের ডিনারের জন্য',
  moneyStoryTreat: 'প্রিয় কারও জন্য উপহারের জন্য',
  moneyStoryGetaway: 'একটি ছোট সাপ্তাহিক ভ্রমণের জন্য',
  unitMin: 'মিনিট',

  coachEmptyTitle: 'আমি আপনার সাথে আছি',
  coachEmptySubtitle: 'আমি আপনার অগ্রগতি, ট্রিগার ও জয় জানি। মনে যা আছে বলুন — কখনো বিচার নয়।',

  interveneTitle: 'ঢেউয়ের সাথে বয়ে যান',
  interveneSubtitle: 'আকাঙ্ক্ষা একটি ঢেউ — ওঠে, চূড়ায় পৌঁছায় এবং সবসময় নেমে যায়। এখন যা দরকার বেছে নিন।',
  interveneCalming: 'শ্বাস নিন',
  interveneCalmingDesc: 'শরীর শান্ত করার জন্য নির্দেশিত শ্বাস।',
  interveneCognitive: 'ভবিষ্যতের আমি',
  interveneCognitiveDesc: 'যে কারণে শুরু করেছিলেন তার সাথে পুনরায় যুক্ত হন।',
  interveneIncentive: 'আপনার জয় দেখুন',
  interveneIncentiveDesc: 'দেখুন আপনার অগ্রগতি কী ফিরিয়ে দিচ্ছে।',
  intervenePhysical: 'শরীর রিসেট করুন',
  intervenePhysicalDesc: 'ছোট শারীরিক কাজ যা আকাঙ্ক্ষা কমায়।',
  interveneDistraction: 'মনোযোগ সরান',
  interveneDistractionDesc: 'ঢেউটি কেটে যেতে দেওয়ার একটি ছোট চ্যালেঞ্জ।',
  interveneChooseAnother: 'অন্য কিছু বেছে নিন',
  interveneReflectDone: 'এখন আমি আরও স্থির বোধ করছি',
  cognitiveIntro: 'একটি ধীর শ্বাস নিন এবং এর একটিতে থামুন:',
  cognitivePrompt1: 'এক বছর পরের নিজেকে কল্পনা করুন, সকালের হাঁটায় সহজে শ্বাস নিচ্ছেন। সেই আপনি কেমন অনুভব করে?',
  cognitivePrompt2: 'মনে করুন কেন শুরু করেছিলেন। কার জন্য করছেন?',
  cognitivePrompt3: 'এই আকাঙ্ক্ষা কেটে যাবে আপনি ধূমপান করুন বা না করুন। আপনি যা হতে চান সে এখন কী বেছে নেবে?',
  physicalIntro: 'আকাঙ্ক্ষা শরীরে থাকে। এই তিনটি করুন:',
  physicalStep1: 'ধীরে ধীরে এক গ্লাস পানি পান করুন।',
  physicalStep2: 'দাঁড়িয়ে ২০ সেকেন্ড হাত মাথার উপরে প্রসারিত করুন।',
  physicalStep3: 'কাঁধ পাঁচবার পিছনে ঘোরান এবং চোয়াল শিথিল করুন।',
  distractionIntro: 'দুই মিনিটের জন্য মনকে একটি ছোট কাজ দিন:',
  distractionTask1: 'পাঁচটি জিনিস বলুন যা দেখতে পান, চারটি শুনতে পান, তিনটি ছুঁতে পারেন।',
  distractionTask2: '১০০ থেকে সাত করে উল্টো গুনুন: ১০০, ৯৩, ৮৬…',
  distractionTask3: 'প্রিয় কাউকে একটি সদয় বাক্য পাঠান।',
  incentiveIntro: 'প্রতিটি আকাঙ্ক্ষা যা আপনি সামলান তা ইতিমধ্যে ফল দিচ্ছে:',
};

export const translations: Record<Locale, TranslationKeys> = { en, hi, bn };

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  bn: 'বাংলা',
};
