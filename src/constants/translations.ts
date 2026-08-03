// src/constants/translations.ts
// Copy for Dhruv. Register: plain, adult, warm, unhurried. No exclamation
// marks except genuine celebration. Never "failed," never "streak," never a
// zeroing counter (master doc §3.4). hi/bn are best-effort spoken-register
// drafts — ship-blocking safety copy (crisis, alcohol gate) MUST be reviewed
// by a native speaker with lived-experience sensitivity before release
// (master doc §13.1); do not treat these strings as final for that reason.

export type Locale = 'en' | 'hi' | 'bn';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  bn: 'বাংলা',
};

export type TranslationKeys = {
  appName: string;
  next: string; back: string; skip: string; done: string; cancel: string;
  save: string; confirm: string; or: string; edit: string; remove: string;

  tabToday: string; tabCompanion: string; tabYou: string;

  // Onboarding
  onbWelcomeTitle: string; onbWelcomeSubtitle: string;
  onbFeatureRideWave: string; onbFeatureNeverReset: string; onbFeatureCompanion: string; onbFeatureLanguages: string;
  onbLangTitle: string; onbLangSubtitle: string;
  onbTracksTitle: string; onbTracksSubtitle: string;
  trackTobacco: string; trackAlcohol: string; trackPorn: string;
  onbBaselineTitle: string; onbBaselineSubtitle: string;
  baselineTobaccoForm: string; baselineTobaccoUnitsPerDay: string; baselineTobaccoUnitCost: string; baselineTobaccoUnitCostHint: string;
  formCigarette: string; formBidi: string; formGutkha: string; formPaanMasala: string; formKhaini: string; formVape: string;
  baselineAlcoholDaysPerWeek: string; baselineAlcoholSpend: string; baselineAlcoholDrinks: string;
  baselinePornSessionsPerWeek: string; baselinePornSessionLength: string; baselinePornMinimalMode: string; baselinePornMinimalModeDesc: string;
  onbQuitDateTitle: string; onbQuitDateSubtitle: string; onbQuitDateHaveNotYet: string; onbQuitDateSetDate: string;
  onbAlcoholGateTitle: string; onbAlcoholGateBody: string; onbAlcoholGateQ1: string; onbAlcoholGateQ2: string;
  onbAlcoholGateWarning: string; onbAlcoholGateAck: string;
  onbDone: string;

  // Today
  todayGreetingMorning: string; todayGreetingAfternoon: string; todayGreetingEvening: string; todayGreetingNight: string;
  todayUrgeButton: string; todayThreadEmpty: string; todayCheckinPrompt: string; todayNoUrgesToday: string;
  todayCoachTeaser: string; todayGetSupport: string;

  // Urge flow
  urgeNameIt: string; urgeWhichTrack: string;
  urgeRateIt: string; urgeIntensityLabel: string;
  urgeRideIt: string; urgeRideItSubtitle: string; urgeBreatheOffer: string; urgeBreatheIn: string; urgeBreatheOut: string;
  urgeElapsed: string; urgeAverageStat: string; urgeThisOneAt: string;
  urgeWatchItFall: string; urgeReRatePrompt: string;
  urgeCloseTitle: string; urgeCloseSurfed: string; urgeCloseAlternative: string; urgeCloseLapsed: string;
  urgeResolvedFactual: string;

  // Lapse protocol
  lapseAcknowledge: string; lapseCaptureQuestion: string; lapseCaptureSkip: string;
  lapseReframe: string; lapseFollowUp24h: string; lapseDone: string;

  // Trigger chips (shared keys, per-track subset selected by caller)
  triggerAfterMeal: string; triggerFirstOfDay: string; triggerToilet: string; triggerWithChaiCoffee: string; triggerWithAlcohol: string;
  triggerWorkBreak: string; triggerCommute: string; triggerStress: string; triggerBoredom: string; triggerOnPhone: string;
  triggerOffered: string; triggerAfterArgument: string; triggerBeforeBed: string; triggerAfterSex: string;
  triggerSocialPressure: string; triggerCelebration: string; triggerLoneliness: string; triggerWithFood: string;
  triggerHabitTime: string; triggerToSleep: string; triggerAnger: string; triggerWorkEvent: string; triggerOthersDrinking: string;
  triggerBedAtNight: string; triggerAloneAtHome: string; triggerPhoneScrolling: string; triggerCantSleep: string;
  triggerWokeEarly: string; triggerProcrastinating: string; triggerAfterDrinking: string;

  // Locations
  locToilet: string; locBed: string; locBalconyOutside: string; locHomeAlone: string; locWork: string; locCommute: string; locSocialSetting: string;

  // You screen
  youRecoveryCapital: string; youTotalDaysFree: string; youCurrent: string; youUrgesSurfed: string; youReturnsAfterLapse: string;
  youReclaimedTitle: string; youReclaimedMoney: string; youReclaimedHours: string; youReclaimedSleep: string;
  youTracksTitle: string; youAddTrack: string; youTriggersTitle: string; youMilestonesTitle: string; youSettingsTitle: string;
  youYearProjection: string;

  // Companion / Offline Coach
  companionTitle: string; companionOfflineNotice: string; companionChoosePath: string;
  companionUrgeHelp: string; companionHaltCheck: string; companionAfterLapse: string; companionDelayTechnique: string;

  // Crisis
  crisisTitle: string; crisisSubtitle: string; crisisCallNow: string; crisisFindHelpline: string;

  // Settings
  settingsLanguage: string; settingsTheme: string; settingsThemeDark: string; settingsThemeLight: string; settingsThemeOled: string; settingsThemeSystem: string;
  settingsHaptics: string; settingsHapticsFull: string; settingsHapticsEssential: string; settingsHapticsOff: string;
  settingsAppLock: string; settingsStealthMode: string; settingsNotifications: string;
  settingsData: string; settingsExport: string; settingsDeleteAll: string; settingsDeleteConfirm: string;
  settingsAbout: string; settingsCrisisResources: string; settingsCurrency: string;

  // Log (+1 quick add)
  logTitle: string; logQuantity: string; logWhatTriggered: string; logWhere: string; logSubmit: string; logUndo: string;

  // Check-in
  checkinTitle: string; checkinMood: string; checkinSleep: string; checkinHalt: string;
  moodGood: string; moodOkay: string; moodLow: string; moodRough: string;
  sleepGood: string; sleepOkay: string; sleepPoor: string;
  haltHungry: string; haltAngry: string; haltLonely: string; haltTired: string;
};

