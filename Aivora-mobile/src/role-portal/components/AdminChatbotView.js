import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { portalStyles } from '../styles';

export default function AdminChatbotView({ apiFetch, theme }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        'Hello, I am your Admin Assistant. Ask me things like: "What is this month\'s revenue?" or "Who are the most active students?"',
    },
  ]);
  const scrollRef = useRef(null);

  const ask = async () => {
    const message = String(prompt || '').trim();
    if (!message) return;
    try {
      setLoading(true);
      setError('');
      setPrompt('');
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: message },
      ]);
      const res = await apiFetch('/api/admin/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Chatbot request failed');
      const replyText = String(payload?.answer || 'No answer');
      setSource(String(payload?.source || ''));
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: replyText },
      ]);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }, 40);
    } catch (err) {
      setError(String(err?.message || 'Chatbot request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View
        style={[
          portalStyles.adminSection,
          portalStyles.chatbotHeroCard,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
        ]}
      >
        <View style={portalStyles.adminSectionStripe} />
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Admin Chatbot</Text>
        <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted, marginLeft: 0, marginBottom: 0 }]}>
          Ask about admin metrics quickly using natural language.
        </Text>
        {source ? (
          <Text style={portalStyles.aiSourceText}>
            Source: {source === 'openai' ? 'OpenAI' : source}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          portalStyles.adminSection,
          portalStyles.chatbotMainCard,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
        ]}
      >
        <ScrollView
          ref={scrollRef}
          style={portalStyles.chatbotMessages}
          contentContainerStyle={portalStyles.chatbotMessagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                portalStyles.chatbotBubble,
                item.role === 'assistant'
                  ? portalStyles.chatbotBubbleAssistant
                  : portalStyles.chatbotBubbleUser,
              ]}
            >
              <Text
                style={[
                  portalStyles.chatbotBubbleText,
                  item.role === 'assistant'
                    ? { color: theme.textPrimary }
                    : { color: '#ffffff' },
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}
          {error ? <Text style={portalStyles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={portalStyles.chatbotComposer}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Type your question here..."
            placeholderTextColor="#94a3b8"
            style={portalStyles.chatbotInput}
          />
          <Pressable
            onPress={ask}
            disabled={loading}
            style={[portalStyles.chatbotSendBtn, loading && { opacity: 0.7 }]}
          >
            <Text style={portalStyles.chatbotSendText}>
              {loading ? 'Sending...' : 'Send'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
