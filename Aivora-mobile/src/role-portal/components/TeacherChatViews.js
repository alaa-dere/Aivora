import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { portalStyles } from '../styles';

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function TeacherStudentChatView({ apiFetch, theme }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setError('');
      const res = await apiFetch('/api/teacher/chat/students', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load students');
      const list = Array.isArray(payload?.students) ? payload.students : [];
      setStudents(list);
      setSelected((prev) => {
        if (!prev && list.length > 0) return list[0];
        if (!prev) return null;
        return (
          list.find((item) => item.courseId === prev.courseId && item.studentId === prev.studentId) ||
          list[0] ||
          null
        );
      });
    } catch (err) {
      setError(err?.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const ensureConversation = async (studentItem) => {
    if (studentItem?.conversationId) return String(studentItem.conversationId);
    const res = await apiFetch('/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        courseId: studentItem?.courseId,
        studentId: studentItem?.studentId,
      }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || 'Could not open conversation');
    const conversationId = String(payload?.conversationId || '').trim();
    if (!conversationId) throw new Error('Could not open conversation');
    setStudents((prev) =>
      prev.map((item) =>
        item.courseId === studentItem.courseId && item.studentId === studentItem.studentId
          ? { ...item, conversationId }
          : item
      )
    );
    setSelected((prev) =>
      prev && prev.courseId === studentItem.courseId && prev.studentId === studentItem.studentId
        ? { ...prev, conversationId }
        : prev
    );
    return conversationId;
  };

  const loadMessages = async (studentItem, markRead = true) => {
    if (!studentItem) return;
    try {
      setLoadingMessages(true);
      setError('');
      const conversationId = await ensureConversation(studentItem);
      const res = await apiFetch(
        `/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}${markRead ? '&markRead=1' : ''}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load messages');
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      if (markRead) {
        setStudents((prev) =>
          prev.map((item) =>
            item.conversationId === conversationId ? { ...item, unreadCount: 0 } : item
          )
        );
      }
    } catch (err) {
      setError(err?.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!selected || !String(draft || '').trim()) return;
    try {
      setSending(true);
      setError('');
      const conversationId = await ensureConversation(selected);
      const body = String(draft || '').trim();
      const res = await apiFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId, body }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send message');
      setDraft('');
      await loadMessages({ ...selected, conversationId }, false);
      await loadStudents();
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selected) {
      loadMessages(selected, true);
    } else {
      setMessages([]);
    }
  }, [selected?.courseId, selected?.studentId]);

  const orderedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Student Chat</Text>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {!chatOpen ? (
        <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Students</Text>
          {loadingStudents ? (
            <ActivityIndicator color="#0d3b66" style={portalStyles.loader} />
          ) : students.length === 0 ? (
            <Text style={portalStyles.empty}>No students found.</Text>
          ) : (
            students.map((item) => {
              const active = selected?.courseId === item.courseId && selected?.studentId === item.studentId;
              return (
                <Pressable
                  key={`${item.courseId}-${item.studentId}`}
                  style={[portalStyles.threadItem, active && portalStyles.threadItemActive]}
                  onPress={() => {
                    setSelected(item);
                    setChatOpen(true);
                  }}
                >
                  <Text style={portalStyles.threadTeacher}>{item.studentName}</Text>
                  <Text style={portalStyles.threadMeta}>
                    {item.courseTitle}{' '}
                    {Number(item.unreadCount || 0) > 0 ? `| Unread: ${Number(item.unreadCount || 0)}` : ''}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}

      {chatOpen ? (
        <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[portalStyles.actionRow, { justifyContent: 'space-between' }]}>
            <Pressable onPress={() => setChatOpen(false)} style={portalStyles.secondaryBtn}>
              <Text style={portalStyles.secondaryBtnText}>Back</Text>
            </Pressable>
            <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
              {selected ? `Chat with ${selected.studentName}` : 'Conversation'}
            </Text>
          </View>
          <ScrollView style={{ maxHeight: 360 }}>
            {loadingMessages ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
            {!loadingMessages && orderedMessages.length === 0 ? <Text style={portalStyles.empty}>No messages.</Text> : null}
            {orderedMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  portalStyles.chatBubble,
                  msg.senderRole === 'teacher' ? portalStyles.chatBubbleAdmin : portalStyles.chatBubbleTeacher,
                ]}
              >
                <Text style={portalStyles.chatText}>{msg.body}</Text>
                <Text style={[portalStyles.threadMeta, { marginTop: 4 }]}>{formatTime(msg.createdAt)}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={portalStyles.chatComposerRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              style={portalStyles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
            />
            <Pressable style={portalStyles.chatSendBtn} onPress={sendMessage} disabled={sending || !selected}>
              <Text style={portalStyles.chatSendText}>{sending ? 'Sending...' : 'Send'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function TeacherAdminMessagesView({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [adminName, setAdminName] = useState('Administration');
  const [adminId, setAdminId] = useState('');
  const [draft, setDraft] = useState('');

  const loadMessages = async (markRead = true) => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/api/teacher/messages${markRead ? '?markRead=1' : ''}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load admin messages');
      if (payload?.thread?.adminName) setAdminName(payload.thread.adminName);
      if (payload?.thread?.adminId) setAdminId(payload.thread.adminId);
      if (!payload?.thread?.adminId && payload?.admin?.id) setAdminId(payload.admin.id);
      if (!payload?.thread?.adminName && payload?.admin?.fullName) setAdminName(payload.admin.fullName);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
    } catch (err) {
      setError(err?.message || 'Failed to load admin messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!String(draft || '').trim()) return;
    try {
      setSending(true);
      setError('');
      const res = await apiFetch('/api/teacher/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          body: String(draft || '').trim(),
          adminId: adminId || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send message');
      setDraft('');
      await loadMessages(false);
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadMessages(true);
  }, []);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Admin Messages</Text>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Chat with {adminName}</Text>
        <ScrollView style={{ maxHeight: 420 }}>
          {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
          {!loading && messages.length === 0 ? <Text style={portalStyles.empty}>No messages yet.</Text> : null}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                portalStyles.chatBubble,
                msg.senderRole === 'teacher' ? portalStyles.chatBubbleAdmin : portalStyles.chatBubbleTeacher,
              ]}
            >
              <Text style={portalStyles.chatText}>{msg.body}</Text>
              <Text style={[portalStyles.threadMeta, { marginTop: 4 }]}>{formatTime(msg.createdAt)}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={portalStyles.chatComposerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={portalStyles.chatInput}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
          />
          <Pressable style={portalStyles.chatSendBtn} onPress={sendMessage} disabled={sending}>
            <Text style={portalStyles.chatSendText}>{sending ? 'Sending...' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function TeacherMessagesHubView({ apiFetch, theme, initialMode = 'students' }) {
  const [mode, setMode] = useState(initialMode === 'admin' ? 'admin' : 'students');

  useEffect(() => {
    setMode(initialMode === 'admin' ? 'admin' : 'students');
  }, [initialMode]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Messages</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Communicate with students and administration from one place.
      </Text>

      <View style={[portalStyles.actionRow, { marginBottom: 10 }]}>
        <Pressable
          onPress={() => setMode('students')}
          style={[
            portalStyles.secondaryBtn,
            mode === 'students' && { backgroundColor: '#dbeafe', borderColor: '#60a5fa', borderWidth: 1 },
          ]}
        >
          <Text style={portalStyles.secondaryBtnText}>Students</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('admin')}
          style={[
            portalStyles.secondaryBtn,
            mode === 'admin' && { backgroundColor: '#dbeafe', borderColor: '#60a5fa', borderWidth: 1 },
          ]}
        >
          <Text style={portalStyles.secondaryBtnText}>Admin</Text>
        </Pressable>
      </View>

      {mode === 'students' ? (
        <TeacherStudentChatView apiFetch={apiFetch} theme={theme} />
      ) : (
        <TeacherAdminMessagesView apiFetch={apiFetch} theme={theme} />
      )}
    </View>
  );
}