const en: TranslationKeys = {
  appName: 'Dhruv',
  next: 'Continue', back: 'Back', skip: 'Skip for now', done: 'Done', cancel: 'Cancel',
  save: 'Save', confirm: 'Confirm', or: 'or', edit: 'Edit', remove: 'Remove',

  tabToday: 'Today', tabCompanion: 'Companion', tabYou: 'You',

  onbWelcomeTitle: 'Dhruv',
  onbWelcomeSubtitle: 'A private companion for the next twenty minutes.',
  onbFeatureRideWave: 'Ride a craving with something real to hold onto',
  onbFeatureNeverReset: 'Nothing you’ve done here is ever taken away',
  onbFeatureCompanion: 'A companion who never keeps score against you',
  onbFeatureLanguages: 'English · हिंदी · বাংলা',
  onbLangTitle: 'Choose your language', onbLangSubtitle: 'You can change this any time in Settings.',
  onbTracksTitle: 'What are you working on?', onbTracksSubtitle: 'Choose everything that applies. You can change this any time.',
  trackTobacco: 'Tobacco', trackAlcohol: 'Alcohol', trackPorn: 'Porn',
  onbBaselineTitle: 'Your starting point', onbBaselineSubtitle: 'This is what makes every number honest later. You can edit it any time.',
  baselineTobaccoForm: 'What do you usually use?', baselineTobaccoUnitsPerDay: 'Units per day (roughly)',
  baselineTobaccoUnitCost: 'Cost per single unit', baselineTobaccoUnitCostHint: 'Loose pricing, not the pack price — we’ll divide down if you only know the pack price.',
  formCigarette: 'Cigarette', formBidi: 'Bidi', formGutkha: 'Gutkha', formPaanMasala: 'Paan masala', formKhaini: 'Khaini', formVape: 'Vape',
  baselineAlcoholDaysPerWeek: 'Drinking days per week', baselineAlcoholSpend: 'Typical spend per occasion', baselineAlcoholDrinks: 'Typical drinks per occasion',
  baselinePornSessionsPerWeek: 'Sessions per week (roughly)', baselinePornSessionLength: 'Typical session length',
  baselinePornMinimalMode: 'Log minimally', baselinePornMinimalModeDesc: 'Some people find detailed tracking helpful. Others find it makes things worse. With this on, we’ll just log that it happened — nothing else.',
  onbQuitDateTitle: 'Quit date', onbQuitDateSubtitle: 'Optional. “I haven’t stopped yet” is a completely valid place to start.',
  onbQuitDateHaveNotYet: 'I haven’t stopped yet', onbQuitDateSetDate: 'Set a date',
  onbAlcoholGateTitle: 'Before you start — a safety check',
  onbAlcoholGateBody: 'Stopping alcohol suddenly after heavy daily drinking can be medically dangerous, including seizures. This is not something to manage alone.',
  onbAlcoholGateQ1: 'Do you drink heavily every day?', onbAlcoholGateQ2: 'Have you ever had tremor, sweating, nausea on waking, or a seizure when you tried to stop?',
  onbAlcoholGateWarning: 'Please speak to a doctor before you stop drinking. Dhruv can support you, but it cannot safely guide you through withdrawal on its own.',
  onbAlcoholGateAck: 'I understand, and I’ll speak to a doctor before stopping',
  onbDone: 'Let’s begin',

  todayGreetingMorning: 'Good morning', todayGreetingAfternoon: 'Good afternoon', todayGreetingEvening: 'Good evening', todayGreetingNight: 'Still up?',
  todayUrgeButton: 'I’m having an urge', todayThreadEmpty: 'This is where it starts.',
  todayCheckinPrompt: 'How are things today?', todayNoUrgesToday: 'Nothing today. That counts.',
  todayCoachTeaser: 'Talk to your companion', todayGetSupport: 'Get support now',

  urgeNameIt: 'What is it?', urgeWhichTrack: 'Which one is this?',
  urgeRateIt: 'How strong is it right now?', urgeIntensityLabel: 'Intensity',
  urgeRideIt: 'I’m here. You don’t have to do anything but wait.',
  urgeRideItSubtitle: 'Stay with it. It will move.',
  urgeBreatheOffer: 'Want to breathe with me?', urgeBreatheIn: 'In', urgeBreatheOut: 'Out',
  urgeElapsed: 'elapsed', urgeAverageStat: 'Your urges have averaged {avg}.', urgeThisOneAt: 'This one is at {current}.',
  urgeWatchItFall: 'Watch it fall', urgeReRatePrompt: 'Where is it now?',
  urgeCloseTitle: 'How did it go?', urgeCloseSurfed: 'I rode it out', urgeCloseAlternative: 'I did something else instead', urgeCloseLapsed: 'I didn’t ride it out',
  urgeResolvedFactual: 'It passed.',

  lapseAcknowledge: 'Okay. That happened.', lapseCaptureQuestion: 'What was going on? (optional)', lapseCaptureSkip: 'Skip this',
  lapseReframe: 'This is data, not a verdict. Nothing you’ve built disappears because of tonight.',
  lapseFollowUp24h: 'Checking in — no questions, just glad you’re here.', lapseDone: 'Back to Today',

  triggerAfterMeal: 'After a meal', triggerFirstOfDay: 'First of the day', triggerToilet: 'Toilet', triggerWithChaiCoffee: 'With chai/coffee', triggerWithAlcohol: 'With alcohol',
  triggerWorkBreak: 'Work break', triggerCommute: 'Commute', triggerStress: 'Stress', triggerBoredom: 'Boredom', triggerOnPhone: 'On my phone',
  triggerOffered: 'Someone offered', triggerAfterArgument: 'After an argument', triggerBeforeBed: 'Before bed', triggerAfterSex: 'After sex',
  triggerSocialPressure: 'Social pressure', triggerCelebration: 'Celebration', triggerLoneliness: 'Loneliness', triggerWithFood: 'With food',
  triggerHabitTime: 'Just that time', triggerToSleep: 'To sleep', triggerAnger: 'Anger', triggerWorkEvent: 'Work event', triggerOthersDrinking: 'Someone else was drinking',
  triggerBedAtNight: 'In bed at night', triggerAloneAtHome: 'Alone at home', triggerPhoneScrolling: 'Scrolling my phone', triggerCantSleep: 'Can’t sleep',
  triggerWokeEarly: 'Woke early', triggerProcrastinating: 'Procrastinating', triggerAfterDrinking: 'After drinking',

  locToilet: 'Toilet / bathroom', locBed: 'Bed', locBalconyOutside: 'Balcony / outside', locHomeAlone: 'Home alone', locWork: 'Work', locCommute: 'Commute', locSocialSetting: 'Social setting',

  youRecoveryCapital: 'Recovery capital', youTotalDaysFree: 'total days free', youCurrent: 'current', youUrgesSurfed: 'urges surfed', youReturnsAfterLapse: 'returns after a lapse',
  youReclaimedTitle: 'Reclaimed', youReclaimedMoney: 'Money', youReclaimedHours: 'Hours', youReclaimedSleep: 'Sleep',
  youTracksTitle: 'Tracks', youAddTrack: 'Add a track', youTriggersTitle: 'Triggers', youMilestonesTitle: 'Milestones', youSettingsTitle: 'Settings',
  youYearProjection: 'At this rate, over a year',

  companionTitle: 'Companion', companionOfflineNotice: 'This is a scripted coach — no network needed, no AI yet. A learning companion is planned for later.',
  companionChoosePath: 'What would help right now?', companionUrgeHelp: 'Help with an urge', companionHaltCheck: 'Check in with myself', companionAfterLapse: 'After a lapse', companionDelayTechnique: 'A delay technique',

  crisisTitle: 'Get support now', crisisSubtitle: 'You don’t have to explain anything to call.', crisisCallNow: 'Call now', crisisFindHelpline: 'Find a helpline near you',

  settingsLanguage: 'Language', settingsTheme: 'Appearance', settingsThemeDark: 'Dark', settingsThemeLight: 'Light', settingsThemeOled: 'True black (OLED)', settingsThemeSystem: 'Follow system',
  settingsHaptics: 'Haptics', settingsHapticsFull: 'Full', settingsHapticsEssential: 'Essential only', settingsHapticsOff: 'Off',
  settingsAppLock: 'App lock', settingsStealthMode: 'Stealth mode', settingsNotifications: 'Notifications',
  settingsData: 'Your data', settingsExport: 'Export my data', settingsDeleteAll: 'Delete everything', settingsDeleteConfirm: 'This permanently deletes all your data from this device. It cannot be undone.',
  settingsAbout: 'About Dhruv', settingsCrisisResources: 'Crisis resources', settingsCurrency: 'Currency',

  logTitle: 'Log', logQuantity: 'How many?', logWhatTriggered: 'What brought it on?', logWhere: 'Where were you?', logSubmit: 'Log it', logUndo: 'Undo',

  checkinTitle: 'Today', checkinMood: 'Mood', checkinSleep: 'Sleep last night', checkinHalt: 'Any of these right now?',
  moodGood: 'Good', moodOkay: 'Okay', moodLow: 'Low', moodRough: 'Rough',
  sleepGood: 'Good', sleepOkay: 'Okay', sleepPoor: 'Poor',
  haltHungry: 'Hungry', haltAngry: 'Angry', haltLonely: 'Lonely', haltTired: 'Tired',
};

