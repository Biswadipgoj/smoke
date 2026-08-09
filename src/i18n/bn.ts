// src/i18n/bn.ts
//
// §17 — a solid starting translation, not a final one. Same register choice as
// Hindi: everyday spoken Bengali, not formal সাধু ভাষা.
//
// Needs native-speaker review before release — see SETUP.md, "Going to
// production".

import type { Dictionary } from './index';

const bn: Dictionary = {
  'common.continue': 'এগিয়ে যান',
  'common.back': 'পিছনে',
  'common.skip': 'বাদ দিন',
  'common.save': 'সেভ করুন',
  'common.cancel': 'থাক',
  'common.notNow': 'এখন নয়',
  'common.loading': 'তৈরি হচ্ছে',

  'welcome.title': 'ধোঁয়াশা আস্তে আস্তে কাটে।',
  'welcome.body':
    'SmokeLess AI আপনাকে নিজের টান বুঝতে, প্রতিবার একটু বেশি অপেক্ষা করতে, আর সেই কারণেই কম খেতে সাহায্য করে। এখানে কেউ আপনাকে বিচার করবে না।',
  'welcome.cta': 'শুরু করুন',

  'language.title': 'আপনার ভাষা বাছুন',
  'language.body': 'পরে সেটিংসে গিয়ে বদলাতে পারবেন।',

  'onboarding.baseline.title': 'সাধারণ দিনে কটা সিগারেট?',
  'onboarding.baseline.body':
    'আন্দাজেই চলবে। এটা শুধু একটা শুরুর দাগ, যার সঙ্গে তুলনা হবে — কোনও নম্বর নয় যা আপনাকে মাপবে।',
  'onboarding.goal.title': 'আপনি কোন দিকে যেতে চান?',
  'onboarding.goal.reduce': 'কমাতে চাই',
  'onboarding.goal.reduceBody': 'নিজের গতিতে, ধীরে ধীরে সংখ্যাটা নামান।',
  'onboarding.goal.quit': 'একেবারে ছাড়তে চাই',
  'onboarding.goal.quitBody': 'একটা তারিখ ঠিক করুন আর সেটা ধরে রাখুন।',
  'onboarding.target.title': 'ভালো একটা দিন কেমন হবে?',
  'onboarding.target.body': 'এমন সংখ্যা বাছুন যা এই মাসে সত্যিই পৌঁছনো যায়।',
  'onboarding.quitDate.title': 'কবে ছাড়তে চান?',
  'onboarding.quitDate.body': 'দরকার হলে এই তারিখ যখন খুশি সরিয়ে নিতে পারবেন।',
  'onboarding.price.title': 'এক প্যাকেটের দাম কত?',
  'onboarding.price.body':
    'জমানো টাকার হিসেবের জন্য। দাম বদলালে নতুনটা যোগ করুন — পুরনো এন্ট্রি পুরনো দামেই থাকবে।',
  'onboarding.price.pricePerPack': 'প্যাকেটের দাম',
  'onboarding.price.perPack': 'প্যাকেটে কটা সিগারেট',
  'onboarding.style.title': 'কোচ আপনার সঙ্গে কীভাবে কথা বলবে?',
  'onboarding.style.body': 'কোচ একই থাকবে, শুধু ধরনটা বদলাবে। যখন খুশি বদলান।',
  'quitDate.today': 'আজ',
  'quitDate.week': 'এক সপ্তাহে',
  'quitDate.month': 'এক মাসে',
  'quitDate.later': 'এখন নয় — পরে বাছব',

  'onboarding.finish.title': 'এটুকুই।',
  'onboarding.finish.body':
    'টান শুরু হলেই সেটা লিখে ফেলুন — বাকিটা অ্যাপ সামলাবে, নেটওয়ার্ক ছাড়াও।',

  'style.calm': 'শান্ত',
  'style.calm.desc': 'তাড়াহুড়ো নেই, চাপও নেই।',
  'style.direct': 'সোজাসুজি',
  'style.direct.desc': 'ছোট আর পরিষ্কার। বাড়তি কথা নেই।',
  'style.scientific': 'বৈজ্ঞানিক',
  'style.scientific.desc': 'শরীরে কী হচ্ছে তা বুঝিয়ে বলে।',
  'style.encouraging': 'উৎসাহ দেওয়া',
  'style.encouraging.desc': 'সহানুভূতি নিয়ে, ছোট জয়ও খেয়াল করে।',
  'style.minimal': 'সংক্ষিপ্ত',
  'style.minimal.desc': 'এক-দু লাইন, তার বেশি নয়।',

  'auth.title': 'আপনার হিসেব সুরক্ষিত রাখুন',
  'auth.body':
    'সাইন ইন করুন যাতে ফোন হারালেও তথ্য থেকে যায়। অ্যাকাউন্ট ছাড়াও চালাতে পারেন।',
  'auth.email': 'ইমেল',
  'auth.password': 'পাসওয়ার্ড',
  'auth.signIn': 'সাইন ইন',
  'auth.signUp': 'অ্যাকাউন্ট খুলুন',
  'auth.magicLink': 'আমাকে সাইন-ইন লিঙ্ক পাঠান',
  'auth.magicLinkSent': 'লিঙ্কের জন্য ইমেল দেখুন।',
  'auth.continueOffline': 'অ্যাকাউন্ট ছাড়াই চালান',
  'auth.notConfigured': 'এখনও কোনও সার্ভার সেট করা নেই, তাই অ্যাপটা পুরোপুরি ফোনেই চলছে।',
  'auth.haveAccount': 'আগে থেকেই অ্যাকাউন্ট আছে? সাইন ইন করুন',
  'auth.needAccount': 'নতুন? অ্যাকাউন্ট খুলুন',

  'tabs.dashboard': 'হোম',
  'tabs.coach': 'কোচ',
  'tabs.analytics': 'ধরন',
  'tabs.profile': 'আপনি',

  'dashboard.sinceLast': 'শেষ সিগারেটের পর',
  'dashboard.never': 'এখনও কোনও সিগারেট লেখা হয়নি',
  'dashboard.today': 'আজ',
  'dashboard.cigarettes': 'খাওয়া',
  'dashboard.cravings': 'টান',
  'dashboard.delayed': 'পিছোনো',
  'dashboard.saved': 'জমানো',
  'dashboard.cravingCta': 'টান উঠছে',
  'dashboard.logCta': 'একটা খেয়েছি',
  'dashboard.coachTitle': 'আপনার কোচ',

  'craving.trigger.title': 'এর পিছনে কী?',
  'craving.trigger.body': 'একটা ট্যাপ। এটাই অ্যাপকে আপনার ধরন শেখায়।',
  'craving.intensity.title': 'কতটা জোরালো?',
  'craving.intensity.1': 'সামান্য',
  'craving.intensity.2': 'টের পাচ্ছি',
  'craving.intensity.3': 'টানছে',
  'craving.intensity.4': 'সহ্য করা কঠিন',
  'craving.intensity.5': 'একেবারে চেপে ধরেছে',
  'craving.plan.title': 'আগে এটা করে দেখুন',
  'craving.plan.ask': '{n} মিনিট অপেক্ষা করুন',
  'craving.plan.start': 'শুরু',
  'craving.plan.why': 'এতক্ষণ কেন?',
  'craving.timer.body': 'টান নিজেই বাড়ে, নিজেই কমে। শুধু এইটুকু পার করতে হবে।',
  'craving.timer.remaining': 'বাকি',
  'craving.madeIt': 'পেরেছি',
  'craving.smoked': 'খেয়ে ফেলেছি',
  'craving.outcome.delayed.title': 'আপনি সেটা পার করলেন।',
  'craving.outcome.delayed.body': 'আসল দক্ষতা এটাই। পরেরবারের হিসেব এর উপরেই দাঁড়াবে।',
  'craving.outcome.smoked.title': 'লেখা হল।',
  'craving.outcome.smoked.body':
    'একটা সিগারেট মানে একটা তথ্য। এতে অ্যাপ বোঝে আপনার জন্য কোন সময়টা সবচেয়ে কঠিন — এর বেশি কিছু নয়।',
  'craving.finish': 'শেষ',

  'trigger.stress': 'চাপ',
  'trigger.boredom': 'একঘেয়েমি',
  'trigger.after_food': 'খাওয়ার পরে',
  'trigger.tea_coffee': 'চা বা কফি',
  'trigger.work': 'কাজ',
  'trigger.social': 'লোকজনের সঙ্গে',
  'trigger.habit': 'শুধুই অভ্যাস',
  'trigger.anxiety': 'উদ্বেগ',
  'trigger.alcohol': 'মদ্যপানের সঙ্গে',
  'trigger.break': 'বাথরুম বা বিরতি',
  'trigger.other': 'অন্য কিছু',

  'intervention.box_breath.title': 'চৌকো শ্বাস',
  'intervention.box_breath.body':
    'চার গুনে শ্বাস নিন। চার গুনে ধরে রাখুন। চার গুনে ছাড়ুন। চার গুনে থামুন। ছ’বার — ধারটা নিজেই কমে যাবে।',
  'intervention.water.title': 'পুরো এক গ্লাস জল',
  'intervention.water.body':
    'ধীরে ধীরে, পুরোটা খান। একই হাত আর একই মুখ ব্যস্ত থাকে — অভ্যাসের অনেকটাই আসলে এটুকুই।',
  'intervention.walk.title': 'গলির শেষ পর্যন্ত',
  'intervention.walk.body': 'বেরিয়ে যান, ফিরে আসুন। লাইটারটা যেখানে আছে থাক।',
  'intervention.hands.title': 'হাতকে কাজ দিন',
  'intervention.hands.body':
    'একটা কলম, একটা কয়েন, একটা রাবার ব্যান্ড। দিনের চেনা সময়ে হাত কিছু একটা খুঁজছে — অনেকটা এটুকুই।',
  'intervention.step_out.title': 'এক মিনিটের জন্য সরে যান',
  'intervention.step_out.body':
    'বাথরুম, বারান্দা, যে কোনও জায়গা। ওই পরিবেশে দাঁড়িয়ে না থাকলে একা না-খাওয়া অনেক সহজ।',
  'intervention.name_it.title': 'আসলে কী চাইছেন, নাম দিন',
  'intervention.name_it.body':
    'একটু বিরতি? নীরবতা? কাজের চিন্তা থেকে রেহাই? নিজেকে কথায় বলুন। প্রায়ই সিগারেট অন্য কিছুর জায়গা নিচ্ছে।',
  'intervention.cold.title': 'ঠান্ডা জল, কব্জি আর মুখে',
  'intervention.cold.body':
    'ত্রিশ সেকেন্ড ঠান্ডা কলের নিচে। ঘরের ভিতরে এর চেয়ে দ্রুত শরীরের টানটা আর কিছু ভাঙে না।',
  'intervention.message.title': 'একজনকে মেসেজ করুন',
  'intervention.message.body':
    'যে কাউকে, যে কোনও বিষয়ে। সিগারেট নিয়ে হতে হবে না — শুধু পরের কয়েকটা মিনিট ভরলেই হল।',

  'coach.title': 'কোচ',
  'coach.placeholder': 'কী চলছে?',
  'coach.send': 'পাঠান',
  'coach.empty': 'কী হচ্ছে বলুন, সেখান থেকেই শুরু করি।',
  'coach.offline': 'অফলাইন — আপনার নিজের ধরন থেকে উত্তর দিচ্ছি।',
  'coach.disclaimer': 'সাধারণ সহায়তা, ডাক্তারি পরামর্শ নয়।',
  'coach.thinking': 'ভাবছি',

  'offline.craving':
    'এখন আছে, আর নিজেই নেমে যাবে — সবসময়ই যায়। টাইমার চালু করুন, ওই কয়েকটা মিনিট শুধু দিয়ে দিন।',
  'offline.smoked':
    'লেখা হল, এটুকুই। ঠিক তার আগে কী চলছিল? জানার মতো আসল কথা ওটাই।',
  'offline.win': 'আপনি সেটা পার করলেন। গোটা ব্যাপারটাই এই দক্ষতার উপর দাঁড়িয়ে।',
  'offline.why':
    'টান কয়েক মিনিট বাড়ে, তারপর নেমে যায় — আপনি খান বা না খান। এই অপেক্ষা চাওয়া আর হাত বাড়ানোর মাঝের ফাঁকটা চওড়া করছে।',
  'offline.low':
    'কঠিন দিন এই পথেরই অংশ, আপনার বিরুদ্ধে প্রমাণ নয়। আজ বড় কিছু করতে হবে না — লিখে রাখাটাই যথেষ্ট।',
  'offline.general': 'আমি আছি। এখন কী চলছে?',
  'offline.triggerNote': 'আপনার ক্ষেত্রে সবচেয়ে বেশি আসে {trigger}।',
  'offline.intervalNote': 'আজকাল আপনার ব্যবধান গড়ে প্রায় {n} মিনিট।',

  'coachCard.start': 'পরের টান শুরু হলেই লিখে ফেলুন। প্রথম ধাপ এটুকুই।',
  'coachCard.longGap': 'প্রায় {n} ঘণ্টা হয়ে গেল। এই ব্যবধানটা সত্যিই কাজ করছে।',
  'coachCard.momentum': 'ইদানীং বেশিরভাগ টানই সামলে নিয়েছেন। এটা টেকে।',
  'coachCard.easier': 'শেষ কয়েকটা কঠিন গেছে, তাই পরেরবার কম সময় অপেক্ষা করতে বলা হবে।',
  'coachCard.underBaseline': 'এখনও পর্যন্ত সাধারণ দিনের চেয়ে কম।',
  'coachCard.trigger': 'সবচেয়ে বেশি আসে {trigger}। আজ এদিকে নজর রাখুন।',
  'coachCard.neutral': 'আজ যা হয় লিখে রাখুন। ধরনটা এই লেখা থেকেই বেরোয়।',

  'timeline.title': 'টাইমলাইন',
  'timeline.empty': 'এখনও কিছু লেখা হয়নি।',
  'timeline.today': 'আজ',
  'timeline.yesterday': 'গতকাল',
  'timeline.cigarette': 'সিগারেট',
  'timeline.cravingDelayed': 'টান — সামলে নিয়েছেন',
  'timeline.cravingSmoked': 'টান — খেয়েছেন',
  'timeline.cravingOpen': 'টান',

  'calendar.title': 'ক্যালেন্ডার',
  'calendar.legendCigarettes': 'সিগারেট',
  'calendar.legendDelayed': 'পিছোনো টান',
  'calendar.none': 'এই দিনে কিছু লেখা নেই।',

  'analytics.title': 'ধরন',
  'analytics.empty': 'কয়েক দিন লিখুন, তারপর আপনার ধরন এখানে দেখা যাবে।',
  'analytics.insights': 'কী বদলাল',
  'analytics.noInsights': 'সৎভাবে কিছু বলার মতো যথেষ্ট তথ্য এখনও নেই।',
  'analytics.byHour': 'কখন খান',
  'analytics.byTrigger': 'কীসে টান ওঠে',
  'analytics.perDay': 'দিনে সিগারেট',
  'analytics.lastWeek': 'গত ৭ দিন',

  'insight.overall': 'আগের সপ্তাহের তুলনায় আপনি {n}% কম খাচ্ছেন।',
  'insight.partOfDay': 'দু’সপ্তাহ আগের তুলনায় {part}ের সিগারেট {n}% কমেছে।',
  'insight.trigger': '{trigger} থেকে আসা টান এই সপ্তাহে {n}% কম।',
  'insight.delays': 'এই সপ্তাহে আপনি {n}% টান সামলে নিয়েছেন — আগের সপ্তাহের চেয়ে বেশি।',
  'insight.gap': 'এই সপ্তাহে সিগারেট ছাড়া সবচেয়ে লম্বা সময় ছিল প্রায় {n} ঘণ্টা।',
  'insight.part.morning': 'সকাল',
  'insight.part.afternoon': 'দুপুর',
  'insight.part.evening': 'সন্ধে',
  'insight.part.night': 'গভীর রাত',

  'goals.title': 'লক্ষ্য',
  'goals.baseline': 'আপনার শুরু',
  'goals.target': 'আপনার লক্ষ্য',
  'goals.quitDate': 'ছাড়ার তারিখ',
  'goals.current': 'সাম্প্রতিক গড়',
  'goals.edit': 'লক্ষ্য বদলান',
  'goals.progress': 'শুরু থেকে লক্ষ্য পর্যন্ত পথের {n}% হয়ে গেছে।',

  'health.title': 'শরীরের যাত্রা',
  'health.disclaimer':
    'এটি সাধারণ চিকিৎসা-তথ্য, ব্যক্তিগত পরামর্শ নয় — নিজের শরীর নিয়ে ডাক্তারের সঙ্গে কথা বলুন।',
  'health.reached': 'পৌঁছে গেছেন',
  'health.20min': '২০ মিনিট',
  'health.20min.body': 'হৃৎস্পন্দন আর রক্তচাপ নামতে শুরু করে।',
  'health.12hr': '১২ ঘণ্টা',
  'health.12hr.body': 'রক্তে কার্বন মনোক্সাইড স্বাভাবিক মাত্রায় নেমে আসে।',
  'health.2wk': '২ সপ্তাহ থেকে ৩ মাস',
  'health.2wk.body': 'রক্তসঞ্চালন আর ফুসফুসের কাজ ভালো হয়।',
  'health.1yr': '১ বছর',
  'health.1yr.body': 'হৃদরোগের ঝুঁকি ধূমপায়ীর তুলনায় মোটামুটি অর্ধেক হয়ে যায়।',
  'health.5yr': '৫ বছর',
  'health.5yr.body': 'স্ট্রোকের ঝুঁকি কমে।',
  'health.10yr': '১০ বছর',
  'health.10yr.body': 'ফুসফুসের ক্যান্সারে মৃত্যুর হার ধূমপায়ীর তুলনায় মোটামুটি অর্ধেক হয়।',

  'rewards.title': 'আপনার দিগন্ত',
  'rewards.body':
    'দিগন্ত তখনই পরিষ্কার হয় যখন আপনি টান পিছিয়ে দেন, শুরুর চেয়ে কম খান, বা একটা ভাবনা শেষ করেন। শুধু অ্যাপ খুললে কখনও নয়।',
  'rewards.stage.haze': 'ধোঁয়াশা',
  'rewards.stage.firstLight': 'প্রথম আলো',
  'rewards.stage.breaking': 'কাটছে',
  'rewards.stage.clear': 'পরিষ্কার',
  'rewards.stage.dawn': 'ভোর',
  'rewards.money': 'জমানো টাকা',
  'rewards.notSmoked': 'যে সিগারেট খাওয়া হয়নি',

  'achievements.title': 'ধাপ',
  'achievements.locked': 'এখনও নয়',
  'achievements.first.title': 'প্রথম টান লেখা হল',
  'achievements.first.body': 'আপনি সেটায় সাড়া না দিয়ে তাকে নাম দিলেন।',
  'achievements.delay5.title': 'পাঁচটা টান সামলানো',
  'achievements.delay5.body': 'এটা আর কাকতালীয় নয়, দক্ষতা।',
  'achievements.day1.title': 'শুরুর চেয়ে কম একটা দিন',
  'achievements.day1.body': 'আপনার নিজের হিসেবেই সাধারণ দিনের চেয়ে কম।',
  'achievements.week1.title': 'এক সপ্তাহের হিসেব',
  'achievements.week1.body': 'সাত দিনের সৎ তথ্য।',
  'achievements.delay25.title': 'পঁচিশবার পিছিয়েছেন',
  'achievements.delay25.body': 'চাওয়া আর করার মাঝের ফাঁকটা এখন অনেক চওড়া।',
  'achievements.halved.title': 'অর্ধেক',
  'achievements.halved.body': 'সাম্প্রতিক গড় আপনার শুরুর অর্ধেক।',

  'notifications.title': 'মনে করানো',
  'notifications.daily': 'রোজকার চেক-ইন',
  'notifications.dailyBody': 'দিনে একবার নরম একটা ডাক। তার বেশি কখনও নয়।',
  'notifications.time': 'সময়',
  'notifications.denied': 'ফোনের সেটিংসে এই অ্যাপের নোটিফিকেশন বন্ধ আছে।',
  'notifications.body': 'একটু দেখুন, আজকের দিনটা কেমন গেল।',

  'profile.title': 'আপনি',
  'profile.guest': 'শুধু এই ফোনে',
  'profile.entries': '{n}টা এন্ট্রি লেখা হয়েছে',
  'profile.since': '{date} থেকে',

  'settings.title': 'সেটিংস',
  'settings.language': 'ভাষা',
  'settings.coachStyle': 'কোচের ধরন',
  'settings.price': 'সিগারেটের দাম',
  'settings.appLock': 'বায়োমেট্রিক দিয়ে খুলুন',
  'settings.appLockBody': 'অ্যাপ খোলার আগে আঙুলের ছাপ বা মুখ চাইবে।',
  'settings.notifications': 'মনে করানো',
  'settings.goals': 'লক্ষ্য',
  'settings.health': 'শরীরের যাত্রা',
  'settings.aiMemory': 'AI-এর স্মৃতি',
  'settings.privacy': 'গোপনীয়তা',
  'settings.backup': 'তথ্য রপ্তানি',
  'settings.help': 'সাহায্য',
  'settings.about': 'পরিচিতি',
  'settings.signOut': 'সাইন আউট',
  'settings.deleteAccount': 'অ্যাকাউন্ট মুছুন',
  'settings.version': 'ভার্সন {v}',

  'aiMemory.title': 'AI-এর স্মৃতি',
  'aiMemory.body':
    'কথোপকথনের ফাঁকে কোচ আপনার সম্পর্কে শুধু এটুকুই মনে রাখে। আপনার মেসেজ কখনও সার্ভারে রাখা হয় না।',
  'aiMemory.triggers': 'যেসব কারণ সে খেয়াল করেছে',
  'aiMemory.interventions': 'আপনার জন্য যা কাজে দিয়েছে',
  'aiMemory.style': 'আপনার বেছে নেওয়া ধরন',
  'aiMemory.empty': 'এখনও কিছু মনে রাখা হয়নি।',
  'aiMemory.clear': 'সব ভুলে যাক',
  'aiMemory.cleared': 'মুছে গেছে।',

  'privacy.title': 'গোপনীয়তা',
  'privacy.stored': 'কী রাখা হয়',
  'privacy.storedBody':
    'আপনার সিগারেট আর টানের এন্ট্রি, আপনার লক্ষ্য আর দাম। ফোনে সবসময়; অ্যাকাউন্টে শুধু সাইন ইন করলে।',
  'privacy.notStored': 'কী রাখা হয় না',
  'privacy.notStoredBody':
    'কোচের সঙ্গে আপনার কথা। শুধু ছোট একটা সারসংক্ষেপ রাখা হয় যে কী আপনাকে সাহায্য করে, আর সেটা AI স্মৃতির স্ক্রিন থেকে মুছে ফেলতে পারেন।',
  'privacy.keys': 'AI সম্পর্কে',
  'privacy.keysBody':
    'কোচের উত্তর আমাদের নিজস্ব সার্ভারে তৈরি হয়, তাই কোনও AI চাবি কখনও অ্যাপের ভিতরে যায় না। মেসেজ শুধু উত্তর তৈরির জন্য পাঠানো হয়, পরে রাখা হয় না।',
  'privacy.rights': 'তথ্য আপনারই',
  'privacy.rightsBody':
    'যখন খুশি রপ্তানি করুন বা মুছে ফেলুন। অ্যাকাউন্ট মুছলে আপনার প্রতিটি সারি মুছে যায়। আপনার তথ্য কখনও বিক্রি করা হয় না।',

  'backup.title': 'তথ্য রপ্তানি',
  'backup.body': 'আপনার লেখা সবকিছু, একটা JSON ফাইলে।',
  'backup.export': 'রপ্তানি করুন',
  'backup.exported': '{n}টা রেকর্ড রপ্তানি হয়েছে।',

  'help.title': 'সাহায্য',
  'help.q1': 'ইন্টারনেট ছাড়া কি চলে?',
  'help.a1':
    'হ্যাঁ। এন্ট্রি, টাইমার আর পরামর্শ সবই ফোনে চলে। শুধু AI কোচের নেটওয়ার্ক লাগে, আর সেটা না থাকলে সে আপনার নিজের ধরন থেকেই উত্তর দেয়।',
  'help.q2': 'এত অল্প সময় অপেক্ষা করতে বলে কেন?',
  'help.a2':
    'কারণ ছোট একটা সময় যা আপনি জিতবেন, সেটা বড় একটার চেয়ে ভালো যা মাঝপথে ছেড়ে দেবেন। আপনার ব্যবধান বাড়লে এটাও বাড়ে।',
  'help.q3': 'সিগারেট লিখলে কী হয়?',
  'help.a3': 'একটা সংখ্যা বদলায়। আর কিছু না। এটা তথ্য, রায় নয়।',
  'help.q4': 'কাউকে কি জানিয়ে দেবে?',
  'help.a4': 'না। কিছুই কারও সঙ্গে ভাগ করা হয় না।',
  'help.contact': 'আরও কিছু? আমাদের লিখুন।',

  'about.title': 'পরিচিতি',
  'about.body':
    'SmokeLess AI কমিয়ে আনার পথে একটা শান্ত সঙ্গী — এই বিশ্বাসে তৈরি যে টানকে বোঝা তার সঙ্গে লড়ার চেয়ে ভালো।',
  'about.credit': 'একটি Biswodip Goj প্রোডাক্ট।',
  'about.version': 'ভার্সন {v}',

  'delete.title': 'আপনার অ্যাকাউন্ট মুছুন',
  'delete.warning':
    'এতে আপনার প্রোফাইল, প্রতিটি এন্ট্রি, প্রতিটি দাম আর কোচের সব স্মৃতি মুছে যাবে। এটা আর ফেরানো যাবে না।',
  'delete.confirmPrompt': 'নিশ্চিত করতে DELETE লিখুন।',
  'delete.confirmWord': 'DELETE',
  'delete.cta': 'সবকিছু মুছুন',
  'delete.localOnly': 'এই ফোনের সব তথ্য মুছুন',

  'crisis.title': 'সিগারেটের কথা একটু থাক।',
  'crisis.body':
    'আপনি যা লিখলেন সেটা টানের চেয়ে অনেক ভারী শোনাচ্ছে, আর সেটাই বেশি জরুরি। এখনই এমন কারও সঙ্গে কথা বলুন যিনি সত্যিই পাশে থাকতে পারেন — আপনার কাছের কেউ, বা আপনার দেশের হেল্পলাইন। আপনার সত্যিকারের সহায়তা প্রাপ্য, কোনও অ্যাপের উত্তর নয়।',

  'error.generic': 'এটা হল না। আবার চেষ্টা করুন।',
};

export default bn;
