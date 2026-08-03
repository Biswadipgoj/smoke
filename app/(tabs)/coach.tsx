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
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontFamily, FontSize, Spacing, Radius, Gradients } from '../../src/constants/theme';
import { getPersona, Persona } from '../../src/constants/personas';
import { LivingBackground } from '../../src/components/ui/LivingBackground';
import { GradientView } from '../../src/components/ui/GradientView';

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

const GEMINI_MODEL = 'gemini-flash-latest';

// Strip any markdown the model slips in so replies read like a real person
// texting — no **bold**, no bullet lists, no headings.
function humanize(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|\s)[*_]([^*_\n]+)[*_]/g, '$1$2')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchGeminiResponse(
  userMsg: string,
  ctx: CoachContext,
  history: ChatMessage[],
  persona: Persona,
  langName: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "I can't reach my thoughts right now — the Gemini API key hasn't been set up yet. (Add EXPO_PUBLIC_GEMINI_API_KEY and I'll be right here.)";
  }

  const timeOfDay = ctx.hour < 12 ? 'morning' : ctx.hour < 17 ? 'afternoon' : ctx.hour < 21 ? 'evening' : 'late night';

  const systemPrompt = `You are ${persona.name}, a real person who happens to be an exceptional, warm smoking-reduction companion — not a chatbot, not an assistant. ${persona.promptFragment}

HOW YOU TALK (this matters most):
- Write the way a caring friend texts: short, natural, 1–3 sentences most of the time. Use contractions.
- Never use bullet points, numbered lists, markdown, bold, or headings. Just plain, human sentences.
- Never say you are an AI, a language model, or a program. Never add disclaimers or "as a coach" framing.
- Vary how you open — don't start every message the same way, and don't over-use their name.
- Emojis are optional and rare (at most one, only when it genuinely fits). Never force cheerfulness.
- Match the user's language. They are using ${langName}; reply in ${langName} unless they clearly switch.
- It's ${timeOfDay} for them right now — let that quietly color your tone if relevant.

WHAT YOU KNOW ABOUT THEM (weave in naturally, only when it helps — never dump stats):
- Cigarettes today: ${ctx.cigsToday} vs a baseline of ${ctx.baseline}
- Roughly ${ctx.currency}${ctx.moneySaved.toFixed(0)} saved so far
- ${ctx.streak}-day reducing streak
- About ${Math.round(ctx.minutesSinceLast)} minutes since their last cigarette
- ${ctx.delaySessions} craving-surfing sessions done

HOW YOU HELP:
- If they're craving, gently remind them a craving usually peaks around 3 minutes and fades — and offer one small thing to do, not a lecture.
- If they slipped, treat it as information, never failure. Progress over perfection, always.
- You can talk about anything they bring up, but you're always their companion first.
- If they ask who made you or who owns this app, warmly say your creator is Biswadip Goj and the app lives at biswadip.in.`;

  const formattedHistory = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
  formattedHistory.push({ role: 'user', parts: [{ text: userMsg }] });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: formattedHistory,
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini Error:', response.status, errText);
      return "I'm having a little trouble hearing you right now — give me a moment and try again? I'm still here. 💙";
    }

    const data = await response.json();
    const parts: Array<{ text?: string }> = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? '').join('').trim();
    if (!text) {
      return "I didn't quite catch the words that time — mind saying that again?";
    }
    return humanize(text);
  } catch (error) {
    console.error('Fetch Error:', error);
    return "Looks like the connection dropped — but I haven't gone anywhere. This craving will pass whether we talk or not. Take three slow breaths with me. 💙";
  } finally {
    clearTimeout(timeout);
  }
}

// ── Typing Indicator Component ──
const TypingIndicator = ({ colors, avatar }: { colors: any; avatar: string }) => {
  return (
    <Animated.View entering={SlideInLeft.springify().damping(12)} layout={Layout.springify()} style={[styles.messageBubble, styles.coachBubble]}>
      <Text style={styles.coachAvatar}>{avatar}</Text>
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
  const { colors, isDark } = useTheme();
  const { chatHistory, addChatMessage, profile, logs, delaySessions } = useAppStore();
  const persona = getPersona(profile?.companionPersona);
  const langName = profile?.locale === 'hi' ? 'Hindi' : profile?.locale === 'bn' ? 'Bengali' : 'English';

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
    const responseText = await fetchGeminiResponse(trimmed, ctx, chatHistory, persona, langName);
    
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
      {isDark && <LivingBackground subdued />}
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={[styles.headerAvatar, { backgroundColor: `${persona.accent}22` }]}>
            <Text style={styles.headerAvatarText}>{persona.emoji}</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{persona.name}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t[persona.nameKey]}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, paddingBottom: 88 }}
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
                <Text style={styles.emptyEmoji}>{persona.emoji}</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.coachEmptyTitle}</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {t.coachEmptySubtitle}
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
                {msg.role === 'coach' && <Text style={styles.coachAvatar}>{persona.emoji}</Text>}
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

            {isTyping && <TypingIndicator colors={colors} avatar={persona.emoji} />}
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
              style={(!input.trim() || isTyping) && styles.sendBtnDisabled}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.85}
            >
              <GradientView colors={Gradients.cta} radius={20} style={styles.sendBtn}>
                <Ionicons name="arrow-up" size={20} color={Colors.bgDark} />
              </GradientView>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 20 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg },
  headerSubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: -2 },

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
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
});
