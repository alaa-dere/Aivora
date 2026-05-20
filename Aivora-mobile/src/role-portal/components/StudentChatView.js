import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { API_ROUTES } from '@aivora/shared';
import { portalStyles } from '../styles';

const formatDateTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

export default function StudentChatView({ apiFetch, theme }) {
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);

  const loadTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true);
      setError('');
      const res = await apiFetch(API_ROUTES.student.chatTeachers, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load teachers');
      const list = Array.isArray(payload?.teachers) ? payload.teachers : [];
      setTeachers(list);
      if (!selected && list.length > 0) setSelected(list[0]);
    } catch (err) {
      setError(err?.message || 'Failed to load teachers');
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, [apiFetch, selected]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const ensureConversation = useCallback(
    async (item) => {
      if (item?.conversationId) return String(item.conversationId);
      const res = await apiFetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: item?.courseId, teacherId: item?.teacherId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to create conversation');
      const conversationId = String(payload?.conversationId || '');
      setTeachers((prev) =>
        prev.map((t) =>
          t?.courseId === item?.courseId && t?.teacherId === item?.teacherId ? { ...t, conversationId } : t
        )
      );
      setSelected((prev) =>
        prev?.courseId === item?.courseId && prev?.teacherId === item?.teacherId ? { ...prev, conversationId } : prev
      );
      return conversationId;
    },
    [apiFetch]
  );

  const loadMessages = useCallback(
    async (item) => {
      if (!item) return;
      try {
        setLoadingMessages(true);
        setError('');
        const conversationId = await ensureConversation(item);
        const res = await apiFetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to load messages');
        const list = Array.isArray(payload?.messages) ? payload.messages : [];
        setMessages(list);

        const teacherUnreadMessageIds = list
          .filter((msg) => String(msg?.senderRole || '') === 'teacher')
          .map((msg) => msg?.id)
          .filter(Boolean);
        if (teacherUnreadMessageIds.length > 0) {
          await apiFetch('/api/chat/messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ messageIds: teacherUnreadMessageIds }),
          });
        }

        setTeachers((prev) =>
          prev.map((t) =>
            t?.courseId === item?.courseId && t?.teacherId === item?.teacherId ? { ...t, unreadCount: 0 } : t
          )
        );
      } catch (err) {
        setError(err?.message || 'Failed to load messages');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [apiFetch, ensureConversation]
  );

  useEffect(() => {
    loadMessages(selected);
  }, [selected?.courseId, selected?.teacherId]);

  const handleSend = async () => {
    if (!selected || !String(input || '').trim() || sending) return;
    try {
      setSending(true);
      setError('');
      const conversationId = await ensureConversation(selected);
      const bodyText = String(input || '').trim();
      const res = await apiFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId, body: bodyText }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send message');
      setInput('');
      await loadMessages(selected);
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    const sorted = [...teachers].sort((a, b) => {
      const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    if (!q) return sorted;
    return sorted.filter((t) =>
      [t?.teacherName, t?.courseTitle, t?.lastMessage].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
      ),
    [messages]
  );

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Chat</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Chat with teachers for your enrolled courses.
      </Text>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Teachers</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search teacher or course..."
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        {loadingTeachers ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
        {!loadingTeachers && filteredTeachers.length === 0 ? <Text style={portalStyles.empty}>No teachers found.</Text> : null}
        <ScrollView style={{ maxHeight: 220 }}>
          <View style={{ gap: 8 }}>
            {filteredTeachers.map((item, idx) => {
              const active =
                String(selected?.courseId || '') === String(item?.courseId || '') &&
                String(selected?.teacherId || '') === String(item?.teacherId || '');
              return (
                <Pressable
                  key={`${item?.courseId || idx}-${item?.teacherId || idx}`}
                  onPress={() => setSelected(item)}
                  style={[
                    portalStyles.listCard,
                    { backgroundColor: theme.cardBg, borderColor: active ? '#60a5fa' : theme.cardBorder },
                  ]}
                >
                  <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{item?.teacherName || 'Teacher'}</Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{item?.courseTitle || '-'}</Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{item?.lastMessage || 'No messages yet'}</Text>
                  {Number(item?.unreadCount || 0) > 0 ? (
                    <Text style={[portalStyles.listItemValue, { color: '#b91c1c' }]}>
                      Unread: {Number(item?.unreadCount || 0)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>
          {selected ? `Chat with ${selected?.teacherName || 'Teacher'}` : 'Select a teacher'}
        </Text>
        {loadingMessages ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
        {!loadingMessages && orderedMessages.length === 0 ? <Text style={portalStyles.empty}>No messages yet.</Text> : null}
        <ScrollView style={{ maxHeight: 320 }}>
          <View style={{ gap: 8 }}>
            {orderedMessages.map((msg, idx) => {
              const mine = String(msg?.senderRole || '') === 'student';
              return (
                <View key={String(msg?.id || `msg-${idx}`)} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <View
                    style={{
                      maxWidth: '85%',
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: mine ? '#2563eb' : theme.isDark ? '#1f2937' : '#f1f5f9',
                    }}
                  >
                    <Text style={{ color: mine ? '#ffffff' : theme.textPrimary, fontSize: 12 }}>
                      {String(msg?.body || '')}
                    </Text>
                    <Text style={{ color: mine ? '#bfdbfe' : theme.textMuted, fontSize: 10, marginTop: 4 }}>
                      {formatDateTime(msg?.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={portalStyles.chatComposerRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Write a message..."
            placeholderTextColor="#94a3b8"
            style={portalStyles.chatInput}
            editable={Boolean(selected)}
          />
          <Pressable onPress={handleSend} disabled={!selected || sending || !String(input || '').trim()} style={portalStyles.chatSendBtn}>
            <Text style={portalStyles.chatSendText}>{sending ? '...' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