const hi: TranslationKeys = {
  ...en,
  appName: 'ध्रुव',
  next: 'जारी रखें', back: 'वापस', skip: 'अभी छोड़ें', done: 'हो गया', cancel: 'रद्द करें',
  save: 'सहेजें', confirm: 'पुष्टि करें', or: 'या', edit: 'बदलें', remove: 'हटाएं',
  tabToday: 'आज', tabCompanion: 'साथी', tabYou: 'आप',
  onbWelcomeTitle: 'ध्रुव',
  onbWelcomeSubtitle: 'अगले बीस मिनट के लिए एक निजी साथी।',
  onbFeatureRideWave: 'तलब को कुछ असली सहारे के साथ पार करें',
  onbFeatureNeverReset: 'यहां जो भी किया है वो कभी छिनता नहीं',
  onbFeatureCompanion: 'एक साथी जो आपके खिलाफ हिसाब नहीं रखता',
  onbFeatureLanguages: 'English · हिंदी · বাংলা',
  onbLangTitle: 'अपनी भाषा चुनें', onbLangSubtitle: 'आप इसे सेटिंग्स में कभी भी बदल सकते हैं।',
  onbTracksTitle: 'आप किस पर काम कर रहे हैं?', onbTracksSubtitle: 'जो भी लागू हो, चुनें। आप इसे कभी भी बदल सकते हैं।',
  trackTobacco: 'तंबाकू', trackAlcohol: 'शराब', trackPorn: 'पॉर्न',
  onbBaselineTitle: 'आपकी शुरुआत', onbBaselineSubtitle: 'यही वजह है कि आगे हर आंकड़ा सही निकलेगा। आप इसे कभी भी बदल सकते हैं।',
  baselineTobaccoForm: 'आप आमतौर पर क्या लेते हैं?', baselineTobaccoUnitsPerDay: 'प्रति दिन (लगभग)',
  baselineTobaccoUnitCost: 'एक नग की कीमत', baselineTobaccoUnitCostHint: 'खुली कीमत, पैकेट की नहीं — अगर सिर्फ पैकेट की कीमत पता है तो हम बांट लेंगे।',
  formCigarette: 'सिगरेट', formBidi: 'बीड़ी', formGutkha: 'गुटखा', formPaanMasala: 'पान मसाला', formKhaini: 'खैनी', formVape: 'वेप',
  baselineAlcoholDaysPerWeek: 'हफ्ते में कितने दिन पीते हैं', baselineAlcoholSpend: 'एक बार में सामान्य खर्च', baselineAlcoholDrinks: 'एक बार में सामान्य मात्रा',
  baselinePornSessionsPerWeek: 'हफ्ते में कितनी बार (लगभग)', baselinePornSessionLength: 'सामान्य समय',
  baselinePornMinimalMode: 'सिर्फ न्यूनतम नोट करें', baselinePornMinimalModeDesc: 'कुछ लोगों के लिए विस्तृत ट्रैकिंग मददगार होती है, कुछ के लिए यह और मुश्किल कर देती है। यह चालू करने पर हम बस इतना नोट करेंगे कि हुआ — बाकी कुछ नहीं।',
  onbQuitDateTitle: 'छोड़ने की तारीख', onbQuitDateSubtitle: 'वैकल्पिक। "मैंने अभी शुरुआत नहीं की" भी बिल्कुल सही जगह है।',
  onbQuitDateHaveNotYet: 'मैंने अभी शुरुआत नहीं की', onbQuitDateSetDate: 'तारीख तय करें',
  onbAlcoholGateTitle: 'शुरू करने से पहले — एक सुरक्षा जांच',
  onbAlcoholGateBody: 'रोज़ भारी मात्रा में पीने के बाद अचानक शराब छोड़ना चिकित्सकीय रूप से खतरनाक हो सकता है, यहां तक कि दौरे भी आ सकते हैं। यह अकेले संभालने वाली बात नहीं है।',
  onbAlcoholGateQ1: 'क्या आप रोज़ भारी मात्रा में पीते हैं?', onbAlcoholGateQ2: 'क्या छोड़ने की कोशिश में कभी कंपकंपी, पसीना, सुबह जी मिचलाना, या दौरा हुआ है?',
  onbAlcoholGateWarning: 'कृपया पीना बंद करने से पहले डॉक्टर से बात करें। ध्रुव आपका साथ दे सकता है, लेकिन यह अकेले आपको वापसी की प्रक्रिया से सुरक्षित रूप से नहीं निकाल सकता।',
  onbAlcoholGateAck: 'मैं समझता/समझती हूं, और बंद करने से पहले डॉक्टर से बात करूंगा/करूंगी',
  onbDone: 'चलिए शुरू करें',
  todayGreetingMorning: 'सुप्रभात', todayGreetingAfternoon: 'नमस्कार', todayGreetingEvening: 'शुभ संध्या', todayGreetingNight: 'अभी भी जाग रहे हैं?',
  todayUrgeButton: 'मुझे तलब लग रही है', todayThreadEmpty: 'यहीं से शुरुआत होती है।',
  todayCheckinPrompt: 'आज कैसा चल रहा है?', todayNoUrgesToday: 'आज कुछ नहीं। यह भी मायने रखता है।',
  todayCoachTeaser: 'अपने साथी से बात करें', todayGetSupport: 'अभी मदद लें',
  urgeNameIt: 'यह क्या है?', urgeWhichTrack: 'यह किसके बारे में है?',
  urgeRateIt: 'अभी यह कितनी तेज़ है?', urgeIntensityLabel: 'तीव्रता',
  urgeRideIt: 'मैं यहां हूं। आपको बस रुकना है, और कुछ नहीं करना।',
  urgeRideItSubtitle: 'इसके साथ रहें। यह बदलेगी।',
  urgeBreatheOffer: 'मेरे साथ सांस लेना चाहेंगे?', urgeBreatheIn: 'अंदर', urgeBreatheOut: 'बाहर',
  urgeElapsed: 'बीत चुका', urgeAverageStat: 'आपकी तलब का औसत {avg} रहा है।', urgeThisOneAt: 'यह अभी {current} पर है।',
  urgeWatchItFall: 'इसे गिरते देखें', urgeReRatePrompt: 'अभी यह कहां है?',
  urgeCloseTitle: 'कैसा रहा?', urgeCloseSurfed: 'मैंने इसे पार कर लिया', urgeCloseAlternative: 'मैंने इसकी जगह कुछ और किया', urgeCloseLapsed: 'मैं इसे पार नहीं कर पाया/पाई',
  urgeResolvedFactual: 'यह गुज़र गई।',
  lapseAcknowledge: 'ठीक है। यह हो गया।', lapseCaptureQuestion: 'क्या हो रहा था? (वैकल्पिक)', lapseCaptureSkip: 'यह छोड़ें',
  lapseReframe: 'यह एक जानकारी है, फैसला नहीं। आज रात की वजह से आपने जो भी बनाया है, वो कहीं नहीं जाता।',
  lapseFollowUp24h: 'बस देख रहे हैं — कोई सवाल नहीं, बस खुशी है कि आप यहां हैं।', lapseDone: 'आज पर वापस',
  triggerAfterMeal: 'खाने के बाद', triggerFirstOfDay: 'दिन की पहली बार', triggerToilet: 'टॉयलेट', triggerWithChaiCoffee: 'चाय/कॉफी के साथ', triggerWithAlcohol: 'शराब के साथ',
  triggerWorkBreak: 'काम का ब्रेक', triggerCommute: 'आना-जाना', triggerStress: 'तनाव', triggerBoredom: 'बोरियत', triggerOnPhone: 'फोन पर',
  triggerOffered: 'किसी ने ऑफर किया', triggerAfterArgument: 'बहस के बाद', triggerBeforeBed: 'सोने से पहले', triggerAfterSex: 'संबंध बनाने के बाद',
  triggerSocialPressure: 'सामाजिक दबाव', triggerCelebration: 'जश्न', triggerLoneliness: 'अकेलापन', triggerWithFood: 'खाने के साथ',
  triggerHabitTime: 'बस वही समय', triggerToSleep: 'सोने के लिए', triggerAnger: 'गुस्सा', triggerWorkEvent: 'ऑफिस का इवेंट', triggerOthersDrinking: 'कोई और पी रहा था',
  triggerBedAtNight: 'रात को बिस्तर पर', triggerAloneAtHome: 'घर पर अकेले', triggerPhoneScrolling: 'फोन चलाते हुए', triggerCantSleep: 'नींद नहीं आ रही',
  triggerWokeEarly: 'जल्दी नींद खुल गई', triggerProcrastinating: 'टालमटोल कर रहा/रही हूं', triggerAfterDrinking: 'पीने के बाद',
  locToilet: 'टॉयलेट / बाथरूम', locBed: 'बिस्तर', locBalconyOutside: 'बालकनी / बाहर', locHomeAlone: 'घर पर अकेले', locWork: 'काम पर', locCommute: 'आना-जाना', locSocialSetting: 'सामाजिक माहौल',
  youRecoveryCapital: 'रिकवरी कैपिटल', youTotalDaysFree: 'कुल आज़ाद दिन', youCurrent: 'अभी', youUrgesSurfed: 'पार की गई तलब', youReturnsAfterLapse: 'फिसलने के बाद वापसी',
  youReclaimedTitle: 'वापस पाया', youReclaimedMoney: 'पैसा', youReclaimedHours: 'घंटे', youReclaimedSleep: 'नींद',
  youTracksTitle: 'ट्रैक', youAddTrack: 'ट्रैक जोड़ें', youTriggersTitle: 'ट्रिगर', youMilestonesTitle: 'मील के पत्थर', youSettingsTitle: 'सेटिंग्स',
  youYearProjection: 'इस दर पर, एक साल में',
  companionTitle: 'साथी', companionOfflineNotice: 'यह एक स्क्रिप्टेड कोच है — नेटवर्क की ज़रूरत नहीं, अभी कोई AI नहीं। सीखने वाला साथी आगे आएगा।',
  companionChoosePath: 'अभी क्या मदद करेगा?', companionUrgeHelp: 'तलब में मदद', companionHaltCheck: 'खुद को जांचें', companionAfterLapse: 'फिसलने के बाद', companionDelayTechnique: 'देरी की तकनीक',
  crisisTitle: 'अभी मदद लें', crisisSubtitle: 'कॉल करने के लिए कुछ समझाना ज़रूरी नहीं।', crisisCallNow: 'अभी कॉल करें', crisisFindHelpline: 'अपने पास की हेल्पलाइन खोजें',
  settingsLanguage: 'भाषा', settingsTheme: 'रूप', settingsThemeDark: 'डार्क', settingsThemeLight: 'लाइट', settingsThemeOled: 'ट्रू ब्लैक (OLED)', settingsThemeSystem: 'सिस्टम अनुसार',
  settingsHaptics: 'हैप्टिक्स', settingsHapticsFull: 'पूरा', settingsHapticsEssential: 'ज़रूरी ही', settingsHapticsOff: 'बंद',
  settingsAppLock: 'ऐप लॉक', settingsStealthMode: 'स्टील्थ मोड', settingsNotifications: 'सूचनाएं',
  settingsData: 'आपका डेटा', settingsExport: 'मेरा डेटा निर्यात करें', settingsDeleteAll: 'सब कुछ हटाएं', settingsDeleteConfirm: 'यह इस डिवाइस से आपका सारा डेटा हमेशा के लिए हटा देगा। इसे वापस नहीं लिया जा सकता।',
  settingsAbout: 'ध्रुव के बारे में', settingsCrisisResources: 'संकट संसाधन', settingsCurrency: 'मुद्रा',
  logTitle: 'नोट करें', logQuantity: 'कितने?', logWhatTriggered: 'वजह क्या रही?', logWhere: 'कहां थे?', logSubmit: 'नोट करें', logUndo: 'वापस लें',
  checkinTitle: 'आज', checkinMood: 'मनोदशा', checkinSleep: 'कल रात की नींद', checkinHalt: 'अभी इनमें से कुछ?',
  moodGood: 'अच्छा', moodOkay: 'ठीक-ठाक', moodLow: 'कम', moodRough: 'मुश्किल',
  sleepGood: 'अच्छी', sleepOkay: 'ठीक-ठाक', sleepPoor: 'खराब',
  haltHungry: 'भूख', haltAngry: 'गुस्सा', haltLonely: 'अकेलापन', haltTired: 'थकान',
};

