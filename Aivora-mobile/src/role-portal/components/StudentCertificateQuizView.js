import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { portalStyles } from '../styles';

const PASSING_SCORE_PERCENTAGE = 60;

export default function StudentCertificateQuizView({
  apiFetch,
  theme,
  courseId = '',
  onBackToCourse = () => {},
  onOpenCertificates = () => {},
}) {
  const safeCourseId = String(courseId || '').trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [attemptAnswers, setAttemptAnswers] = useState([]);
  const [showEvaluationPrompt, setShowEvaluationPrompt] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');

  const currentQuestion =
    activeQuestions.length > 0 ? activeQuestions[currentQuestionIndex] || null : null;
  const isLastQuestion =
    activeQuestions.length > 0 && currentQuestionIndex === activeQuestions.length - 1;
  const currentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.questionType === 'written') {
      return Boolean((textAnswers[currentQuestion.id] || '').trim());
    }
    const value = answers[currentQuestion.id];
    return value !== null && value !== undefined;
  }, [answers, currentQuestion, textAnswers]);

  const loadOverview = async () => {
    if (!safeCourseId) {
      setLoading(false);
      setError('Missing course id for quiz.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(`/api/student/my-courses/${encodeURIComponent(safeCourseId)}/quiz`, {
        method: 'GET',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to load course quiz');
      setOverview(payload || null);
    } catch (err) {
      setError(String(err?.message || 'Failed to load course quiz'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [safeCourseId]);

  const startQuiz = async () => {
    if (!safeCourseId) return;
    try {
      setError('');
      setStarting(true);
      const response = await apiFetch(
        `/api/student/my-courses/${encodeURIComponent(safeCourseId)}/quiz?mode=start`,
        { method: 'GET' }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to start quiz');
      const questions = Array.isArray(payload?.questions) ? payload.questions : [];
      const initialAnswers = {};
      const initialTextAnswers = {};
      for (const question of questions) {
        initialAnswers[question.id] = null;
        initialTextAnswers[question.id] = '';
      }
      setActiveQuestions(questions);
      setAnswers(initialAnswers);
      setTextAnswers(initialTextAnswers);
      setCurrentQuestionIndex(0);
      setAttempt(null);
      setAttemptAnswers([]);
    } catch (err) {
      setError(String(err?.message || 'Failed to start quiz'));
    } finally {
      setStarting(false);
    }
  };

  const loadAttemptResult = async (attemptId) => {
    const safeAttemptId = String(attemptId || '').trim();
    if (!safeAttemptId || !safeCourseId) return;
    try {
      const response = await apiFetch(
        `/api/student/my-courses/${encodeURIComponent(safeCourseId)}/quiz-attempts/${encodeURIComponent(safeAttemptId)}`,
        { method: 'GET' }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to load quiz result');
      const nextAttempt = payload?.attempt || null;
      setAttempt(nextAttempt);
      setAttemptAnswers(Array.isArray(payload?.answers) ? payload.answers : []);

      if (
        nextAttempt &&
        Number(nextAttempt.scorePercentage || 0) >= PASSING_SCORE_PERCENTAGE &&
        nextAttempt.certificateId
      ) {
        try {
          const evalRes = await apiFetch(
            `/api/student/my-courses/${encodeURIComponent(safeCourseId)}/evaluation`,
            { method: 'GET' }
          );
          const evalPayload = await evalRes.json().catch(() => ({}));
          if (evalRes.ok && evalPayload?.canEvaluate && !evalPayload?.hasResponse) {
            setShowEvaluationPrompt(true);
          }
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      setError(String(err?.message || 'Failed to load quiz result'));
    }
  };

  const submitQuiz = async () => {
    if (!safeCourseId || activeQuestions.length !== 10) {
      setError('Quiz session is invalid. Please restart the quiz.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        answers: activeQuestions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id] ?? null,
          textAnswer: textAnswers[question.id] || '',
        })),
      };
      const response = await apiFetch(`/api/student/my-courses/${encodeURIComponent(safeCourseId)}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || 'Failed to submit quiz');

      setActiveQuestions([]);
      setCurrentQuestionIndex(0);
      await loadAttemptResult(result?.attemptId);
      await loadOverview();
    } catch (err) {
      setError(String(err?.message || 'Failed to submit quiz'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipEvaluation = async () => {
    try {
      setSavingEvaluation(true);
      setEvaluationError('');
      const response = await apiFetch(`/api/student/my-courses/${encodeURIComponent(safeCourseId)}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to skip evaluation');
      setShowEvaluationPrompt(false);
    } catch (err) {
      setEvaluationError(String(err?.message || 'Failed to skip evaluation'));
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!rating) {
      setEvaluationError('Please choose a star rating first.');
      return;
    }
    try {
      setSavingEvaluation(true);
      setEvaluationError('');
      const response = await apiFetch(`/api/student/my-courses/${encodeURIComponent(safeCourseId)}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', rating, feedback }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to save evaluation');
      setShowEvaluationPrompt(false);
    } catch (err) {
      setEvaluationError(String(err?.message || 'Failed to save evaluation'));
    } finally {
      setSavingEvaluation(false);
    }
  };

  if (loading) {
    return <Text style={portalStyles.listItemMeta}>Loading quiz details...</Text>;
  }

  return (
    <View style={portalStyles.adminWrap}>
      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 10 }]}>
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 22 }]}>
          Course Quiz{overview?.course?.title ? ` - ${overview.course.title}` : ''}
        </Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Answer each question in order.</Text>

        {!attempt && activeQuestions.length === 0 ? (
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={startQuiz}
              disabled={!overview?.canStart || starting}
              style={[portalStyles.chatSendBtn, { opacity: !overview?.canStart || starting ? 0.6 : 1 }]}
            >
              <Text style={portalStyles.chatSendText}>{starting ? 'Preparing quiz...' : 'Start Random Quiz'}</Text>
            </Pressable>
            <Pressable onPress={onBackToCourse} style={portalStyles.secondaryBtn}>
              <Text style={portalStyles.secondaryBtnText}>Back to course</Text>
            </Pressable>
            {overview && !overview?.completed ? (
              <Text style={{ color: '#b45309' }}>Finish the full course first to unlock this quiz.</Text>
            ) : null}
            {overview && (overview?.questionCount || 0) < 10 ? (
              <Text style={{ color: '#b45309' }}>This quiz unlocks once your teacher adds at least 10 bank questions.</Text>
            ) : null}
          </View>
        ) : null}

        {activeQuestions.length > 0 && currentQuestion ? (
          <View style={{ gap: 10 }}>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Question {currentQuestionIndex + 1} / {activeQuestions.length}
            </Text>
            <View style={{ borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, padding: 10 }}>
              <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>
                {currentQuestion.order}. {currentQuestion.questionText}
              </Text>
              <View style={{ marginTop: 8, gap: 8 }}>
                {currentQuestion.questionType === 'written' ? (
                  <TextInput
                    multiline
                    value={textAnswers[currentQuestion.id] || ''}
                    onChangeText={(text) =>
                      setTextAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: text,
                      }))
                    }
                    placeholder="Write your answer"
                    placeholderTextColor="#94a3b8"
                    style={[portalStyles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                  />
                ) : (
                  (currentQuestion.options || []).map((option, optionIndex) => {
                    const selected = answers[currentQuestion.id] === optionIndex;
                    return (
                      <Pressable
                        key={`${currentQuestion.id}-${optionIndex}`}
                        onPress={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: optionIndex,
                          }))
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: selected ? '#93c5fd' : '#dbe4ef',
                          backgroundColor: selected ? '#eff6ff' : '#ffffff',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 9,
                        }}
                      >
                        <Text style={{ color: '#0f172a' }}>{option}</Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>

            {isLastQuestion ? (
              <Pressable
                onPress={submitQuiz}
                disabled={submitting || !currentQuestionAnswered}
                style={[portalStyles.chatSendBtn, { opacity: submitting || !currentQuestionAnswered ? 0.6 : 1 }]}
              >
                <Text style={portalStyles.chatSendText}>{submitting ? 'Submitting...' : 'Submit Quiz'}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  if (!currentQuestionAnswered) {
                    setError('Please answer this question before continuing.');
                    return;
                  }
                  setError('');
                  setCurrentQuestionIndex((prev) => Math.min(prev + 1, activeQuestions.length - 1));
                }}
                disabled={!currentQuestionAnswered}
                style={[portalStyles.chatSendBtn, { opacity: !currentQuestionAnswered ? 0.6 : 1 }]}
              >
                <Text style={portalStyles.chatSendText}>Next Question</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {attempt ? (
          <View style={{ gap: 10 }}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Course Quiz Result</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              {Number(attempt.correctAnswers || 0)}/{Number(attempt.totalQuestions || 0)} correct
            </Text>
            <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 20 }}>
              Score: {Math.round(Number(attempt.scorePercentage || 0))}%
            </Text>

            {Number(attempt.scorePercentage || 0) >= PASSING_SCORE_PERCENTAGE ? (
              <View style={{ borderWidth: 1, borderColor: '#86efac', backgroundColor: '#ecfdf5', borderRadius: 10, padding: 10, gap: 6 }}>
                <Text style={{ color: '#047857', fontWeight: '700' }}>Congratulations! You passed the quiz.</Text>
                {attempt.certificateId ? (
                  <Pressable onPress={onOpenCertificates} style={portalStyles.secondaryBtn}>
                    <Text style={portalStyles.secondaryBtnText}>View Certificate</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {showEvaluationPrompt ? (
              <View style={{ borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, padding: 10, gap: 8 }}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Rate This Course</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable key={`rate-${value}`} onPress={() => setRating(value)} style={portalStyles.secondaryBtn}>
                      <Text style={[portalStyles.secondaryBtnText, { color: value <= rating ? '#f59e0b' : '#64748b' }]}>★</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  multiline
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Optional feedback..."
                  placeholderTextColor="#94a3b8"
                  style={[portalStyles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                />
                {evaluationError ? <Text style={{ color: '#b91c1c' }}>{evaluationError}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={handleSubmitEvaluation} disabled={savingEvaluation} style={portalStyles.chatSendBtn}>
                    <Text style={portalStyles.chatSendText}>{savingEvaluation ? 'Saving...' : 'Submit Evaluation'}</Text>
                  </Pressable>
                  <Pressable onPress={handleSkipEvaluation} disabled={savingEvaluation} style={portalStyles.secondaryBtn}>
                    <Text style={portalStyles.secondaryBtnText}>Skip</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {attemptAnswers.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Answers</Text>
                {attemptAnswers.map((row, idx) => (
                  <View key={String(row?.id || `ans-${idx}`)} style={{ borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, padding: 10, gap: 6 }}>
                    <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{row?.questionText || 'Question'}</Text>
                    <Text style={{ color: row?.isCorrect ? '#059669' : '#b91c1c', fontWeight: '700' }}>
                      {row?.isCorrect ? 'Correct' : 'Wrong'}
                    </Text>
                    <Text style={{ color: theme.textMuted }}>Your answer: {row?.selectedAnswer || 'No answer'}</Text>
                    <Text style={{ color: theme.textMuted }}>Correct answer: {row?.correctAnswer || '-'}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable onPress={startQuiz} disabled={starting} style={portalStyles.chatSendBtn}>
                <Text style={portalStyles.chatSendText}>{starting ? 'Preparing...' : 'Try Again'}</Text>
              </Pressable>
              <Pressable onPress={onBackToCourse} style={portalStyles.secondaryBtn}>
                <Text style={portalStyles.secondaryBtnText}>Back to course</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {error ? <Text style={{ color: '#b91c1c' }}>{error}</Text> : null}
      </View>
    </View>
  );
}
