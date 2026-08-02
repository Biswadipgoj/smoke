// app/(tabs)/coach.tsx — AI Coach v4 (Real Gemini API)
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

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ── Crisis detection ───────────────────────────────────────────────────
const CRISIS_KEYWORDS = [
  'kill myself', 'end my life', 'suicid', 'want to die', 'harm myself',
  'self harm', 'hurt myself', 'not worth living', 'खुद को मारना', 'जीवन समाप्त', 'আত্মহত্যা',
];
function isCrisis(text: string): boolean {
  return CRISIS_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));
}

// ── Real Gemini AI Engine ──────────────────────────────────────────────
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

async function fetchGeminiResponse(userMsg: string, ctx: CoachContext, history: ChatMessage[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "API Key is missing. Please add EXPO_PUBLIC_GEMINI_API_KEY to your environment.";
  }

  const systemPrompt = `You are a warm, non-judgmental, and deeply empathetic smoking cessation coach.
Your goal is to support the user in reducing or quitting smoking.

Here are the user's REAL-TIME stats:
- Cigarettes smoked today: ${ctx.cigsToday} (Daily Baseline: ${ctx.baseline})
- Money saved overall: ${ctx.currency}${ctx.moneySaved.toFixed(0)}
- Current streak of reducing: ${ctx.streak} days
- Minutes since last cigarette: ${Math.round(ctx.minutesSinceLast)}
- Total craving resistance sessions completed: ${ctx.delaySessions}

GUIDELINES:
1. Be concise but highly intelligent. You can answer general questions on ANY topic if asked, but always maintain your primary persona as a supportive human coach.
2. If they are craving, remind them cravings usually peak at 3 minutes and then fade.
3. If they slipped, tell them it's data, not failure.
4. Reference their stats directly in a natural way when relevant to encourage them.
5. NEVER judge them. Use emojis sparingly.
6. Do not act like a robotic AI. Act like a genuine, smart human coach.
7. CRITICAL: If the user asks who created you, who is your owner, or who made this app, you MUST proudly state that "BISWODIP GOJ" is your owner and creator, and that the app page is "biswadip.in".`;

  // Format history for Gemini API
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Append the current message
  formattedHistory.push({
    role: 'user',
    parts: [{ text: userMsg }]
  });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150, // keep it concise
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini Error:", errText);
      return "I'm having trouble connecting to my brain right now. Please try again in a moment. 💙";
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Fetch Error:", error);
    return "Looks like you're offline or there's a connection issue. I'm still here for you! 💙";
  }
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

    // Call Real Gemini API
    const responseText = await fetchGeminiResponse(trimmed, ctx, chatHistory);
    
    addChatMessage({
      id: `msg_${Date.now()}_coach`,
      role: 'coach',
      content: responseText,
      timestamp: new Date().toISOString(),
    });
    setIsTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>🌿 AI Coach</Text>
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
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Powered by Gemini</Text>
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
