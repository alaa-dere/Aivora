import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_ROUTES } from '@aivora/shared';
import { portalStyles } from '../styles';

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'true_false', label: 'True / False' },
  { id: 'written', label: 'Written Answer' },
];

const readJsonSafe = async (res) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return {};
  }
};

export default function TeacherQuestionBankView({ apiFetch, theme }) {
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState([]);

  const [questionType, setQuestionType] = useState('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      setError('');
      const res = await apiFetch(API_ROUTES.teacher.courses, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await readJsonSafe(res);
      if (!res.ok) throw new Error(payload?.message || 'Failed to load courses');
      setCourses(Array.isArray(payload?.courses) ? payload.courses : []);
    } catch (err) {
      setError(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [apiFetch]);

  const loadQuestions = useCallback(
    async (courseId) => {
      if (!String(courseId || '').trim()) return;
      try {
        setLoadingQuestions(true);
        setError('');
        const res = await apiFetch(
          `${API_ROUTES.teacher.questionBank}?courseId=${encodeURIComponent(courseId)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        const payload = await readJsonSafe(res);
        if (!res.ok) throw new Error(payload?.message || 'Failed to load question bank');
        setQuestions(Array.isArray(payload?.questions) ? payload.questions : []);
      } catch (err) {
        setError(err?.message || 'Failed to load question bank');
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) =>
      [course?.name, course?.title, course?.id].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [courses, search]);

  const resetForm = () => {
    setQuestionType('multiple_choice');
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(null);
    setWrittenAnswer('');
  };

  const handleSaveQuestion = async () => {
    if (!selectedCourse?.id) return;
    const cleanText = String(questionText || '').trim();
    if (!cleanText) return setError('Question text is required.');

    let payload = null;
    if (questionType === 'written') {
      if (!String(writtenAnswer || '').trim()) return setError('Written answer is required.');
      payload = {
        courseId: selectedCourse.id,
        questionType,
        questionText: cleanText,
        options: [],
        writtenAnswer: String(writtenAnswer).trim(),
        correctOptionIndex: 0,
      };
    } else if (questionType === 'true_false') {
      if (correctAnswer !== 0 && correctAnswer !== 1) return setError('Select true or false answer.');
      payload = {
        courseId: selectedCourse.id,
        questionType,
        questionText: cleanText,
        options: ['True', 'False'],
        writtenAnswer: '',
        correctOptionIndex: Number(correctAnswer),
      };
    } else {
      const cleanOptions = options.map((item) => String(item || '').trim()).filter(Boolean);
      if (cleanOptions.length < 2) return setError('Add at least 2 options.');
      if (correctAnswer === null || correctAnswer < 0 || correctAnswer >= cleanOptions.length) {
        return setError('Select a valid correct option.');
      }
      payload = {
        courseId: selectedCourse.id,
        questionType,
        questionText: cleanText,
        options: cleanOptions,
        writtenAnswer: '',
        correctOptionIndex: Number(correctAnswer),
      };
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await apiFetch(API_ROUTES.teacher.questionBank, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const body = await readJsonSafe(res);
      if (!res.ok) throw new Error(body?.message || 'Failed to save question.');
      setSuccess('Question saved.');
      resetForm();
      await loadQuestions(selectedCourse.id);
    } catch (err) {
      setError(err?.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      setError('');
      setSuccess('');
      const res = await apiFetch(`${API_ROUTES.teacher.questionBank}/${encodeURIComponent(questionId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const body = await readJsonSafe(res);
      if (!res.ok) throw new Error(body?.message || 'Failed to delete question.');
      setSuccess('Question deleted.');
      setQuestions((prev) => prev.filter((q) => String(q?.id) !== String(questionId)));
    } catch (err) {
      setError(err?.message || 'Failed to delete question.');
    }
  };

  if (!selectedCourse) {
    return (
      <View style={portalStyles.adminWrap}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Question Bank</Text>
        <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
          Select a course to manage its questions.
        </Text>

        <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search courses..."
            placeholderTextColor="#94a3b8"
            style={portalStyles.input}
          />
          <Pressable onPress={loadCourses} style={[portalStyles.secondaryBtn, { alignSelf: 'flex-start' }]}>
            <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
          </Pressable>
        </View>

        {error ? <Text style={portalStyles.error}>{error}</Text> : null}
        {loadingCourses ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

        {!loadingCourses ? (
          <View style={{ gap: 8 }}>
            {filteredCourses.length === 0 ? <Text style={portalStyles.empty}>No courses found.</Text> : null}
            {filteredCourses.map((course) => (
              <Pressable
                key={String(course?.id || Math.random())}
                onPress={() => {
                  setSelectedCourse(course);
                  setError('');
                  setSuccess('');
                  loadQuestions(course?.id);
                }}
                style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                      {course?.name || course?.title || 'Untitled course'}
                    </Text>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      ID: {course?.id || '-'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textMuted} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Question Bank</Text>
        <Pressable
          onPress={() => {
            setSelectedCourse(null);
            setQuestions([]);
            setError('');
            setSuccess('');
          }}
          style={portalStyles.secondaryBtn}
        >
          <Text style={portalStyles.secondaryBtnText}>Back to Courses</Text>
        </Pressable>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        {selectedCourse?.name || selectedCourse?.title || 'Selected course'}
      </Text>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Add Question</Text>
        <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
          {QUESTION_TYPES.map((type) => (
            <Pressable
              key={type.id}
              onPress={() => {
                setQuestionType(type.id);
                setCorrectAnswer(type.id === 'true_false' ? 0 : null);
                setOptions(type.id === 'true_false' ? ['True', 'False'] : ['', '', '', '']);
              }}
              style={[
                portalStyles.secondaryBtn,
                questionType === type.id && { backgroundColor: '#bfdbfe', borderWidth: 1, borderColor: '#60a5fa' },
              ]}
            >
              <Text style={portalStyles.secondaryBtnText}>{type.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={questionText}
          onChangeText={setQuestionText}
          placeholder="Question text..."
          placeholderTextColor="#94a3b8"
          style={[portalStyles.input, { minHeight: 72, textAlignVertical: 'top' }]}
          multiline
        />

        {questionType === 'written' ? (
          <TextInput
            value={writtenAnswer}
            onChangeText={setWrittenAnswer}
            placeholder="Written answer..."
            placeholderTextColor="#94a3b8"
            style={portalStyles.input}
          />
        ) : null}

        {questionType === 'multiple_choice' ? (
          <View style={{ gap: 8 }}>
            {options.map((option, idx) => (
              <TextInput
                key={`option-${idx}`}
                value={option}
                onChangeText={(text) =>
                  setOptions((prev) => prev.map((item, optionIdx) => (optionIdx === idx ? text : item)))
                }
                placeholder={`Option ${idx + 1}`}
                placeholderTextColor="#94a3b8"
                style={portalStyles.input}
              />
            ))}
            <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
              {options.map((_, idx) => (
                <Pressable
                  key={`correct-${idx}`}
                  onPress={() => setCorrectAnswer(idx)}
                  style={[
                    portalStyles.secondaryBtn,
                    correctAnswer === idx && { backgroundColor: '#bfdbfe', borderWidth: 1, borderColor: '#60a5fa' },
                  ]}
                >
                  <Text style={portalStyles.secondaryBtnText}>Correct: {idx + 1}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {questionType === 'true_false' ? (
          <View style={portalStyles.actionRow}>
            <Pressable
              onPress={() => setCorrectAnswer(0)}
              style={[
                portalStyles.secondaryBtn,
                correctAnswer === 0 && { backgroundColor: '#bfdbfe', borderWidth: 1, borderColor: '#60a5fa' },
              ]}
            >
              <Text style={portalStyles.secondaryBtnText}>True</Text>
            </Pressable>
            <Pressable
              onPress={() => setCorrectAnswer(1)}
              style={[
                portalStyles.secondaryBtn,
                correctAnswer === 1 && { backgroundColor: '#bfdbfe', borderWidth: 1, borderColor: '#60a5fa' },
              ]}
            >
              <Text style={portalStyles.secondaryBtnText}>False</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={handleSaveQuestion} disabled={saving} style={[portalStyles.secondaryBtn, { alignSelf: 'flex-start' }]}>
          <Text style={portalStyles.secondaryBtnText}>{saving ? 'Saving...' : 'Save Question'}</Text>
        </Pressable>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {success ? <Text style={portalStyles.summary}>{success}</Text> : null}
      {loadingQuestions ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loadingQuestions ? (
        <ScrollView style={{ maxHeight: 420 }}>
          <View style={{ gap: 8 }}>
            {questions.length === 0 ? <Text style={portalStyles.empty}>No questions yet.</Text> : null}
            {questions.map((question, idx) => (
              <View
                key={String(question?.id || `question-${idx}`)}
                style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
              >
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                  Q{idx + 1}: {question?.questionText || '-'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Type: {String(question?.questionType || 'multiple_choice').replace('_', ' ')}
                </Text>
                {Array.isArray(question?.options) && question.options.length ? (
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    Options: {question.options.join(' | ')}
                  </Text>
                ) : null}
                <View style={[portalStyles.actionRow, { marginTop: 6 }]}>
                  <Pressable
                    onPress={() => handleDeleteQuestion(question?.id)}
                    style={[portalStyles.secondaryBtn, { backgroundColor: '#fee2e2' }]}
                  >
                    <Text style={[portalStyles.secondaryBtnText, { color: '#b91c1c' }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}
