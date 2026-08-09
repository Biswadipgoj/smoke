// src/i18n/en.ts
//
// §17 — the canonical dictionary. Every other language is typed against this
// object's keys, so a missing translation is a compile error rather than a
// blank label discovered in QA.
//
// Deliberately not i18next: the string set needs no plural rules and only
// trivial interpolation, and the bundle cost isn't worth it at this size.
// Revisit if that changes.

const en = {
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.skip': 'Skip',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.notNow': 'Not now',
  'common.loading': 'Getting things ready',

  'welcome.title': 'The haze clears slowly.',
  'welcome.body':
    'SmokeLess AI helps you understand your cravings, wait a little longer each time, and smoke less because of it. Nothing here judges you.',
  'welcome.cta': 'Begin',

  'language.title': 'Choose your language',
  'language.body': 'You can change this later in Settings.',

  'onboarding.baseline.title': 'How many cigarettes on a usual day?',
  'onboarding.baseline.body':
    'A rough number is fine. This is only a starting line to measure against — never a score.',
  'onboarding.goal.title': 'What are you working towards?',
  'onboarding.goal.reduce': 'Smoke less',
  'onboarding.goal.reduceBody': 'Bring the number down steadily, at your pace.',
  'onboarding.goal.quit': 'Stop completely',
  'onboarding.goal.quitBody': 'Work towards a quit date and hold it.',
  'onboarding.target.title': 'What would a better day look like?',
  'onboarding.target.body': 'Pick a number you could actually reach this month.',
  'onboarding.quitDate.title': 'When would you like to stop?',
  'onboarding.quitDate.body': 'You can move this date whenever you need to.',
  'onboarding.price.title': 'What does a pack cost you?',
  'onboarding.price.body':
    'Used for the money you keep. If the price changes later, add the new one — old entries keep their old price.',
  'onboarding.price.pricePerPack': 'Price per pack',
  'onboarding.price.perPack': 'Cigarettes per pack',
  'onboarding.style.title': 'How should your coach talk to you?',
  'onboarding.style.body': 'Same coach, different tone. Change it any time.',
  'quitDate.today': 'Today',
  'quitDate.week': 'In a week',
  'quitDate.month': 'In a month',
  'quitDate.later': 'Not yet — I’ll pick later',

  'onboarding.finish.title': "That's everything.",
  'onboarding.finish.body':
    'Log a craving the moment it starts and the app will do the rest — even with no signal.',

  'style.calm': 'Calm',
  'style.calm.desc': 'Unhurried, quiet, never pushy.',
  'style.direct': 'Direct',
  'style.direct.desc': 'Short and plain. No padding.',
  'style.scientific': 'Scientific',
  'style.scientific.desc': 'Explains what your body is doing.',
  'style.encouraging': 'Encouraging',
  'style.encouraging.desc': 'Warm, notices small wins.',
  'style.minimal': 'Minimal',
  'style.minimal.desc': 'A line or two, nothing more.',

  'auth.title': 'Keep your history safe',
  'auth.body': 'Sign in so your logs survive a lost phone. You can also carry on without an account.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.signUp': 'Create account',
  'auth.magicLink': 'Email me a sign-in link',
  'auth.magicLinkSent': 'Check your email for the link.',
  'auth.continueOffline': 'Continue without an account',
  'auth.notConfigured': 'No backend is configured yet, so the app is running fully on-device.',
  'auth.haveAccount': 'Already have an account? Sign in',
  'auth.needAccount': 'New here? Create an account',

  'tabs.dashboard': 'Home',
  'tabs.coach': 'Coach',
  'tabs.analytics': 'Patterns',
  'tabs.profile': 'You',

  'dashboard.sinceLast': 'Since your last cigarette',
  'dashboard.never': 'No cigarette logged yet',
  'dashboard.today': 'Today',
  'dashboard.cigarettes': 'Smoked',
  'dashboard.cravings': 'Cravings',
  'dashboard.delayed': 'Delayed',
  'dashboard.saved': 'Kept',
  'dashboard.cravingCta': "I'm craving one",
  'dashboard.logCta': 'I smoked one',
  'dashboard.coachTitle': 'Your coach',

  'craving.trigger.title': "What's behind it?",
  'craving.trigger.body': 'One tap. This is what teaches the app your pattern.',
  'craving.intensity.title': 'How strong is it?',
  'craving.intensity.1': 'Barely there',
  'craving.intensity.2': 'Noticeable',
  'craving.intensity.3': 'Pulling at me',
  'craving.intensity.4': 'Hard to sit with',
  'craving.intensity.5': 'Overwhelming',
  'craving.plan.title': 'Try this first',
  'craving.plan.ask': 'Wait {n} minutes',
  'craving.plan.start': 'Start',
  'craving.plan.why': 'Why this long?',
  'craving.timer.body': 'A craving peaks and falls on its own. You only have to outlast this bit.',
  'craving.timer.remaining': 'left',
  'craving.madeIt': 'I made it',
  'craving.smoked': 'I smoked',
  'craving.outcome.delayed.title': 'You waited it out.',
  'craving.outcome.delayed.body': "That's the whole skill. The next ask will be built on this one.",
  'craving.outcome.smoked.title': 'Logged.',
  'craving.outcome.smoked.body':
    "One cigarette is one data point. It tells the app something useful about when this is hardest for you — that's all it is.",
  'craving.finish': 'Done',

  'trigger.stress': 'Stress',
  'trigger.boredom': 'Boredom',
  'trigger.after_food': 'After food',
  'trigger.tea_coffee': 'Tea or coffee',
  'trigger.work': 'Work',
  'trigger.social': 'With people',
  'trigger.habit': 'Just habit',
  'trigger.anxiety': 'Anxiety',
  'trigger.alcohol': 'Drinking',
  'trigger.break': 'Bathroom or break',
  'trigger.other': 'Something else',

  // §3-6 intervention copy. Shown mid-craving, so it lives in the dictionary
  // like everything else rather than being hardcoded English in the engine.
  'intervention.box_breath.title': 'Breathe square',
  'intervention.box_breath.body':
    'In for four. Hold for four. Out for four. Hold for four. Six rounds and the edge comes off on its own.',
  'intervention.water.title': 'A full glass of water',
  'intervention.water.body':
    'Drink it slowly, all of it. It occupies the same hand and the same mouth, which is more of the habit than it sounds.',
  'intervention.walk.title': 'To the end of the street',
  'intervention.walk.body': 'Out the door and back. Leave the lighter where it is.',
  'intervention.hands.title': 'Give your hands the job',
  'intervention.hands.body':
    'A pen, a coin, a rubber band. Much of this is your hands looking for something to do at a familiar time of day.',
  'intervention.step_out.title': 'Step away for a minute',
  'intervention.step_out.body':
    'Bathroom, balcony, anywhere else. Being the only one not smoking is much easier when you are not stood in it.',
  'intervention.name_it.title': 'Name what you actually want',
  'intervention.name_it.body':
    'A break? Quiet? To stop thinking about work? Say it to yourself in words. Often the cigarette was standing in for something else.',
  'intervention.cold.title': 'Cold water, wrists and face',
  'intervention.cold.body':
    'Thirty seconds under the cold tap. It interrupts the physical build-up faster than anything else you can do indoors.',
  'intervention.message.title': 'Message one person',
  'intervention.message.body':
    "Anyone, about anything. It doesn't have to be about smoking — it just has to be for the next few minutes.",

  'coach.title': 'Coach',
  'coach.placeholder': "What's going on?",
  'coach.send': 'Send',
  'coach.empty': "Tell me what's happening and I'll work with it.",
  'coach.offline': 'Offline — answering from your own patterns.',
  'coach.disclaimer': 'General support, not medical advice.',
  'coach.thinking': 'Thinking',

  // §3-6 offline coach. Written so nothing here would trip the safety filter.
  'offline.craving':
    "It's here now, and it will fall on its own — they always do. Start the timer and give it the few minutes it needs.",
  'offline.smoked':
    "Noted, and that's all it is. What was going on just before? That's the part worth knowing.",
  'offline.win': "You waited it out. That's the skill this whole thing is built on.",
  'offline.why':
    'A craving climbs for a few minutes and then drops, whether or not you smoke. The wait is training the gap between wanting one and reaching for one.',
  'offline.low':
    "Hard days are part of this, not evidence against you. Nothing you do today has to be impressive — logging it is enough.",
  'offline.general': "I'm here. What's happening right now?",
  'offline.triggerNote': '{trigger} is the one that comes up most for you.',
  'offline.intervalNote': 'Your gaps have been averaging about {n} minutes lately.',

  'coachCard.start': 'Log the next craving the moment it starts. That is the whole first step.',
  'coachCard.longGap': "It's been about {n} hours. That gap is doing real work.",
  'coachCard.momentum': "You've been waiting most of them out lately. That holds.",
  'coachCard.easier': "The last few were hard, so the next ask will be a shorter one.",
  'coachCard.underBaseline': 'Under your usual day so far.',
  'coachCard.trigger': '{trigger} is the one that comes up most. Worth watching for today.',
  'coachCard.neutral': 'Log what happens today. The pattern comes out of the logging.',

  'timeline.title': 'Timeline',
  'timeline.empty': 'Nothing logged yet.',
  'timeline.today': 'Today',
  'timeline.yesterday': 'Yesterday',
  'timeline.cigarette': 'Cigarette',
  'timeline.cravingDelayed': 'Craving — waited it out',
  'timeline.cravingSmoked': 'Craving — smoked',
  'timeline.cravingOpen': 'Craving',

  'calendar.title': 'Calendar',
  'calendar.legendCigarettes': 'Cigarettes',
  'calendar.legendDelayed': 'Cravings delayed',
  'calendar.none': 'Nothing logged this day.',

  'analytics.title': 'Patterns',
  'analytics.empty': 'A few days of logs and your patterns will show up here.',
  'analytics.insights': 'What changed',
  'analytics.noInsights': 'Not enough history yet to say anything honest.',
  'analytics.byHour': 'When you smoke',
  'analytics.byTrigger': 'What sets it off',
  'analytics.perDay': 'Cigarettes a day',
  'analytics.lastWeek': 'Last 7 days',

  // §14 — narrative templates. Only ever filled in for a genuine improvement.
  'insight.overall': "You're smoking {n}% less than the week before.",
  'insight.partOfDay': 'Your {part} smoking has dropped {n}% compared with two weeks ago.',
  'insight.trigger': 'Cravings you put down to {trigger} are {n}% fewer this week.',
  'insight.delays': 'You waited out {n}% of your cravings this week — more than the week before.',
  'insight.gap': 'Your longest stretch without one this week was about {n} hours.',
  'insight.part.morning': 'morning',
  'insight.part.afternoon': 'afternoon',
  'insight.part.evening': 'evening',
  'insight.part.night': 'late-night',

  'goals.title': 'Goals',
  'goals.baseline': 'Your starting point',
  'goals.target': 'Your target',
  'goals.quitDate': 'Quit date',
  'goals.current': 'Recent average',
  'goals.edit': 'Change goal',
  'goals.progress': '{n}% of the way from your starting point to your target.',

  'health.title': 'Health journey',
  'health.disclaimer':
    'General medical information, not personal medical advice — talk to a doctor about your own health.',
  'health.reached': 'Reached',
  'health.20min': '20 minutes',
  'health.20min.body': 'Heart rate and blood pressure begin to drop back down.',
  'health.12hr': '12 hours',
  'health.12hr.body': 'Carbon monoxide in your blood falls to a normal level.',
  'health.2wk': '2 weeks to 3 months',
  'health.2wk.body': 'Circulation and lung function improve.',
  'health.1yr': '1 year',
  'health.1yr.body': 'Risk of coronary heart disease is roughly half that of a smoker.',
  'health.5yr': '5 years',
  'health.5yr.body': 'Stroke risk drops.',
  'health.10yr': '10 years',
  'health.10yr.body': 'Lung cancer death rate is roughly half that of a smoker.',

  'rewards.title': 'Your horizon',
  'rewards.body':
    'The horizon clears when you delay a craving, smoke less than your starting point, or finish a reflection. Never for opening the app.',
  'rewards.stage.haze': 'Haze',
  'rewards.stage.firstLight': 'First light',
  'rewards.stage.breaking': 'Breaking',
  'rewards.stage.clear': 'Clear',
  'rewards.stage.dawn': 'Dawn',
  'rewards.money': 'Money kept',
  'rewards.notSmoked': 'Cigarettes not smoked',

  'achievements.title': 'Milestones',
  'achievements.locked': 'Not yet',
  'achievements.first.title': 'First craving logged',
  'achievements.first.body': 'You named it instead of acting on it.',
  'achievements.delay5.title': 'Five cravings waited out',
  'achievements.delay5.body': 'This is a skill now, not a fluke.',
  'achievements.day1.title': 'A day under your baseline',
  'achievements.day1.body': 'Fewer than a usual day, by your own count.',
  'achievements.week1.title': 'A week of logging',
  'achievements.week1.body': 'Seven days of honest data.',
  'achievements.delay25.title': 'Twenty-five delays',
  'achievements.delay25.body': 'The gap between wanting and doing is wider now.',
  'achievements.halved.title': 'Halved',
  'achievements.halved.body': 'Your recent average is half your starting point.',

  'notifications.title': 'Reminders',
  'notifications.daily': 'Daily check-in',
  'notifications.dailyBody': 'One quiet nudge a day. Never more than that.',
  'notifications.time': 'Time',
  'notifications.denied': 'Notifications are turned off for this app in your phone settings.',
  'notifications.body': 'A moment to log how today went.',

  'profile.title': 'You',
  'profile.guest': 'On this device only',
  'profile.entries': '{n} entries logged',
  'profile.since': 'Since {date}',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.coachStyle': 'Coach style',
  'settings.price': 'Cigarette price',
  'settings.appLock': 'Unlock with biometrics',
  'settings.appLockBody': 'Ask for your fingerprint or face before opening the app.',
  'settings.notifications': 'Reminders',
  'settings.goals': 'Goals',
  'settings.health': 'Health journey',
  'settings.aiMemory': 'AI memory',
  'settings.privacy': 'Privacy',
  'settings.backup': 'Export your data',
  'settings.help': 'Help',
  'settings.about': 'About',
  'settings.signOut': 'Sign out',
  'settings.deleteAccount': 'Delete account',
  'settings.version': 'Version {v}',

  'aiMemory.title': 'AI memory',
  'aiMemory.body':
    'This is everything the coach remembers about you between conversations. Your messages themselves are never stored on a server.',
  'aiMemory.triggers': 'Triggers it has noticed',
  'aiMemory.interventions': 'What has worked for you',
  'aiMemory.style': 'Tone you chose',
  'aiMemory.empty': 'Nothing remembered yet.',
  'aiMemory.clear': 'Forget all of this',
  'aiMemory.cleared': 'Cleared.',

  'privacy.title': 'Privacy',
  'privacy.stored': 'What is stored',
  'privacy.storedBody':
    'Your cigarette and craving logs, your goal, and your prices. On this device always; on your account only if you sign in.',
  'privacy.notStored': 'What is not stored',
  'privacy.notStoredBody':
    'Your conversations with the coach. Only a short summary of what helps you is kept, and you can delete it from the AI memory screen.',
  'privacy.keys': 'About the AI',
  'privacy.keysBody':
    'Coach replies are generated on a server we control, so no AI key ever ships inside the app. Messages are sent to the model to answer and are not retained afterwards.',
  'privacy.rights': 'Your data is yours',
  'privacy.rightsBody':
    'Export it or delete it whenever you like. Deleting your account removes every row that belongs to you. Your data is never sold.',

  'backup.title': 'Export your data',
  'backup.body': 'Everything you have logged, as a JSON file you can keep.',
  'backup.export': 'Export',
  'backup.exported': 'Exported {n} records.',

  'help.title': 'Help',
  'help.q1': 'Does it work without internet?',
  'help.a1':
    'Yes. Logging, the delay timer and the suggestions all run on your phone. Only the AI coach needs a connection, and it falls back to your own patterns when there is none.',
  'help.q2': 'Why does it ask me to wait such a short time?',
  'help.a2':
    'Because a short ask you win beats a long one you abandon. The wait grows as your gaps grow.',
  'help.q3': 'What happens when I log a cigarette?',
  'help.a3': 'A number changes. Nothing else. It is data, not a verdict.',
  'help.q4': 'Will it tell anyone?',
  'help.a4': 'No. Nothing is shared with anyone, ever.',
  'help.contact': 'Something else? Write to us.',

  'about.title': 'About',
  'about.body':
    'SmokeLess AI is a quiet companion for cutting down — built on the idea that understanding a craving beats fighting it.',
  'about.credit': 'A Biswodip Goj product.',
  'about.version': 'Version {v}',

  'delete.title': 'Delete your account',
  'delete.warning':
    'This removes your profile, every log, every price and everything the coach remembers. It cannot be undone.',
  'delete.confirmPrompt': 'Type DELETE to confirm.',
  'delete.confirmWord': 'DELETE',
  'delete.cta': 'Delete everything',
  'delete.localOnly': 'Clear all data on this device',

  'crisis.title': "Let's pause on the smoking for a second.",
  'crisis.body':
    "What you just wrote sounds heavier than a craving, and it matters more. Please talk to someone who can actually help right now — a person you trust, or a crisis line in your country. You deserve real support, not an app's answer.",

  'error.generic': 'That did not work. Try again.',
} as const;

export default en;
