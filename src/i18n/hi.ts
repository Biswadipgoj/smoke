// src/i18n/hi.ts
//
// §17 — a solid starting translation, not a final one. Register aimed at
// everyday spoken Hindi rather than formal written Hindi: this app talks to
// someone mid-craving, so warmth beats correctness of register.
//
// Needs native-speaker review before release — see SETUP.md, "Going to
// production".

import type { Dictionary } from './index';

const hi: Dictionary = {
  'common.continue': 'आगे बढ़ें',
  'common.back': 'पीछे',
  'common.skip': 'छोड़ें',
  'common.save': 'सहेजें',
  'common.cancel': 'रहने दें',
  'common.notNow': 'अभी नहीं',
  'common.loading': 'तैयार हो रहा है',

  'welcome.title': 'धुँध धीरे-धीरे छँटती है।',
  'welcome.body':
    'SmokeLess AI आपकी तलब को समझने, हर बार थोड़ा और रुकने, और इसी वजह से कम पीने में मदद करता है। यहाँ कोई आपको जज नहीं करेगा।',
  'welcome.cta': 'शुरू करें',

  'language.title': 'अपनी भाषा चुनें',
  'language.body': 'इसे बाद में सेटिंग्स में बदल सकते हैं।',

  'onboarding.baseline.title': 'आम दिन में कितनी सिगरेट?',
  'onboarding.baseline.body':
    'अंदाज़ा ही काफ़ी है। यह सिर्फ़ एक शुरुआती लकीर है जिससे तुलना होगी — कोई नंबर नहीं जो आपको आँके।',
  'onboarding.goal.title': 'आप किस दिशा में जाना चाहते हैं?',
  'onboarding.goal.reduce': 'कम करना है',
  'onboarding.goal.reduceBody': 'अपनी रफ़्तार से, धीरे-धीरे गिनती नीचे लाएँ।',
  'onboarding.goal.quit': 'पूरी तरह छोड़ना है',
  'onboarding.goal.quitBody': 'एक तारीख़ तय करें और उस पर टिके रहें।',
  'onboarding.target.title': 'एक बेहतर दिन कैसा दिखेगा?',
  'onboarding.target.body': 'ऐसा नंबर चुनें जो इस महीने सच में मुमकिन हो।',
  'onboarding.quitDate.title': 'कब छोड़ना चाहेंगे?',
  'onboarding.quitDate.body': 'ज़रूरत पड़े तो यह तारीख़ कभी भी आगे बढ़ा सकते हैं।',
  'onboarding.price.title': 'एक पैकेट कितने का पड़ता है?',
  'onboarding.price.body':
    'बचाए गए पैसों के हिसाब के लिए। दाम बदले तो नया जोड़ दें — पुरानी एंट्री पुराने दाम पर ही रहेंगी।',
  'onboarding.price.pricePerPack': 'एक पैकेट का दाम',
  'onboarding.price.perPack': 'एक पैकेट में सिगरेट',
  'onboarding.style.title': 'कोच आपसे कैसे बात करे?',
  'onboarding.style.body': 'कोच वही रहेगा, बस लहजा बदलेगा। कभी भी बदल सकते हैं।',
  'quitDate.today': 'आज',
  'quitDate.week': 'एक हफ़्ते में',
  'quitDate.month': 'एक महीने में',
  'quitDate.later': 'अभी नहीं — बाद में चुनूँगा',

  'onboarding.finish.title': 'बस इतना ही।',
  'onboarding.finish.body':
    'तलब उठते ही उसे दर्ज कर दें — बाक़ी ऐप सँभाल लेगा, बिना नेटवर्क के भी।',

  'style.calm': 'शांत',
  'style.calm.desc': 'बिना जल्दबाज़ी, धीमा, कभी दबाव नहीं।',
  'style.direct': 'सीधा',
  'style.direct.desc': 'छोटा और साफ़। कोई लंबी बात नहीं।',
  'style.scientific': 'वैज्ञानिक',
  'style.scientific.desc': 'बताता है कि शरीर में हो क्या रहा है।',
  'style.encouraging': 'हौसला देने वाला',
  'style.encouraging.desc': 'गर्मजोशी से, छोटी जीत भी नोट करता है।',
  'style.minimal': 'कम से कम',
  'style.minimal.desc': 'एक-दो लाइन, उससे ज़्यादा नहीं।',

  'auth.title': 'अपना रिकॉर्ड सुरक्षित रखें',
  'auth.body':
    'साइन इन करें ताकि फ़ोन खोने पर भी आपका डेटा बचा रहे। बिना अकाउंट के भी चला सकते हैं।',
  'auth.email': 'ईमेल',
  'auth.password': 'पासवर्ड',
  'auth.signIn': 'साइन इन',
  'auth.signUp': 'अकाउंट बनाएँ',
  'auth.magicLink': 'मुझे साइन-इन लिंक भेजें',
  'auth.magicLinkSent': 'लिंक के लिए अपना ईमेल देखें।',
  'auth.continueOffline': 'बिना अकाउंट के चलाएँ',
  'auth.notConfigured': 'अभी कोई सर्वर सेट नहीं है, इसलिए ऐप पूरी तरह फ़ोन पर ही चल रहा है।',
  'auth.haveAccount': 'पहले से अकाउंट है? साइन इन करें',
  'auth.needAccount': 'नए हैं? अकाउंट बनाएँ',

  'tabs.dashboard': 'होम',
  'tabs.coach': 'कोच',
  'tabs.analytics': 'पैटर्न',
  'tabs.profile': 'आप',

  'dashboard.sinceLast': 'पिछली सिगरेट को हुए',
  'dashboard.never': 'अभी कोई सिगरेट दर्ज नहीं',
  'dashboard.today': 'आज',
  'dashboard.cigarettes': 'पी गईं',
  'dashboard.cravings': 'तलब',
  'dashboard.delayed': 'टाली गईं',
  'dashboard.saved': 'बची रकम',
  'dashboard.cravingCta': 'तलब हो रही है',
  'dashboard.logCta': 'एक पी ली',
  'dashboard.coachTitle': 'आपका कोच',

  'craving.trigger.title': 'इसके पीछे क्या है?',
  'craving.trigger.body': 'एक टैप। यही ऐप को आपका पैटर्न सिखाता है।',
  'craving.intensity.title': 'कितनी तेज़ है?',
  'craving.intensity.1': 'हल्की-सी',
  'craving.intensity.2': 'महसूस हो रही है',
  'craving.intensity.3': 'खींच रही है',
  'craving.intensity.4': 'रुकना मुश्किल है',
  'craving.intensity.5': 'बहुत ज़्यादा',
  'craving.plan.title': 'पहले यह आज़माएँ',
  'craving.plan.ask': '{n} मिनट रुकें',
  'craving.plan.start': 'शुरू करें',
  'craving.plan.why': 'इतनी देर क्यों?',
  'craving.timer.body': 'तलब ख़ुद ही चढ़ती है और ख़ुद ही उतरती है। बस इतना निकालना है।',
  'craving.timer.remaining': 'बाक़ी',
  'craving.madeIt': 'मैंने रोक लिया',
  'craving.smoked': 'मैंने पी ली',
  'craving.outcome.delayed.title': 'आपने इसे निकाल दिया।',
  'craving.outcome.delayed.body': 'असली हुनर यही है। अगली बार का सुझाव इसी पर बनेगा।',
  'craving.outcome.smoked.title': 'दर्ज हो गया।',
  'craving.outcome.smoked.body':
    'एक सिगरेट सिर्फ़ एक जानकारी है। इससे ऐप को पता चलता है कि आपके लिए कौन-सा वक़्त सबसे मुश्किल है — बस इतना ही।',
  'craving.finish': 'हो गया',

  'trigger.stress': 'तनाव',
  'trigger.boredom': 'बोरियत',
  'trigger.after_food': 'खाने के बाद',
  'trigger.tea_coffee': 'चाय या कॉफ़ी',
  'trigger.work': 'काम',
  'trigger.social': 'लोगों के साथ',
  'trigger.habit': 'बस आदत',
  'trigger.anxiety': 'घबराहट',
  'trigger.alcohol': 'शराब के साथ',
  'trigger.break': 'बाथरूम या ब्रेक',
  'trigger.other': 'कुछ और',

  'intervention.box_breath.title': 'चौकोर साँस',
  'intervention.box_breath.body':
    'चार तक साँस अंदर। चार तक रोकें। चार तक बाहर। चार तक रोकें। छह बार — तेज़ी अपने आप कम हो जाएगी।',
  'intervention.water.title': 'भरा हुआ एक गिलास पानी',
  'intervention.water.body':
    'धीरे-धीरे, पूरा पिएँ। वही हाथ और वही मुँह व्यस्त रहता है — आदत का बड़ा हिस्सा यही है।',
  'intervention.walk.title': 'गली के छोर तक',
  'intervention.walk.body': 'बाहर जाएँ और लौट आएँ। लाइटर वहीं छोड़ दें।',
  'intervention.hands.title': 'हाथों को काम दें',
  'intervention.hands.body':
    'एक पेन, एक सिक्का, एक रबर बैंड। इसका बहुत कुछ बस यही है कि रोज़ के उसी वक़्त हाथ कुछ ढूँढ़ रहे हैं।',
  'intervention.step_out.title': 'एक मिनट के लिए हट जाएँ',
  'intervention.step_out.body':
    'बाथरूम, बालकनी, कहीं भी। जब आप उस माहौल में खड़े न हों, तो अकेले न पीना कहीं आसान होता है।',
  'intervention.name_it.title': 'असल में क्या चाहिए, उसे नाम दें',
  'intervention.name_it.body':
    'थोड़ा आराम? चुप्पी? काम की सोच से छुट्टी? इसे शब्दों में ख़ुद से कहें। अक्सर सिगरेट किसी और चीज़ की जगह ले रही होती है।',
  'intervention.cold.title': 'ठंडा पानी, कलाई और चेहरा',
  'intervention.cold.body':
    'तीस सेकंड ठंडे नल के नीचे। घर के अंदर इससे तेज़ी से शरीर की उथल-पुथल कुछ नहीं तोड़ता।',
  'intervention.message.title': 'किसी एक को मैसेज करें',
  'intervention.message.body':
    'कोई भी, किसी भी बात पर। सिगरेट के बारे में होना ज़रूरी नहीं — बस अगले कुछ मिनट भर जाने चाहिए।',

  'coach.title': 'कोच',
  'coach.placeholder': 'क्या चल रहा है?',
  'coach.send': 'भेजें',
  'coach.empty': 'बताइए क्या हो रहा है, वहीं से शुरू करते हैं।',
  'coach.offline': 'ऑफ़लाइन — आपके अपने पैटर्न से जवाब दे रहे हैं।',
  'coach.disclaimer': 'आम सहारा है, डॉक्टरी सलाह नहीं।',
  'coach.thinking': 'सोच रहे हैं',

  'offline.craving':
    'अभी है, और यह अपने आप उतरेगी — हमेशा उतरती है। टाइमर शुरू करें और इसे बस वो कुछ मिनट दे दें।',
  'offline.smoked':
    'दर्ज हो गया, बस इतना ही। इससे ठीक पहले क्या चल रहा था? असल में जानने लायक बात वही है।',
  'offline.win': 'आपने इसे निकाल दिया। पूरी बात इसी एक हुनर पर टिकी है।',
  'offline.why':
    'तलब कुछ मिनट चढ़ती है और फिर उतर जाती है — चाहे आप पिएँ या न पिएँ। यह इंतज़ार चाहने और उठाने के बीच की दूरी को बड़ा करता है।',
  'offline.low':
    'मुश्किल दिन इस सफ़र का हिस्सा हैं, आपके ख़िलाफ़ सबूत नहीं। आज कुछ बड़ा करने की ज़रूरत नहीं — दर्ज कर देना ही काफ़ी है।',
  'offline.general': 'मैं यहीं हूँ। अभी क्या चल रहा है?',
  'offline.triggerNote': 'आपके लिए सबसे ज़्यादा {trigger} ही सामने आती है।',
  'offline.intervalNote': 'आजकल आपका अंतराल औसतन क़रीब {n} मिनट रहा है।',

  'coachCard.start': 'अगली तलब उठते ही दर्ज कर दें। पहला क़दम बस इतना ही है।',
  'coachCard.longGap': 'क़रीब {n} घंटे हो गए। यह अंतराल सचमुच काम कर रहा है।',
  'coachCard.momentum': 'पिछले दिनों आपने ज़्यादातर तलब रोक ली हैं। यह टिकता है।',
  'coachCard.easier': 'पिछली कुछ मुश्किल रहीं, तो अगली बार कम देर रुकने को कहा जाएगा।',
  'coachCard.underBaseline': 'अब तक आम दिन से कम।',
  'coachCard.trigger': 'सबसे ज़्यादा {trigger} सामने आती है। आज इस पर नज़र रखें।',
  'coachCard.neutral': 'आज जो हो, दर्ज करते जाएँ। पैटर्न इसी से निकलता है।',

  'timeline.title': 'टाइमलाइन',
  'timeline.empty': 'अभी कुछ दर्ज नहीं है।',
  'timeline.today': 'आज',
  'timeline.yesterday': 'कल',
  'timeline.cigarette': 'सिगरेट',
  'timeline.cravingDelayed': 'तलब — रोक ली',
  'timeline.cravingSmoked': 'तलब — पी ली',
  'timeline.cravingOpen': 'तलब',

  'calendar.title': 'कैलेंडर',
  'calendar.legendCigarettes': 'सिगरेट',
  'calendar.legendDelayed': 'टाली गई तलब',
  'calendar.none': 'इस दिन कुछ दर्ज नहीं।',

  'analytics.title': 'पैटर्न',
  'analytics.empty': 'कुछ दिन दर्ज करें, फिर आपके पैटर्न यहाँ दिखेंगे।',
  'analytics.insights': 'क्या बदला',
  'analytics.noInsights': 'अभी इतना डेटा नहीं कि सच्चाई से कुछ कहा जा सके।',
  'analytics.byHour': 'आप कब पीते हैं',
  'analytics.byTrigger': 'कौन-सी बात वजह बनती है',
  'analytics.perDay': 'रोज़ की सिगरेट',
  'analytics.lastWeek': 'पिछले 7 दिन',

  'insight.overall': 'पिछले हफ़्ते के मुक़ाबले आप {n}% कम पी रहे हैं।',
  'insight.partOfDay': 'दो हफ़्ते पहले के मुक़ाबले {part} की सिगरेट {n}% घटी है।',
  'insight.trigger': '{trigger} वाली तलब इस हफ़्ते {n}% कम रही।',
  'insight.delays': 'इस हफ़्ते आपने {n}% तलब रोक लीं — पिछले हफ़्ते से ज़्यादा।',
  'insight.gap': 'इस हफ़्ते बिना सिगरेट का सबसे लंबा अंतराल क़रीब {n} घंटे रहा।',
  'insight.part.morning': 'सुबह',
  'insight.part.afternoon': 'दोपहर',
  'insight.part.evening': 'शाम',
  'insight.part.night': 'देर रात',

  'goals.title': 'लक्ष्य',
  'goals.baseline': 'आपकी शुरुआत',
  'goals.target': 'आपका लक्ष्य',
  'goals.quitDate': 'छोड़ने की तारीख़',
  'goals.current': 'हाल का औसत',
  'goals.edit': 'लक्ष्य बदलें',
  'goals.progress': 'शुरुआत से लक्ष्य तक का {n}% रास्ता तय हुआ।',

  'health.title': 'सेहत का सफ़र',
  'health.disclaimer':
    'यह आम चिकित्सा जानकारी है, आपकी निजी सलाह नहीं — अपनी सेहत के बारे में डॉक्टर से बात करें।',
  'health.reached': 'पहुँच गए',
  'health.20min': '20 मिनट',
  'health.20min.body': 'दिल की धड़कन और ब्लड प्रेशर नीचे आने लगते हैं।',
  'health.12hr': '12 घंटे',
  'health.12hr.body': 'ख़ून में कार्बन मोनोऑक्साइड सामान्य स्तर पर आ जाती है।',
  'health.2wk': '2 हफ़्ते से 3 महीने',
  'health.2wk.body': 'ख़ून का बहाव और फेफड़ों की काम करने की क्षमता बेहतर होती है।',
  'health.1yr': '1 साल',
  'health.1yr.body': 'दिल की बीमारी का ख़तरा एक स्मोकर के मुक़ाबले लगभग आधा रह जाता है।',
  'health.5yr': '5 साल',
  'health.5yr.body': 'स्ट्रोक का ख़तरा घटता है।',
  'health.10yr': '10 साल',
  'health.10yr.body': 'फेफड़ों के कैंसर से मौत का ख़तरा एक स्मोकर के मुक़ाबले लगभग आधा रह जाता है।',

  'rewards.title': 'आपका क्षितिज',
  'rewards.body':
    'क्षितिज तब साफ़ होता है जब आप तलब टालते हैं, अपनी शुरुआत से कम पीते हैं, या कोई चिंतन पूरा करते हैं। ऐप खोलने भर से कभी नहीं।',
  'rewards.stage.haze': 'धुँध',
  'rewards.stage.firstLight': 'पहली किरण',
  'rewards.stage.breaking': 'छँटती हुई',
  'rewards.stage.clear': 'साफ़',
  'rewards.stage.dawn': 'भोर',
  'rewards.money': 'बची रकम',
  'rewards.notSmoked': 'जो सिगरेट नहीं पी गईं',

  'achievements.title': 'पड़ाव',
  'achievements.locked': 'अभी नहीं',
  'achievements.first.title': 'पहली तलब दर्ज',
  'achievements.first.body': 'आपने उस पर अमल करने के बजाय उसे नाम दिया।',
  'achievements.delay5.title': 'पाँच तलब रोकीं',
  'achievements.delay5.body': 'अब यह इत्तेफ़ाक़ नहीं, हुनर है।',
  'achievements.day1.title': 'शुरुआत से कम का एक दिन',
  'achievements.day1.body': 'आपकी अपनी गिनती के हिसाब से आम दिन से कम।',
  'achievements.week1.title': 'एक हफ़्ते का रिकॉर्ड',
  'achievements.week1.body': 'सात दिन का ईमानदार डेटा।',
  'achievements.delay25.title': 'पच्चीस बार टाला',
  'achievements.delay25.body': 'चाहने और करने के बीच की दूरी अब ज़्यादा है।',
  'achievements.halved.title': 'आधा',
  'achievements.halved.body': 'हाल का औसत आपकी शुरुआत का आधा है।',

  'notifications.title': 'याद दिलाना',
  'notifications.daily': 'रोज़ का चेक-इन',
  'notifications.dailyBody': 'दिन में एक हल्का इशारा। इससे ज़्यादा कभी नहीं।',
  'notifications.time': 'समय',
  'notifications.denied': 'फ़ोन की सेटिंग्स में इस ऐप के नोटिफ़िकेशन बंद हैं।',
  'notifications.body': 'ज़रा देखें, आज कैसा रहा।',

  'profile.title': 'आप',
  'profile.guest': 'सिर्फ़ इस फ़ोन पर',
  'profile.entries': '{n} एंट्री दर्ज',
  'profile.since': '{date} से',

  'settings.title': 'सेटिंग्स',
  'settings.language': 'भाषा',
  'settings.coachStyle': 'कोच का लहजा',
  'settings.price': 'सिगरेट का दाम',
  'settings.appLock': 'बायोमेट्रिक से खोलें',
  'settings.appLockBody': 'ऐप खोलने से पहले फ़िंगरप्रिंट या चेहरा माँगे।',
  'settings.notifications': 'याद दिलाना',
  'settings.goals': 'लक्ष्य',
  'settings.health': 'सेहत का सफ़र',
  'settings.aiMemory': 'AI की याद',
  'settings.privacy': 'निजता',
  'settings.backup': 'डेटा निकालें',
  'settings.help': 'मदद',
  'settings.about': 'परिचय',
  'settings.signOut': 'साइन आउट',
  'settings.deleteAccount': 'अकाउंट हटाएँ',
  'settings.version': 'वर्ज़न {v}',

  'aiMemory.title': 'AI की याद',
  'aiMemory.body':
    'कोच बातचीत के बीच आपके बारे में बस इतना याद रखता है। आपके मैसेज कभी सर्वर पर नहीं रखे जाते।',
  'aiMemory.triggers': 'जो वजहें उसने देखीं',
  'aiMemory.interventions': 'आपके लिए क्या काम आया',
  'aiMemory.style': 'आपका चुना लहजा',
  'aiMemory.empty': 'अभी कुछ याद नहीं।',
  'aiMemory.clear': 'यह सब भुला दें',
  'aiMemory.cleared': 'मिटा दिया।',

  'privacy.title': 'निजता',
  'privacy.stored': 'क्या सहेजा जाता है',
  'privacy.storedBody':
    'आपकी सिगरेट और तलब की एंट्री, आपका लक्ष्य और दाम। फ़ोन पर हमेशा; अकाउंट पर सिर्फ़ तब जब आप साइन इन करें।',
  'privacy.notStored': 'क्या नहीं सहेजा जाता',
  'privacy.notStoredBody':
    'कोच से आपकी बातचीत। सिर्फ़ एक छोटा-सा सार रखा जाता है कि आपको क्या मदद करता है, और उसे आप AI याद वाली स्क्रीन से हटा सकते हैं।',
  'privacy.keys': 'AI के बारे में',
  'privacy.keysBody':
    'कोच के जवाब हमारे अपने सर्वर पर बनते हैं, इसलिए कोई AI की चाबी कभी ऐप के अंदर नहीं जाती। मैसेज सिर्फ़ जवाब बनाने के लिए भेजे जाते हैं, बाद में रखे नहीं जाते।',
  'privacy.rights': 'डेटा आपका है',
  'privacy.rightsBody':
    'जब चाहें निकालें या मिटाएँ। अकाउंट हटाने पर आपकी हर एंट्री हट जाती है। आपका डेटा कभी बेचा नहीं जाता।',

  'backup.title': 'डेटा निकालें',
  'backup.body': 'आपका दर्ज किया सब कुछ, एक JSON फ़ाइल में।',
  'backup.export': 'निकालें',
  'backup.exported': '{n} रिकॉर्ड निकाले गए।',

  'help.title': 'मदद',
  'help.q1': 'क्या यह बिना इंटरनेट चलता है?',
  'help.a1':
    'हाँ। एंट्री, टाइमर और सुझाव सब फ़ोन पर ही चलते हैं। सिर्फ़ AI कोच को नेटवर्क चाहिए, और वह न हो तो वह आपके अपने पैटर्न से जवाब देता है।',
  'help.q2': 'इतना कम रुकने को क्यों कहता है?',
  'help.a2':
    'क्योंकि छोटी अवधि जो आप जीत जाएँ, वह लंबी अवधि से बेहतर है जिसे आप बीच में छोड़ दें। जैसे-जैसे आपका अंतराल बढ़ेगा, यह भी बढ़ेगा।',
  'help.q3': 'सिगरेट दर्ज करने पर क्या होता है?',
  'help.a3': 'बस एक नंबर बदलता है। और कुछ नहीं। यह जानकारी है, फ़ैसला नहीं।',
  'help.q4': 'क्या यह किसी को बताएगा?',
  'help.a4': 'नहीं। कुछ भी किसी के साथ साझा नहीं होता।',
  'help.contact': 'और कुछ पूछना है? हमें लिखें।',

  'about.title': 'परिचय',
  'about.body':
    'SmokeLess AI कम करने की राह का एक शांत साथी है — इस भरोसे पर बना कि तलब को समझना, उससे लड़ने से बेहतर है।',
  'about.credit': 'एक Biswodip Goj प्रोडक्ट।',
  'about.version': 'वर्ज़न {v}',

  'delete.title': 'अपना अकाउंट हटाएँ',
  'delete.warning':
    'इससे आपकी प्रोफ़ाइल, हर एंट्री, हर दाम और कोच की हर याद हट जाएगी। यह वापस नहीं आएगा।',
  'delete.confirmPrompt': 'पक्का करने के लिए DELETE लिखें।',
  'delete.confirmWord': 'DELETE',
  'delete.cta': 'सब कुछ हटाएँ',
  'delete.localOnly': 'इस फ़ोन का सारा डेटा मिटाएँ',

  'crisis.title': 'सिगरेट की बात एक पल के लिए रोकते हैं।',
  'crisis.body':
    'आपने जो लिखा वह तलब से कहीं भारी लग रहा है, और वह ज़्यादा ज़रूरी है। कृपया अभी किसी ऐसे इंसान से बात करें जो सचमुच मदद कर सके — कोई अपना, या आपके देश की हेल्पलाइन। आपको असली सहारा मिलना चाहिए, किसी ऐप का जवाब नहीं।',

  'error.generic': 'यह नहीं हो पाया। फिर कोशिश करें।',
};

export default hi;
