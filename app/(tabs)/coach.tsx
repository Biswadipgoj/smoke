// app/(tabs)/coach.tsx — AI Coach v3 (Robust Reanimated)
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInRight, SlideInLeft, FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import { useAppStore, ChatMessage, computeCurrentStreak, computeMoneySaved } from '../../src/store/useAppStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useTheme } from '../../src/hooks/useTheme';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../../src/constants/theme';

// ── Crisis detection ───────────────────────────────────────────────────
const CRISIS_KEYWORDS = [
  'kill myself', 'end my life', 'suicid', 'want to die', 'harm myself',
  'self harm', 'hurt myself', 'not worth living', 'खुद को मारना', 'जीवन समाप्त', 'আত্মহত্যা',
];
function isCrisis(text: string): boolean {
  return CRISIS_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));
}

// ── Smart response engine (context + stats aware) ─────────────────────
type CoachContext = {
  cigsToday: number;
  baseline: number;
  streak: number;
  moneySaved: number;
  currency: string;
  minutesSinceLast: number;
  totalLogs: number;
  delaySessions: number;
  hour: number;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSmartResponse(userMsg: string, ctx: CoachContext): string {
  const lower = userMsg.toLowerCase();

  if (/crav|urge|need.*(smoke|cig)|तलब|আকাঙ্ক্ষা|want.*(smoke|cig)/i.test(lower)) {
    return pickRandom([
      `This craving will pass — they typically peak at 3 minutes then fade. You've already resisted ${ctx.delaySessions} times. Try the breathing exercise from the home screen. I believe in you.`,
      `Your body is sending a signal, but you don't have to obey it. Try drinking cold water, taking 5 deep breaths, or stepping outside. The urge will weaken in minutes. You've got this.`,
      `I know it feels intense right now, but remember: you've already gone ${ctx.minutesSinceLast > 60 ? Math.floor(ctx.minutesSinceLast / 60) + ' hours' : Math.round(ctx.minutesSinceLast) + ' minutes'} since your last one. That's real strength.`,
    ]);
  }

  if (/slip|smoked|failed|gave.in|relapse|couldn.t.resist|पी.*लिया|সিগারেট.*খেলাম/i.test(lower)) {
    return pickRandom([
      `Thank you for being honest — that takes courage. A slip is data, not a failure. You've still saved ${ctx.currency}${ctx.moneySaved.toFixed(0)} and learned something about your triggers. What was happening when it happened?`,
      `One cigarette doesn't erase your progress. Most people who successfully quit slip multiple times first. Your ${ctx.streak > 0 ? ctx.streak + '-day streak' : 'tracking habit'} shows real commitment. What can we learn from this moment?`,
      `No judgment here — just curiosity. Was it stress, social pressure, boredom, or something else? Understanding the trigger is more valuable than guilt will ever be.`,
    ]);
  }

  if (/stress|anxious|anxiety|overwhelm|can.t.cope|worried|तनाव|চাপ|nervous/i.test(lower)) {
    return pickRandom([
      `Stress and smoking are deeply linked, and breaking that link takes time. Try this: name 3 things you can see, 2 you can hear, 1 you can feel. This grounds you in the present. What's stressing you?`,
      `When stress peaks, your brain reaches for the familiar — that's normal, not weakness. Even a 2-minute pause to breathe can interrupt the automatic chain. You've already built ${ctx.delaySessions} delay sessions — you know how to pause.`,
      `Your feelings are valid. Stress doesn't mean you need a cigarette — it means you need support. I'm here. What would help most right now: talking it through, a breathing exercise, or just being heard?`,
    ]);
  }

  if (/progress|how.am.i|doing|stats|improve|better|प्रगति|অগ্রগতি|how.*(going|do)/i.test(lower)) {
    let msg = `Here's where you stand:\n\n`;
    msg += `📊 Today: ${ctx.cigsToday}/${ctx.baseline} (${Math.max(0, Math.round((1 - ctx.cigsToday / ctx.baseline) * 100))}% below baseline)\n`;
    msg += `💰 Saved: ${ctx.currency}${ctx.moneySaved.toFixed(0)}\n`;
    msg += `🔥 Current streak: ${ctx.streak} days\n`;
    msg += `📝 Total entries: ${ctx.totalLogs}\n\n`;
    msg += ctx.cigsToday < ctx.baseline
      ? `You're below your baseline today — that's genuine progress. Every reduction counts.`
      : `Today's been tough, and that's okay. Tomorrow is a fresh start, and your overall trend matters more than any single day.`;
    return msg;
  }

  if (/money|cost|save|expense|पैसे|অর্থ|afford|budget/i.test(lower)) {
    return `You've saved ${ctx.currency}${ctx.moneySaved.toFixed(0)} so far. At your current rate, that projects to ${ctx.currency}${(ctx.moneySaved / Math.max(1, ctx.totalLogs) * 365).toFixed(0)} per year. That's real money — think about what you could do with it. What would you spend those savings on?`;
  }

  if (/quit|stop|give.up|छोड़|ছেড়ে|cold.turkey|forever/i.test(lower)) {
    return `Whether you want to quit completely or reduce gradually — both are valid paths. Research shows gradual reduction can be just as effective as cold turkey for many people. You've already logged ${ctx.totalLogs} entries, which means you're building self-awareness. What feels right for you?`;
  }

  if (/morning|wake.up|first.thing|सुबह|সকাল/i.test(lower)) {
    return `Morning cigarettes are often the hardest to skip because nicotine levels are lowest after sleep. Try this: drink a big glass of water first, then do something physical for 5 minutes — even just stretching. The craving often passes by then. What's your morning routine like?`;
  }

  if (/friend|party|social|drink|bar|people|दोस्त|বন্ধু|peer/i.test(lower)) {
    return `Social smoking is one of the trickiest triggers because it's tied to connection and belonging. Some strategies: hold a drink in your smoking hand, step away briefly when others light up, or tell one trusted friend about your goal. You don't have to announce it to everyone — just having one ally helps. What's the situation?`;
  }

  if (/bore|nothing.to.do|empty|waiting|ऊब|একঘেয়ে/i.test(lower)) {
    return `Boredom smoking is really about your hands and mouth needing something to do. Try keeping a stress ball, chewing gum, or even just scrolling through your progress stats here. Your brain will eventually learn new boredom responses. What usually triggers boredom for you?`;
  }

  if (/motivat|inspire|encourage|why.bother|point|worth|प्रेरणा|অনুপ্রেরণা|help.me/i.test(lower)) {
    return pickRandom([
      `After 20 minutes without a cigarette, your heart rate drops. After 12 hours, carbon monoxide in your blood normalizes. After 1 year, your heart disease risk is HALF that of a smoker. Your body is healing right now.`,
      `Think about why you started tracking. Was it for your health? Your family? Your wallet? That reason is still there, and it's still valid. You've already proven you can do this — you've been ${ctx.streak > 0 ? `on a ${ctx.streak}-day streak` : 'tracking honestly'}.`,
      `Every cigarette you DON'T smoke is a gift to your future self. You've already saved ${ctx.currency}${ctx.moneySaved.toFixed(0)}. That's not nothing — that's real, tangible change you created.`,
    ]);
  }

  if (/^(hi|hello|hey|sup|yo|नमस্তে|হাই|namaste)/i.test(lower)) {
    const h = ctx.hour;
    const timeGreet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return `${timeGreet}! 🌿 I'm your coach — here to support you without judgment. ${ctx.cigsToday === 0 ? "You haven't smoked today — that's amazing!" : `You've had ${ctx.cigsToday} today, ${ctx.cigsToday < ctx.baseline ? "which is below your baseline. Great work!" : "and every honest log helps."}`} What's on your mind?`;
  }

  if (/thank|appreciate|grateful|धन्यवाद|ধন্যবাদ/i.test(lower)) {
    return `You're welcome 💙 I'm always here whenever you need to talk, vent, or just check in. No pressure, no deadlines — this is your journey at your pace.`;
  }

  return pickRandom([
    `I hear you. Tell me more about what's going on — I'm here to listen without judgment. Whatever you're feeling is valid.`,
    `Thank you for sharing that. You're already doing something powerful just by being aware and talking about it. What would feel most helpful right now?`,
    `I'm here, and I'm listening. Remember: ${ctx.cigsToday < ctx.baseline ? `you're below your baseline today, and that's worth celebrating.` : `tracking honestly takes courage, and you're doing exactly that.`} What's on your mind?`,
    `Every conversation we have is a step forward. You've logged ${ctx.totalLogs} entries — that's serious commitment. How can I help you right now?`,
  ]);
}

// ── Typing Indicator Component ──
const TypingIndicator = ({ colors }: { colors: any }) => {
  return (
    <Animated.View entering={SlideInLeft.springify().damping(12)} layout={Layout.springify()} style={[styles.messageBubble, styles.coachBubble]}>
      <Text style={styles.coachAvatar}>🌿</Text>
      <View style={[styles.bubbleContent, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, borderWidth: 1, flexDirection: 'row', gap: 4, height: 42, alignItems: 'center' }]}>
        <Animated.View entering={ZoomIn.duration(300).delay(0)} style={[styles.typingDot, { backgroundColor: Colors.primary }]} />
        <Animated.View entering={ZoomIn.duration(300).delay(150)} style={[styles.typingDot, { backgroundColor: Colors.primary }]} />
        <Animated.View entering={ZoomIn.duration(300).delay(300)} style={[styles.typingDot, { backgroundColor: Colors.primary }]} />
      </View>
    </Animated.View>
  );
};


export default function CoachScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { chatHistory, addChatMessage, profile, logs, delaySessions } = useAppStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const quickPrompts = [
    "I'm craving right now",
    "How am I doing?",
    "I need motivation",
    "I slipped up",
    "Help me with stress",
    "I'm bored",
  ];

  const ctx = useMemo((): CoachContext => {
    if (!profile) return { cigsToday: 0, baseline: 10, streak: 0, moneySaved: 0, currency: '₹', minutesSinceLast: 0, totalLogs: 0, delaySessions: 0, hour: new Date().getHours() };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cigsToday = logs.filter(l => l.type === 'cigarette' && new Date(l.timestamp).getTime() >= today.getTime()).length;
    const lastCig = logs.filter(l => l.type === 'cigarette').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const minutesSinceLast = lastCig ? (Date.now() - new Date(lastCig.timestamp).getTime()) / 60000 : 9999;
    const money = computeMoneySaved(logs, profile);
    return {
      cigsToday, baseline: profile.dailyBaseline, streak: computeCurrentStreak(logs),
      moneySaved: money.total, currency: profile.currency, minutesSinceLast,
      totalLogs: logs.length, delaySessions: delaySessions.length, hour: new Date().getHours(),
    };
  }, [profile, logs, delaySessions]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    if (isCrisis(trimmed)) {
      setTimeout(() => {
        addChatMessage({
          id: `msg_${Date.now()}_crisis`,
          role: 'coach',
          content: `${t.coachCrisisMsg}\n\n${t.coachCrisisResources}`,
          timestamp: new Date().toISOString(),
        });
        setIsTyping(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }, 800);
      return;
    }

    const delay = 1200 + Math.random() * 1000;
    setTimeout(() => {
      const response = getSmartResponse(trimmed, ctx);
      addChatMessage({
        id: `msg_${Date.now()}_coach`,
        role: 'coach',
        content: response,
        timestamp: new Date().toISOString(),
      });
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, delay);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>🌿 {t.coachTitle}</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {chatHistory.length === 0 && (
              <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🤝</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Personal Coach</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  I know your stats, your triggers, and your progress. I'm here to help, not judge. Try a prompt below or tell me what's on your mind.
                </Text>
              </Animated.View>
            )}

            {chatHistory.map((msg, idx) => (
              <Animated.View
                key={msg.id}
                entering={msg.role === 'user' ? SlideInRight.springify().damping(15) : SlideInLeft.springify().damping(15)}
                layout={Layout.springify()}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.coachBubble,
                ]}
              >
                {msg.role === 'coach' && <Text style={styles.coachAvatar}>🌿</Text>}
                <View style={[
                  styles.bubbleContent,
                  msg.role === 'user'
                    ? { backgroundColor: Colors.primary }
                    : { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, borderWidth: 1 },
                ]}>
                  <Text style={[
                    styles.bubbleText,
                    msg.role === 'user' ? { color: Colors.bgDark } : { color: colors.text },
                  ]}>{msg.content}</Text>
                  <Text style={[styles.bubbleTime, { color: msg.role === 'user' ? `${Colors.bgDark}88` : colors.textMuted }]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </Animated.View>
            ))}

            {isTyping && <TypingIndicator colors={colors} />}
          </ScrollView>

          {/* Quick prompts */}
          <View style={styles.quickScrollContainerWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickScrollContainer}
              contentContainerStyle={styles.quickScrollContent}
            >
              {quickPrompts.map((prompt, i) => (
                <Animated.View key={i} entering={FadeInDown.duration(400).delay(200 + i * 50)}>
                  <TouchableOpacity
                    style={[styles.quickPrompt, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder }]}
                    onPress={() => sendMessage(prompt)}
                    disabled={isTyping}
                  >
                    <Text style={[styles.quickPromptText, { color: colors.textSecondary }]}>{prompt}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Input */}
          <Animated.View entering={SlideInDown.duration(500)} style={[styles.inputRow, { backgroundColor: colors.bgCard, borderTopColor: colors.glassBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={t.coachInputPlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },

  chatList: { flex: 1 },
  chatContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, marginBottom: Spacing.sm },
  emptySubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, textAlign: 'center', lineHeight: FontSize.base * 1.6, paddingHorizontal: Spacing.lg },

  messageBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  userBubble: { justifyContent: 'flex-end', flexDirection: 'row-reverse' },
  coachBubble: { justifyContent: 'flex-start' },
  coachAvatar: { fontSize: 22, marginBottom: 4 },
  bubbleContent: { maxWidth: '80%', borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  bubbleText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: FontSize.base * 1.6 },
  bubbleTime: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, alignSelf: 'flex-end' },
  typingDot: { width: 8, height: 8, borderRadius: 4 },

  quickScrollContainerWrapper: { maxHeight: 52 },
  quickScrollContainer: { flexGrow: 0 },
  quickScrollContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, gap: Spacing.sm },
  quickPrompt: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, flexShrink: 0 },
  quickPromptText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, flexShrink: 0 },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, gap: Spacing.sm },
  input: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, maxHeight: 100, paddingVertical: Spacing.sm },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: Colors.bgDark, fontFamily: FontFamily.bold, fontSize: FontSize.md },
});
