// src/i18n/en.ts
// English is the source of truth: `Dictionary` is inferred from this object,
// so hi.ts and bn.ts cannot drift or silently miss a key.
//
// Register: adult, plain, unhurried. Never "failed", never "relapse", never a
// counter that visibly resets. A logged cigarette is a data point (§1).

const en = {
  // ── Common ────────────────────────────────────────────────────────────────
  appName: 'SmokeLess AI',
  tagline: 'Fewer, slower, on your terms.',
  continue: 'Continue',
  back: 'Back',
  skip: 'Skip',
  done: 'Done',
  cancel: 'Cancel',
  save: 'Save',
  close: 'Close',
  delete: 'Delete',
  confirm: 'Confirm',
  notNow: 'Not now',
  loading: 'Loading',
  offline: 'Offline',
  beta: 'Beta',
  minutes: 'minutes',
  perDay: 'per day',

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabHome: 'Home',
  tabAnalytics: 'Insights',
  tabCoach: 'Coach',
  tabProfile: 'You',

  // ── Welcome ───────────────────────────────────────────────────────────────
  welcomeTitle: 'The clearing',
  welcomeBody:
    'Track what you smoke, understand why, and let a craving pass instead of running it. No streaks to break. No lectures.',
  welcomeCta: 'Get started',

  // ── Language ──────────────────────────────────────────────────────────────
  languageTitle: 'Choose your language',
  languageSubtitle: 'You can change this any time in Settings.',

  // ── Onboarding ────────────────────────────────────────────────────────────
  obBaselineTitle: 'Where are you starting?',
  obBaselineSubtitle:
    'A rough number is fine. Everything the app works out later is measured against this.',
  obPerDayLabel: 'Cigarettes on a normal day',
  obPriceLabel: 'Price of one cigarette',
  obPriceHint: 'If you only know the pack price, divide it by the number in a pack.',
  obGoalTitle: 'What are you aiming for?',
  obGoalSubtitle: 'You can change this whenever you want. Nothing here is a contract.',
  obGoalReduce: 'Smoke less',
  obGoalReduceHint: 'Bring the daily count down gradually.',
  obGoalQuit: 'Stop completely',
  obGoalQuitHint: 'Work towards zero.',
  obGoalTargetLabel: 'Target per day',
  obStyleTitle: 'How should the coach talk to you?',
  obStyleSubtitle: 'Same knowledge, different tone. Change it any time.',
  obFinish: 'Start',

  styleCalm: 'Calm',
  styleCalmHint: 'Unhurried, steady, few words.',
  styleDirect: 'Direct',
  styleDirectHint: 'Plain and practical. Gets to the point.',
  styleScientific: 'Scientific',
  styleScientificHint: 'Explains the mechanism behind the craving.',
  styleEncouraging: 'Encouraging',
  styleEncouragingHint: 'Warm, notices effort, never sugary.',
  styleMinimal: 'Minimal',
  styleMinimalHint: 'One or two lines. Nothing extra.',

  // ── Auth ──────────────────────────────────────────────────────────────────
  authTitle: 'Save your progress',
  authSubtitle: 'An account keeps your history if you change phone. The app works without one.',
  authEmail: 'Email',
  authPassword: 'Password',
  authSignIn: 'Sign in',
  authSignUp: 'Create account',
  authMagicLink: 'Email me a sign-in link',
  authMagicSent: 'Check your email for the sign-in link.',
  authSignUpDone: 'Check your email to confirm your account.',
  authHaveAccount: 'Already have an account? Sign in',
  authNeedAccount: 'New here? Create an account',
  authContinueLocal: 'Continue without an account',
  authNoBackend: 'No backend is configured yet, so accounts are off. See SETUP.md.',
  authGeneric: 'That did not work. Check the details and try again.',

  // ── Dashboard ─────────────────────────────────────────────────────────────
  homeSinceLast: 'since your last cigarette',
  homeNoneLogged: 'Nothing logged yet',
  homeNoneLoggedBody: 'When you smoke, log it. The app gets useful from the first entry.',
  homeTodayTitle: 'Today',
  homeStatSmoked: 'Smoked',
  homeStatCravings: 'Cravings',
  homeStatDelayed: 'Let pass',
  homeStatSaved: 'Saved',
  homeCravingCta: 'I want to smoke',
  homeLogCta: 'Log a cigarette',
  homeCoachHint: 'Talk to your coach',

  // ── Craving flow ──────────────────────────────────────────────────────────
  cravingTriggerTitle: 'What brought this on?',
  cravingTriggerSubtitle: 'One tap. This is what makes the next suggestion better.',
  cravingIntensityTitle: 'How strong is it?',
  cravingIntensityLow: 'Mild',
  cravingIntensityHigh: 'Overwhelming',
  cravingPlanTitle: 'Try this for',
  cravingPlanSubtitle: 'If you still want one afterwards, that is a fine outcome too.',
  cravingStart: 'Start',
  cravingRemaining: 'remaining',
  cravingMadeIt: 'It passed',
  cravingSmoked: 'I smoked',
  cravingLeave: 'Leave this',
  cravingWinTitle: 'That one went by.',
  cravingWinBody: 'You waited {minutes} minutes. That is the whole skill, and you just used it.',
  cravingLoggedTitle: 'Logged.',
  cravingLoggedBody: 'Noted, nothing more. What was happening is worth knowing for next time.',
  cravingNotePlaceholder: 'Anything worth remembering? (optional)',
  cravingBackHome: 'Back to home',

  // ── Triggers ──────────────────────────────────────────────────────────────
  triggerStress: 'Stress',
  triggerBoredom: 'Boredom',
  triggerAfterFood: 'After food',
  triggerTeaCoffee: 'Tea / coffee',
  triggerWork: 'Work',
  triggerSocial: 'Social',
  triggerHabit: 'Habit',
  triggerAnxiety: 'Anxiety',
  triggerAlcohol: 'Alcohol',
  triggerBathroom: 'Bathroom / break',
  triggerOther: 'Other',

  // ── Interventions ─────────────────────────────────────────────────────────
  intBreathe: 'Breathe',
  intBreatheBody: 'In for four, hold for four, out for six. Ten rounds.',
  intWater: 'Cold water',
  intWaterBody: 'A full glass, slowly. Cold if you can get it.',
  intWalk: 'Move',
  intWalkBody: 'Walk somewhere else, even one flight of stairs. Change the room.',
  intHands: 'Occupy your hands',
  intHandsBody: 'Anything with texture — keys, a pen, a rubber band.',
  intDelayTimer: 'Just wait',
  intDelayTimerBody: 'Nothing to do. Sit with it and let the clock run.',
  intCallSomeone: 'Message someone',
  intCallSomeoneBody: 'One line to anyone. It does not have to be about smoking.',
  intBrushTeeth: 'Brush your teeth',
  intBrushTeethBody: 'Clean mouth, cigarette tastes wrong. Cheap and effective.',
  intStepOutside: 'Step outside',
  intStepOutsideBody: 'Outside, without one. Two minutes of air.',
  intWriteItDown: 'Write it down',
  intWriteItDownBody: 'What you actually want right now, in one sentence.',

  // ── Log ───────────────────────────────────────────────────────────────────
  logTitle: 'Log a cigarette',
  logSubtitle: 'No judgement here. This is how the numbers stay honest.',
  logCount: 'How many?',
  logTrigger: 'What was going on?',
  logNote: 'Note (optional)',
  logSubmit: 'Log it',

  // ── Coach ─────────────────────────────────────────────────────────────────
  coachTitle: 'Coach',
  coachPlaceholder: 'Say anything',
  coachSend: 'Send',
  coachEmpty: 'Tell me what is going on, or ask me anything about cutting down.',
  coachThinking: 'Thinking',
  coachOfflineNotice: 'No connection. Answers come from the built-in guidance instead.',
  coachBetaNotice: 'Hindi and Bengali coaching is in beta — the interface is fully translated, the AI’s replies are still being reviewed by native speakers.',
  coachDisclaimer: 'General information, not medical advice.',
  coachClear: 'Clear this conversation',

  // Offline coach replies (src/services/ai/offlineCoach.ts). Same rules as the
  // model: one concrete thing to do, no shame, no promises.
  ocCraving:
    'Give it {minutes} minutes before you decide. Try this: {action}. {how}',
  ocSmoked:
    'Noted, and that is all it is. Nothing here resets. When you have a moment, log what was going on — that is the part that makes the next one easier to see coming.',
  ocWhy:
    'A nicotine craving is a spike, not a state. It builds over a couple of minutes, peaks, and drops away whether or not you smoke — usually inside five to ten. Smoking ends it fast, which is exactly what teaches your brain to run it again.',
  ocDefault:
    'I am offline right now, so this is the built-in guidance rather than a written reply. If a craving is on you: name what set it off, then give it a few minutes before deciding. The craving screen will time it with you.',

  // Crisis handoff (§5). Shown instead of a model reply, never alongside one.
  crisisTitle: 'This is bigger than this app',
  crisisBody:
    'I am glad you said it. Please talk to someone who can actually help right now — someone you trust, a doctor, or a crisis line.',
  crisisHelpline: 'India: Tele-MANAS — 14416, free, any time',
  crisisEmergency: 'If you are in immediate danger, call your local emergency number.',

  // ── Timeline ──────────────────────────────────────────────────────────────
  timelineTitle: 'Timeline',
  timelineEmpty: 'Nothing logged yet.',
  timelineCigarette: 'Cigarette',
  timelineCigarettes: 'Cigarettes',
  timelineCravingDelayed: 'Craving — let it pass',
  timelineCravingSmoked: 'Craving — smoked',
  timelineCravingAbandoned: 'Craving — left',
  timelineWaited: 'waited {minutes}m',

  // ── Calendar ──────────────────────────────────────────────────────────────
  calendarTitle: 'Calendar',
  calendarSubtitle: 'Colour depth is the day’s count against your baseline.',
  calendarLegendNone: 'None',
  calendarLegendSome: 'Fewer',
  calendarLegendMore: 'More',
  calendarDayEmpty: 'Nothing logged.',

  // ── Analytics ─────────────────────────────────────────────────────────────
  analyticsTitle: 'Insights',
  analyticsNoInsights:
    'Not enough logged yet to say anything true. Give it a few days of ordinary use.',
  analyticsDailyTitle: 'Last 14 days',
  analyticsTriggerTitle: 'What sets it off',
  analyticsHourTitle: 'When it happens',
  analyticsInterventionTitle: 'What has worked for you',
  analyticsUses: '{count} times',
  analyticsSuccess: '{percent}% let pass',
  analyticsAverage: 'Daily average',
  analyticsPrevious: 'Two weeks ago',

  // Insight sentences (§14). Only ever generated for genuine improvements.
  insightDailyDrop: 'You are smoking {percent}% less than you were two weeks ago.',
  insightPartOfDayDrop: 'Your {part} smoking has dropped {percent}% compared with two weeks ago.',
  insightDelayed: 'You have let {count} cravings pass — {minutes} minutes you sat through and came out the other side.',
  insightMoney: '{amount} has stayed in your pocket since you started.',
  insightIntervention: '{intervention} has worked for you {percent}% of the time you have tried it.',
  insightTrigger: '{trigger} sits behind more of your cigarettes than anything else. Worth having a plan ready for it.',
  insightSpacing: 'Your cigarettes are currently averaging {minutes} minutes apart.',
  partMorning: 'morning',
  partAfternoon: 'afternoon',
  partEvening: 'evening',
  partNight: 'late night',

  // ── Goals ─────────────────────────────────────────────────────────────────
  goalsTitle: 'Goals',
  goalsCurrent: 'Current goal',
  goalsNone: 'No goal set. A goal is optional — the app works without one.',
  goalsSetTitle: 'Set a target',
  goalsTargetPerDay: 'Cigarettes per day',
  goalsQuitEntirely: 'Stop completely (0 per day)',
  goalsSave: 'Save goal',
  goalsProgress: 'You are averaging {actual} a day against a target of {target}.',
  goalsAchieved: 'Reached on {date}.',
  goalsSince: 'Set {date}',

  // ── Health ────────────────────────────────────────────────────────────────
  healthTitle: 'Health journey',
  healthSubtitle: 'What the body does once the smoke stops, on the usual timeline.',
  healthDisclaimer:
    'General medical information, not personal medical advice — talk to a doctor about your own health.',
  healthReached: 'Reached',
  healthFrom: 'From your last cigarette',
  healthNoStart: 'Log a cigarette to start this timeline.',
  hm20m: '20 minutes',
  hm20mBody: 'Heart rate and blood pressure begin to drop back towards normal.',
  hm12h: '12 hours',
  hm12hBody: 'Carbon monoxide in the blood falls to a normal level.',
  hm2w: '2 weeks to 3 months',
  hm2wBody: 'Circulation improves and lung function starts to increase.',
  hm1y: '1 year',
  hm1yBody: 'Risk of coronary heart disease is roughly half that of a smoker.',
  hm5y: '5 years',
  hm5yBody: 'Stroke risk continues to fall towards that of a non-smoker.',
  hm10y: '10 years',
  hm10yBody: 'Risk of dying from lung cancer is about half that of a smoker.',

  // ── Rewards / horizon ─────────────────────────────────────────────────────
  rewardsTitle: 'Your clearing',
  rewardsSubtitle:
    'The horizon clears as you let cravings pass and smoke less than your baseline. It never moves for opening the app.',
  rewardsStage1: 'Bare',
  rewardsStage2: 'Budding',
  rewardsStage3: 'Leafing',
  rewardsStage4: 'Full canopy',
  rewardsNext: '{count} more to the next stage',
  rewardsCounts: 'Cravings let pass: {delayed} · Days under baseline: {days}',

  // ── Achievements ──────────────────────────────────────────────────────────
  achievementsTitle: 'Milestones',
  achievementsSubtitle: 'Tied to what you actually did, never to app opens.',
  achLocked: 'Not yet',
  achFirstLog: 'First entry',
  achFirstLogBody: 'You logged honestly once. That is where the data starts.',
  achFirstDelay: 'First one let pass',
  achFirstDelayBody: 'A craving came and went without a cigarette.',
  achFiveDelays: 'Five let pass',
  achFiveDelaysBody: 'Not luck any more — a skill you have used five times.',
  achTwentyDelays: 'Twenty let pass',
  achTwentyDelaysBody: 'Twenty cravings that did not get what they wanted.',
  achUnderBaseline: 'A day under baseline',
  achUnderBaselineBody: 'A full day below where you started.',
  achWeekUnder: 'A week under baseline',
  achWeekUnderBody: 'Seven days below your starting count.',
  achSmokeFreeDay: 'A day with none',
  achSmokeFreeDayBody: 'A whole day with nothing logged.',
  achMoneyBack: 'First {amount} back',
  achMoneyBackBody: 'Money that stayed in your pocket instead.',

  // ── Notifications ─────────────────────────────────────────────────────────
  notifTitle: 'Reminders',
  notifSubtitle:
    'One quiet check-in a day at most. No streak warnings, no nagging — that cadence backfires.',
  notifEnable: 'Daily check-in',
  notifTime: 'Time',
  notifDenied: 'Notifications are turned off for this app in your phone’s settings.',
  notifScheduled: 'Scheduled for {time} each day.',
  notifNone: 'No reminders scheduled.',

  // ── Profile ───────────────────────────────────────────────────────────────
  profileTitle: 'You',
  profileSince: 'Using SmokeLess AI since {date}',
  profileTotalLogged: 'Cigarettes logged',
  profileTotalDelayed: 'Cravings let pass',
  profileTotalSaved: 'Money not spent',
  profileNotSignedIn: 'Not signed in — data stays on this phone only.',
  profileSignedInAs: 'Signed in as {email}',

  // ── Settings ──────────────────────────────────────────────────────────────
  settingsTitle: 'Settings',
  settingsLanguage: 'Language',
  settingsCoachStyle: 'Coach style',
  settingsAppearance: 'Appearance',
  settingsAppearanceSystem: 'Follow system',
  settingsAppearanceLight: 'Light',
  settingsAppearanceDark: 'Dark',
  settingsPrice: 'Price per cigarette',
  settingsPriceHint: 'Changing this affects future logs only. Past costs keep the price they had.',
  settingsPriceSaved: 'New price saved from now on.',
  settingsBaseline: 'Baseline per day',
  settingsAppLock: 'Require unlock to open',
  settingsAppLockHint: 'Uses your phone’s fingerprint or face unlock.',
  settingsSignOut: 'Sign out',
  settingsSync: 'Sync now',
  settingsSyncDone: 'Everything is backed up.',
  settingsSyncPending: '{count} entries waiting to sync.',

  // ── AI memory ─────────────────────────────────────────────────────────────
  memoryTitle: 'AI memory',
  memoryBody:
    'This is everything the coach remembers about you between conversations. Nothing you have typed is stored — only this summary.',
  memoryNone: 'Nothing stored yet.',
  memoryTriggers: 'Your most common triggers',
  memoryWorks: 'What has worked',
  memoryStyle: 'Coaching style',
  memoryDelete: 'Delete this memory',
  memoryDeleted: 'Deleted. The coach starts from nothing next time.',

  // ── Privacy ───────────────────────────────────────────────────────────────
  privacyTitle: 'Privacy',
  privacyStoredTitle: 'What is stored',
  privacyStoredBody:
    'Your logs, cravings, prices and goals — on this phone, and in your own account if you signed in. Nothing else.',
  privacyAiTitle: 'What the AI sees',
  privacyAiBody:
    'A short summary of your patterns, plus the message you just sent. Conversations are not kept after you close the app.',
  privacyKeyTitle: 'Where the AI key lives',
  privacyKeyBody:
    'On the server, never in the app. Requests go through your own backend function, so the key cannot be pulled out of the installed app.',
  privacySellTitle: 'Selling data',
  privacySellBody: 'Never. There is no analytics SDK and no third-party tracker in this app.',
  privacyExport: 'Export my data',
  privacyDelete: 'Delete my account',

  // ── Backup ────────────────────────────────────────────────────────────────
  backupTitle: 'Backup',
  backupBody: 'Writes everything on this phone to a single JSON file you can save or send.',
  backupExport: 'Export a backup file',
  backupDone: 'Backup ready.',
  backupFailed: 'Could not write the file.',
  backupCounts: '{cigarettes} cigarettes · {cravings} cravings',

  // ── Help ──────────────────────────────────────────────────────────────────
  helpTitle: 'Help',
  helpQ1: 'Does anything break if I smoke?',
  helpA1:
    'No. There is no streak to lose and no counter that resets to zero. A logged cigarette changes the numbers and nothing else.',
  helpQ2: 'Why does it ask me to wait such a short time?',
  helpA2:
    'The first ask is a fraction of your usual gap between cigarettes, not the whole thing. It grows as your own history shows you can hold it.',
  helpQ3: 'Does it work without internet?',
  helpA3:
    'Yes. Logging, the craving flow, the delay timer and your history are all local. Only the coach’s written replies need a connection, and there is offline guidance behind them.',
  helpQ4: 'Can I use it without an account?',
  helpA4: 'Yes. Without one, everything stays on this phone and nothing leaves it.',
  helpQ5: 'Is this medical advice?',
  helpA5:
    'No. It is general information and behavioural support. Talk to a doctor about medication, withdrawal or any symptom that worries you.',

  // ── About ─────────────────────────────────────────────────────────────────
  aboutTitle: 'About',
  aboutBody:
    'SmokeLess AI helps you smoke less by making cravings survivable: understand the trigger, delay a little, log honestly either way.',
  aboutCredit: 'A Biswodip Goj product.',
  aboutVersion: 'Version {version}',

  // ── Delete account ────────────────────────────────────────────────────────
  deleteTitle: 'Delete everything',
  deleteBody:
    'This removes your logs, cravings, prices, goals and AI memory from this phone and from your account. It cannot be undone.',
  deleteTypeToConfirm: 'Type DELETE to confirm',
  deleteConfirmWord: 'DELETE',
  deleteButton: 'Delete everything',
  deleteDone: 'Deleted.',
};

export default en;