const bn: TranslationKeys = {
  ...en,
  appName: 'ধ্রুব',
  next: 'চালিয়ে যান', back: 'পিছনে', skip: 'এখন এড়িয়ে যান', done: 'সম্পন্ন', cancel: 'বাতিল',
  save: 'সংরক্ষণ', confirm: 'নিশ্চিত করুন', or: 'বা', edit: 'পরিবর্তন', remove: 'সরান',
  tabToday: 'আজ', tabCompanion: 'সঙ্গী', tabYou: 'আপনি',
  onbWelcomeTitle: 'ধ্রুব',
  onbWelcomeSubtitle: 'পরের বিশ মিনিটের জন্য একটি ব্যক্তিগত সঙ্গী।',
  onbFeatureRideWave: 'আকাঙ্ক্ষাকে সত্যিকারের কিছু ধরে পার হন',
  onbFeatureNeverReset: 'এখানে যা করেছেন তা কখনো কেড়ে নেওয়া হয় না',
  onbFeatureCompanion: 'এমন একজন সঙ্গী যে আপনার বিরুদ্ধে হিসাব রাখে না',
  onbFeatureLanguages: 'English · হিন্দি · বাংলা',
  onbLangTitle: 'আপনার ভাষা বেছে নিন', onbLangSubtitle: 'সেটিংসে গিয়ে যেকোনো সময় এটি পরিবর্তন করতে পারবেন।',
  onbTracksTitle: 'আপনি কী নিয়ে কাজ করছেন?', onbTracksSubtitle: 'যা প্রযোজ্য সব বেছে নিন। যেকোনো সময় পরিবর্তন করা যাবে।',
  trackTobacco: 'তামাক', trackAlcohol: 'মদ্যপান', trackPorn: 'পর্ন',
  onbBaselineTitle: 'আপনার শুরুর বিন্দু', onbBaselineSubtitle: 'এটাই পরে প্রতিটি সংখ্যাকে সঠিক করে তোলে। যেকোনো সময় পরিবর্তন করতে পারবেন।',
  baselineTobaccoForm: 'সাধারণত কী ব্যবহার করেন?', baselineTobaccoUnitsPerDay: 'দৈনিক (আনুমানিক)',
  baselineTobaccoUnitCost: 'একটির দাম', baselineTobaccoUnitCostHint: 'খুচরা দাম, প্যাকেটের দাম নয় — শুধু প্যাকেটের দাম জানা থাকলে আমরা ভাগ করে নেব।',
  formCigarette: 'সিগারেট', formBidi: 'বিড়ি', formGutkha: 'গুটখা', formPaanMasala: 'পান মশলা', formKhaini: 'খৈনি', formVape: 'ভেপ',
  baselineAlcoholDaysPerWeek: 'সপ্তাহে কত দিন পান করেন', baselineAlcoholSpend: 'একবারে সাধারণ খরচ', baselineAlcoholDrinks: 'একবারে সাধারণ পরিমাণ',
  baselinePornSessionsPerWeek: 'সপ্তাহে কতবার (আনুমানিক)', baselinePornSessionLength: 'সাধারণ সময়কাল',
  baselinePornMinimalMode: 'শুধু ন্যূনতম নথিভুক্ত করুন', baselinePornMinimalModeDesc: 'কারও কারও কাছে বিস্তারিত ট্র্যাকিং সহায়ক, কারও কারও কাছে তা আরও কঠিন করে তোলে। এটি চালু থাকলে আমরা শুধু এটুকু নথিভুক্ত করব যে এটি ঘটেছে — আর কিছু নয়।',
  onbQuitDateTitle: 'ছাড়ার তারিখ', onbQuitDateSubtitle: 'ঐচ্ছিক। "আমি এখনও শুরু করিনি" এটাও পুরোপুরি বৈধ একটি শুরু।',
  onbQuitDateHaveNotYet: 'আমি এখনও শুরু করিনি', onbQuitDateSetDate: 'একটি তারিখ ঠিক করুন',
  onbAlcoholGateTitle: 'শুরুর আগে — একটি নিরাপত্তা পরীক্ষা',
  onbAlcoholGateBody: 'প্রতিদিন প্রচুর মদ্যপানের পর হঠাৎ বন্ধ করা চিকিৎসাগতভাবে বিপজ্জনক হতে পারে, এমনকি খিঁচুনিও হতে পারে। এটি একা সামলানোর বিষয় নয়।',
  onbAlcoholGateQ1: 'আপনি কি প্রতিদিন প্রচুর পরিমাণে পান করেন?', onbAlcoholGateQ2: 'বন্ধ করার চেষ্টা করার সময় কখনো কাঁপুনি, ঘাম, সকালে বমি বমি ভাব বা খিঁচুনি হয়েছে?',
  onbAlcoholGateWarning: 'পান করা বন্ধ করার আগে অনুগ্রহ করে একজন ডাক্তারের সাথে কথা বলুন। ধ্রুব আপনার পাশে থাকতে পারে, কিন্তু এটি একা আপনাকে নিরাপদে প্রত্যাহারের মধ্য দিয়ে নিয়ে যেতে পারে না।',
  onbAlcoholGateAck: 'আমি বুঝেছি, এবং বন্ধ করার আগে ডাক্তারের সাথে কথা বলব',
  onbDone: 'চলুন শুরু করি',
  todayGreetingMorning: 'শুভ সকাল', todayGreetingAfternoon: 'শুভ অপরাহ্ন', todayGreetingEvening: 'শুভ সন্ধ্যা', todayGreetingNight: 'এখনও জেগে আছেন?',
  todayUrgeButton: 'আমার আকাঙ্ক্ষা হচ্ছে', todayThreadEmpty: 'এখান থেকেই শুরু।',
  todayCheckinPrompt: 'আজ কেমন যাচ্ছে?', todayNoUrgesToday: 'আজ কিছু হয়নি। এটাও গণনায় আসে।',
  todayCoachTeaser: 'আপনার সঙ্গীর সাথে কথা বলুন', todayGetSupport: 'এখনই সাহায্য নিন',
  urgeNameIt: 'এটা কী?', urgeWhichTrack: 'এটা কীসের ব্যাপারে?',
  urgeRateIt: 'এখন এটা কতটা তীব্র?', urgeIntensityLabel: 'তীব্রতা',
  urgeRideIt: 'আমি এখানে আছি। আপনাকে শুধু অপেক্ষা করতে হবে, আর কিছু না।',
  urgeRideItSubtitle: 'এর সাথে থাকুন। এটা বদলাবে।',
  urgeBreatheOffer: 'আমার সাথে শ্বাস নিতে চান?', urgeBreatheIn: 'ভেতরে', urgeBreatheOut: 'বাইরে',
  urgeElapsed: 'পার হয়েছে', urgeAverageStat: 'আপনার আকাঙ্ক্ষার গড় {avg}।', urgeThisOneAt: 'এটা এখন {current} এ আছে।',
  urgeWatchItFall: 'এটা কমতে দেখুন', urgeReRatePrompt: 'এখন এটা কোথায়?',
  urgeCloseTitle: 'কেমন গেল?', urgeCloseSurfed: 'আমি এটা পার করেছি', urgeCloseAlternative: 'আমি এর বদলে অন্য কিছু করেছি', urgeCloseLapsed: 'আমি এটা পার করতে পারিনি',
  urgeResolvedFactual: 'এটা কেটে গেছে।',
  lapseAcknowledge: 'ঠিক আছে। এটা হয়েছে।', lapseCaptureQuestion: 'কী ঘটছিল? (ঐচ্ছিক)', lapseCaptureSkip: 'এটি এড়িয়ে যান',
  lapseReframe: 'এটা তথ্য, রায় নয়। আজ রাতের কারণে আপনি যা গড়েছেন তার কিছুই হারায় না।',
  lapseFollowUp24h: 'শুধু খোঁজ নিচ্ছি — কোনো প্রশ্ন নেই, শুধু ভালো লাগছে আপনি এখানে আছেন।', lapseDone: 'আজ-এ ফিরে যান',
  triggerAfterMeal: 'খাবারের পর', triggerFirstOfDay: 'দিনের প্রথমটি', triggerToilet: 'টয়লেট', triggerWithChaiCoffee: 'চা/কফির সাথে', triggerWithAlcohol: 'মদের সাথে',
  triggerWorkBreak: 'কাজের বিরতি', triggerCommute: 'যাতায়াত', triggerStress: 'চাপ', triggerBoredom: 'একঘেয়েমি', triggerOnPhone: 'ফোনে',
  triggerOffered: 'কেউ দিয়েছিল', triggerAfterArgument: 'ঝগড়ার পর', triggerBeforeBed: 'ঘুমানোর আগে', triggerAfterSex: 'সহবাসের পর',
  triggerSocialPressure: 'সামাজিক চাপ', triggerCelebration: 'উদযাপন', triggerLoneliness: 'একাকীত্ব', triggerWithFood: 'খাবারের সাথে',
  triggerHabitTime: 'ঠিক সেই সময়', triggerToSleep: 'ঘুমানোর জন্য', triggerAnger: 'রাগ', triggerWorkEvent: 'কাজের অনুষ্ঠান', triggerOthersDrinking: 'অন্য কেউ পান করছিল',
  triggerBedAtNight: 'রাতে বিছানায়', triggerAloneAtHome: 'বাড়িতে একা', triggerPhoneScrolling: 'ফোন স্ক্রল করছি', triggerCantSleep: 'ঘুম আসছে না',
  triggerWokeEarly: 'তাড়াতাড়ি ঘুম ভেঙেছে', triggerProcrastinating: 'কালক্ষেপণ করছি', triggerAfterDrinking: 'পান করার পর',
  locToilet: 'টয়লেট / বাথরুম', locBed: 'বিছানা', locBalconyOutside: 'বারান্দা / বাইরে', locHomeAlone: 'বাড়িতে একা', locWork: 'কাজে', locCommute: 'যাতায়াত', locSocialSetting: 'সামাজিক পরিবেশ',
  youRecoveryCapital: 'রিকভারি ক্যাপিটাল', youTotalDaysFree: 'মোট মুক্ত দিন', youCurrent: 'বর্তমান', youUrgesSurfed: 'পার করা আকাঙ্ক্ষা', youReturnsAfterLapse: 'হোঁচটের পর ফেরা',
  youReclaimedTitle: 'ফিরে পাওয়া', youReclaimedMoney: 'অর্থ', youReclaimedHours: 'ঘণ্টা', youReclaimedSleep: 'ঘুম',
  youTracksTitle: 'ট্র্যাক', youAddTrack: 'ট্র্যাক যোগ করুন', youTriggersTitle: 'ট্রিগার', youMilestonesTitle: 'মাইলফলক', youSettingsTitle: 'সেটিংস',
  youYearProjection: 'এই হারে, এক বছরে',
  companionTitle: 'সঙ্গী', companionOfflineNotice: 'এটি একটি স্ক্রিপ্টেড কোচ — নেটওয়ার্কের দরকার নেই, এখনও কোনো AI নেই। শেখার সঙ্গী পরে আসছে।',
  companionChoosePath: 'এখন কী সাহায্য করবে?', companionUrgeHelp: 'আকাঙ্ক্ষায় সাহায্য', companionHaltCheck: 'নিজেকে যাচাই করুন', companionAfterLapse: 'হোঁচটের পর', companionDelayTechnique: 'বিলম্ব কৌশল',
  crisisTitle: 'এখনই সাহায্য নিন', crisisSubtitle: 'কল করতে কিছু ব্যাখ্যা করার দরকার নেই।', crisisCallNow: 'এখনই কল করুন', crisisFindHelpline: 'আপনার কাছের হেল্পলাইন খুঁজুন',
  settingsLanguage: 'ভাষা', settingsTheme: 'রূপ', settingsThemeDark: 'ডার্ক', settingsThemeLight: 'লাইট', settingsThemeOled: 'ট্রু ব্ল্যাক (OLED)', settingsThemeSystem: 'সিস্টেম অনুযায়ী',
  settingsHaptics: 'হ্যাপটিক্স', settingsHapticsFull: 'সম্পূর্ণ', settingsHapticsEssential: 'শুধু প্রয়োজনীয়', settingsHapticsOff: 'বন্ধ',
  settingsAppLock: 'অ্যাপ লক', settingsStealthMode: 'স্টিলথ মোড', settingsNotifications: 'বিজ্ঞপ্তি',
  settingsData: 'আপনার ডেটা', settingsExport: 'আমার ডেটা এক্সপোর্ট করুন', settingsDeleteAll: 'সব মুছে ফেলুন', settingsDeleteConfirm: 'এটি এই ডিভাইস থেকে আপনার সমস্ত ডেটা স্থায়ীভাবে মুছে ফেলবে। এটি ফিরিয়ে আনা যাবে না।',
  settingsAbout: 'ধ্রুব সম্পর্কে', settingsCrisisResources: 'সংকট সহায়তা', settingsCurrency: 'মুদ্রা',
  logTitle: 'নথিভুক্ত করুন', logQuantity: 'কতগুলো?', logWhatTriggered: 'কারণ কী ছিল?', logWhere: 'কোথায় ছিলেন?', logSubmit: 'নথিভুক্ত করুন', logUndo: 'ফিরিয়ে নিন',
  checkinTitle: 'আজ', checkinMood: 'মেজাজ', checkinSleep: 'গতকাল রাতের ঘুম', checkinHalt: 'এখন এর মধ্যে কিছু?',
  moodGood: 'ভালো', moodOkay: 'মোটামুটি', moodLow: 'কম', moodRough: 'কঠিন',
  sleepGood: 'ভালো', sleepOkay: 'মোটামুটি', sleepPoor: 'খারাপ',
  haltHungry: 'ক্ষুধার্ত', haltAngry: 'রাগান্বিত', haltLonely: 'একা', haltTired: 'ক্লান্ত',
};

export const translations: Record<Locale, TranslationKeys> = { en, hi, bn };

export function tf(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
