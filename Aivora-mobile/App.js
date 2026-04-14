import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import RolePortalScreen from './RolePortalScreen';
import {
  apiFetch,
  getActiveApiBaseUrl,
  toImageSource,
} from './src/services/api-client';

const navItemsEn = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Courses', id: 'courses' },
  { name: 'Feedback', id: 'testimonials' },
  { name: 'Contact', id: 'contact' },
];

const navItemsAr = [
  { name: 'الرئيسية', id: 'home' },
  { name: 'عنا', id: 'about' },
  { name: 'الدورات', id: 'courses' },
  { name: 'آراء الطلاب', id: 'testimonials' },
  { name: 'اتصل بنا', id: 'contact' },
];

const testimonialsEn = [
  {
    name: 'Sarah Mohammed',
    role: 'Full-Stack Developer',
    content: 'Aivora changed my career completely!',
    avatar:
      'https://images.unsplash.com/photo-1494790108777-223d9d6b9f4f?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'Omar Hassan',
    role: 'Data Scientist',
    content: 'Best platform for practical learning.',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'Lina Khalil',
    role: 'UI/UX Designer',
    content: 'Amazing projects and feedback.',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
  },
];

const testimonialsAr = [
  {
    name: 'سارة محمد',
    role: 'مطور Full-Stack',
    content: 'أيڤورا غيرت مسيرتي المهنية بالكامل!',
    avatar:
      'https://images.unsplash.com/photo-1494790108777-223d9d6b9f4f?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'عمر حسن',
    role: 'عالم بيانات',
    content: 'أفضل منصة للتعلم العملي والتطبيقي.',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'لينا خليل',
    role: 'مصممة واجهات وتجربة مستخدم',
    content: 'مشاريع رائعة وملاحظات مفيدة جدا.',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
  },
];

const sampleCourses = [
  {
    id: 'ai-foundations',
    title: 'AI Foundations',
    instructor: 'Aivora Team',
    duration: '6 Weeks',
    students: '1.2k',
    price: 89,
    image: require('./assets/p3.png'),
  },
  {
    id: 'fullstack',
    title: 'Full-Stack Development',
    instructor: 'Aivora Team',
    duration: '8 Weeks',
    students: '980',
    price: 129,
    image: require('./assets/p4.png'),
  },
  {
    id: 'uiux',
    title: 'UI/UX Essentials',
    instructor: 'Aivora Team',
    duration: '5 Weeks',
    students: '730',
    price: 69,
    image: require('./assets/p5.png'),
  },
  {
    id: 'data',
    title: 'Data & Analytics',
    instructor: 'Aivora Team',
    duration: '4 Weeks',
    students: '640',
    price: 59,
    image: require('./assets/p7.png'),
  },
];

function HomeScreen({ onLoginPress, onLogoutPress, onWorkspacePress, user }) {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState('en');
  const [courses, setCourses] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const isArabic = language === 'ar';
  const navItems = isArabic ? navItemsAr : navItemsEn;
  const testimonials =
    feedbacks.length > 0
      ? feedbacks.map((item) => ({
          name: item.name,
          role: item.role,
          content: item.content,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            item.name || 'Student'
          )}&background=2563eb&color=fff`,
          rating: Number(item.rating || 0),
        }))
      : isArabic
      ? testimonialsAr
      : testimonialsEn;
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError('');
        const res = await apiFetch('/api/home', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to fetch courses');
        }
        setCourses(Array.isArray(data.data) ? data.data : []);
        setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      } catch (error) {
        setCoursesError(`Failed to load courses (${getActiveApiBaseUrl()})`);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const openExternal = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('unsupported url');
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Unable to open link',
        'Please make sure the required app is installed on your phone.'
      );
    }
  };

  const scrollTo = (id) => {
    const target = sectionRefs.current[id];
    if (!target || !scrollRef.current) return;
    target.measureLayout(
      scrollRef.current,
      (x, y) => {
        scrollRef.current.scrollTo({ y: Math.max(y - 20, 0), animated: true });
      },
      () => {}
    );
  };

  return (
    <SafeAreaView style={homeStyles.page}>
      <ImageBackground
        source={
          isDark
            ? require('./assets/plain2dd.png')
            : require('./assets/plain2.png')
        }
        style={homeStyles.background}
        imageStyle={homeStyles.backgroundImage}
      >
        <View
          style={[
            homeStyles.overlay,
            isDark ? homeStyles.overlayDark : homeStyles.overlayLight,
          ]}
        />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={homeStyles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              homeStyles.header,
              isDark ? homeStyles.headerDark : homeStyles.headerLight,
            ]}
          >
            <Image
              source={require('./assets/alaa.png')}
              style={[
                homeStyles.headerLogo,
                isDark ? homeStyles.headerLogoDark : homeStyles.headerLogoLight,
              ]}
              resizeMode="contain"
            />
            <View style={homeStyles.headerActions}>
              <Pressable
                onPress={() => setIsDark((prev) => !prev)}
                style={[
                  homeStyles.headerButton,
                  isDark ? homeStyles.headerButtonDark : homeStyles.headerButtonLight,
                ]}
                accessibilityLabel="Toggle theme"
              >
                <Ionicons
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={isDark ? '#ffffff' : '#000000'}
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))
                }
                style={[
                  homeStyles.headerButton,
                  isDark ? homeStyles.headerButtonDark : homeStyles.headerButtonLight,
                ]}
              >
                <Text
                  style={[
                    homeStyles.headerButtonText,
                    isDark ? homeStyles.headerTextDark : homeStyles.headerTextLight,
                  ]}
                >
                  {isArabic ? 'EN' : 'AR'}
                </Text>
              </Pressable>
              {user ? (
                <>
                  <Pressable
                    onPress={onWorkspacePress}
                    style={[
                      homeStyles.headerButton,
                      isDark ? homeStyles.headerButtonDark : homeStyles.headerButtonLight,
                    ]}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={isDark ? '#ffffff' : '#000000'}
                    />
                    <Text
                      style={[
                        homeStyles.headerButtonText,
                        isDark ? homeStyles.headerTextDark : homeStyles.headerTextLight,
                      ]}
                    >
                      Workspace
                    </Text>
                  </Pressable>
                  <View style={homeStyles.userChip}>
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={isDark ? '#ffffff' : '#0b1e2d'}
                    />
                    <Text
                      style={[
                        homeStyles.userChipText,
                        isDark ? homeStyles.headerTextDark : homeStyles.headerTextLight,
                      ]}
                      numberOfLines={1}
                    >
                      {user.fullName || user.email}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onLogoutPress}
                    style={[
                      homeStyles.headerButton,
                      isDark ? homeStyles.headerButtonDark : homeStyles.headerButtonLight,
                    ]}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color={isDark ? '#ffffff' : '#000000'}
                    />
                    <Text
                      style={[
                        homeStyles.headerButtonText,
                        isDark ? homeStyles.headerTextDark : homeStyles.headerTextLight,
                      ]}
                    >
                      Logout
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={onLoginPress}
                  style={[
                    homeStyles.headerButton,
                    isDark ? homeStyles.headerButtonDark : homeStyles.headerButtonLight,
                  ]}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={18}
                    color={isDark ? '#ffffff' : '#000000'}
                  />
                  <Text
                    style={[
                      homeStyles.headerButtonText,
                      isDark ? homeStyles.headerTextDark : homeStyles.headerTextLight,
                    ]}
                  >
                    {isArabic ? 'Login' : 'Login'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={homeStyles.navRow}>
            {navItems.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  homeStyles.navPill,
                  isDark ? homeStyles.navPillDark : homeStyles.navPillLight,
                ]}
                onPress={() => scrollTo(item.id)}
              >
                <Text
                  style={[
                    homeStyles.navPillText,
                    isDark ? homeStyles.headerTextDark : homeStyles.headerTextLight,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            ref={(node) => {
              sectionRefs.current.home = node;
            }}
            style={[
              homeStyles.hero,
              isDark ? homeStyles.cardDark : homeStyles.cardLight,
            ]}
          >
            <View style={homeStyles.heroRow}>
              <View style={homeStyles.heroText}>
                <View style={homeStyles.heroBadge}>
                  <Text style={homeStyles.heroBadgeText}>
                    {isArabic ? 'مرحبا بك في أيڤورا' : 'Welcome to Aivora'}
                  </Text>
                </View>
                <Text style={homeStyles.heroTitle}>
                  Ai<Text style={homeStyles.heroTitleAccent}>vora</Text>
                </Text>
                <Text style={homeStyles.heroSubtitle}>
                  {isArabic
                    ? 'تعلم أذكى. بنِ أسرع.'
                    : 'Learn Smarter. Build Faster.'}
                </Text>
                <Text style={homeStyles.heroBody}>
                  {isArabic
                    ? 'أيڤورا منصة تعلم حديثة تساعد الطلاب والمحترفين على إتقان الذكاء الاصطناعي والبرمجة والمهارات الرقمية عبر دورات عملية ومشاريع واقعية.'
                    : 'Aivora is a modern learning platform that helps students and professionals master AI, programming, and digital skills through practical courses and real projects.'}
                </Text>
                <View style={homeStyles.heroButtons}>
                  <Pressable
                    style={homeStyles.primaryBtn}
                    onPress={() => scrollTo('courses')}
                  >
                    <Text style={homeStyles.primaryBtnText}>
                      {isArabic ? 'استكشف الدورات' : 'Explore Courses'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={homeStyles.secondaryBtn}
                    onPress={() => scrollTo('about')}
                  >
                    <Text style={homeStyles.secondaryBtnText}>
                      {isArabic ? 'تعرف أكثر' : 'Learn More'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View
            ref={(node) => {
              sectionRefs.current.about = node;
            }}
            style={[
              homeStyles.section,
              isDark ? homeStyles.cardDark : homeStyles.cardLight,
            ]}
          >
            <Text style={homeStyles.sectionLabel}>
              {isArabic ? 'عن أيڤورا' : 'About Aivora'}
            </Text>
            <Text style={homeStyles.sectionTitle}>
              {isArabic ? 'اكتشف ' : 'Discover '}
              <Text style={homeStyles.sectionTitleAccent}>
                {isArabic ? 'أيڤورا' : 'Aivora'}
              </Text>
            </Text>
            <Text style={homeStyles.sectionBody}>
              {isArabic
                ? 'أيڤورا منصة تعلم ذكية مدعومة بالذكاء الاصطناعي، تهدف إلى جعل التعلم أسهل وأكثر تفاعلية عبر مسارات منظمة، اختبارات تفاعلية، ومساعدة فورية.'
                : 'Aivora is an intelligent learning platform powered by AI, designed to make learning easier and more interactive through structured paths, quizzes, and instant assistance.'}
            </Text>
          </View>

          <View
            ref={(node) => {
              sectionRefs.current.courses = node;
            }}
            style={[
              homeStyles.section,
              isDark ? homeStyles.cardDark : homeStyles.cardLight,
            ]}
          >
            <Text style={homeStyles.sectionLabel}>
              {isArabic ? 'استكشف التعلم' : 'Explore Learning'}
            </Text>
            <Text style={homeStyles.sectionTitle}>
              {isArabic ? 'الدورات ' : 'Popular '}
              <Text style={homeStyles.sectionTitleAccent}>
                {isArabic ? 'الشائعة' : 'Courses'}
              </Text>
            </Text>
            {coursesLoading ? (
              <Text style={homeStyles.loadingText}>
                {isArabic ? 'جارٍ تحميل الدورات...' : 'Loading courses...'}
              </Text>
            ) : coursesError ? (
              <Text style={homeStyles.errorText}>
                {isArabic ? 'فشل تحميل الدورات' : coursesError}
              </Text>
            ) : courses.length === 0 ? (
              <Text style={homeStyles.loadingText}>
                {isArabic ? 'لا توجد دورات حالياً' : 'No courses available right now'}
              </Text>
            ) : (
              <View style={homeStyles.courseGrid}>
                {courses.map((course) => (
                  <View
                    key={course.id}
                    style={[
                      homeStyles.courseCard,
                      isDark ? homeStyles.cardDark : homeStyles.cardLight,
                    ]}
                  >
                    <Image
                      source={toImageSource(course.image, require('./assets/p3.png'))}
                      style={homeStyles.courseImage}
                      resizeMode="cover"
                    />
                    <Text style={homeStyles.courseMeta}>
                      {isArabic ? 'بواسطة ' : 'By '}
                      {course.instructor}
                    </Text>
                    <Text style={homeStyles.courseTitle}>{course.title}</Text>
                    <View style={homeStyles.courseStats}>
                      <Text style={homeStyles.courseStat}>{course.duration}</Text>
                      <Text style={homeStyles.courseStat}>{course.students}</Text>
                    </View>
                    <View style={homeStyles.courseFooter}>
                      <Text style={homeStyles.coursePrice}>${course.price}</Text>
                      <View style={homeStyles.courseBtn}>
                        <Text style={homeStyles.courseBtnText}>
                          {isArabic ? 'عرض الدورة' : 'View Course'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View
            ref={(node) => {
              sectionRefs.current.testimonials = node;
            }}
            style={[
              homeStyles.section,
              isDark ? homeStyles.cardDark : homeStyles.cardLight,
            ]}
          >
            <Text style={homeStyles.sectionLabel}>
              {isArabic ? 'أصوات الطلاب' : 'Student Voices'}
            </Text>
            <Text style={homeStyles.sectionTitle}>
              {isArabic ? 'آراء ' : 'Student '}
              <Text style={homeStyles.sectionTitleAccent}>
                {isArabic ? 'الطلاب' : 'Feedback'}
              </Text>
            </Text>
            {testimonials.map((t) => (
              <View
                key={t.name}
                style={[
                  homeStyles.testimonialCard,
                  isDark ? homeStyles.cardDark : homeStyles.cardLight,
                ]}
              >
                <View style={homeStyles.testimonialHeader}>
                  <Image
                    source={
                      t.avatar
                        ? { uri: t.avatar }
                        : require('./assets/p3.png')
                    }
                    style={homeStyles.testimonialAvatar}
                  />
                  <View>
                    <Text style={homeStyles.testimonialName}>{t.name}</Text>
                    <Text style={homeStyles.testimonialRole}>{t.role}</Text>
                  </View>
                </View>
                <Text style={homeStyles.testimonialText}>"{t.content}"</Text>
                <View style={homeStyles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={`${t.name}-star-${i}`}
                      name={i < Math.floor(Number(t.rating || 0)) ? 'star' : 'star-outline'}
                      size={14}
                      color="#facc15"
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View
            ref={(node) => {
              sectionRefs.current.contact = node;
            }}
            style={[
              homeStyles.section,
              isDark ? homeStyles.cardDark : homeStyles.cardLight,
            ]}
          >
            <Text style={homeStyles.sectionLabel}>
              {isArabic ? 'ابق على اتصال' : 'Get In Touch'}
            </Text>
            <Text style={homeStyles.sectionTitle}>
              {isArabic ? 'اتصل ب' : 'Contact '}
              <Text style={homeStyles.sectionTitleAccent}>
                {isArabic ? 'أيڤورا' : 'Aivora'}
              </Text>
            </Text>
            <View style={homeStyles.contactGrid}>
              <Pressable
                style={[
                  homeStyles.contactCard,
                  isDark ? homeStyles.cardDark : homeStyles.cardLight,
                ]}
                onPress={() =>
                  openExternal(
                    'https://mail.google.com/mail/?view=cm&fs=1&to=alaadere35@gmail.com'
                  )
                }
              >
                <Text style={homeStyles.contactTitle}>Email</Text>
                <Text style={homeStyles.contactBody}>Send us your questions anytime.</Text>
                <Text style={homeStyles.contactLink}>alaadere35@gmail.com</Text>
              </Pressable>
              <Pressable
                style={[
                  homeStyles.contactCard,
                  isDark ? homeStyles.cardDark : homeStyles.cardLight,
                ]}
                onPress={() => openExternal('https://wa.me/972597889750')}
              >
                <Text style={homeStyles.contactTitle}>Phone</Text>
                <Text style={homeStyles.contactBody}>+972 597 889 750</Text>
                <Text style={homeStyles.contactLink}>WhatsApp</Text>
              </Pressable>
              <Pressable
                style={[
                  homeStyles.contactCard,
                  isDark ? homeStyles.cardDark : homeStyles.cardLight,
                ]}
                onPress={() => openExternal('https://www.instagram.com/aivora_gb/')}
              >
                <Text style={homeStyles.contactTitle}>Instagram</Text>
                <Text style={homeStyles.contactBody}>@aivora_gb</Text>
                <Text style={homeStyles.contactLink}>Open profile</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const profileRes = await apiFetch('/api/profile/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!profileRes.ok) return;
        const profileData = await profileRes.json();
        const email = profileData?.user?.email;
        if (!email) return;

        const roleRes = await apiFetch(`/api/auth/check?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const roleData = await roleRes.json();

        if (!isMounted) return;
        setUser({
          ...profileData.user,
          role: roleData?.role || 'student',
        });
        setScreen('portal');
      } catch (error) {
        // keep default home screen if session cannot be restored
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch (error) {
      console.log('Logout request failed:', error);
    } finally {
      setUser(null);
      setScreen('home');
    }
  };

  if (isBootstrapping) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.bootstrapWrap}>
            <ActivityIndicator size="large" color="#003153" />
            <Text style={styles.bootstrapText}>Restoring your session...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === 'home' ? (
        <HomeScreen
          user={user}
          onLoginPress={() => setScreen('auth')}
          onWorkspacePress={() => setScreen('portal')}
          onLogoutPress={handleLogout}
        />
      ) : screen === 'portal' ? (
        <RolePortalScreen
          user={user}
          onBackHome={() => setScreen('home')}
          onLogout={handleLogout}
          apiFetch={apiFetch}
        />
      ) : (
        <AuthScreen
          onBack={() => setScreen('home')}
          onAuthSuccess={(nextUser) => {
            setUser(nextUser);
            setScreen('portal');
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

function AuthScreen({ onBack, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const transition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isLogin ? 0 : 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isLogin, transition]);

  const headline = useMemo(
    () => (isLogin ? 'Sign In' : 'Create Account'),
    [isLogin]
  );
  const subtitle = useMemo(
    () =>
      isLogin
        ? 'Welcome back! Please sign in.'
        : 'Start your learning journey today.',
    [isLogin]
  );

  const handleSubmit = async () => {
    setErr('');
    setSuccess('');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setErr('Please enter your email and password.');
      return;
    }
    if (!isLogin && fullName.trim().length < 3) {
      setErr('Please enter your full name.');
      return;
    }
    if (!isLogin && normalizedPassword.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const loginRes = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: normalizedEmail,
            password: normalizedPassword,
          }),
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok || !loginData?.success || !loginData?.user) {
          setErr(loginData?.message || 'Invalid email or password.');
          return;
        }

        setSuccess('Login successful. Redirecting...');
        onAuthSuccess?.(loginData.user);
        return;
      }

      const registerRes = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });
      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setErr(registerData?.message || 'Registration failed. Please try again.');
        return;
      }

      const loginAfterSignUpRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });
      const loginAfterSignUpData = await loginAfterSignUpRes.json();

      if (
        !loginAfterSignUpRes.ok ||
        !loginAfterSignUpData?.success ||
        !loginAfterSignUpData?.user
      ) {
        setSuccess('Account created. Please sign in.');
        setIsLogin(true);
        return;
      }

      setSuccess('Account created successfully. Redirecting...');
      onAuthSuccess?.(loginAfterSignUpData.user);
    } catch (error) {
      setErr('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErr('Enter your email first to reset password.');
      return;
    }

    try {
      setErr('');
      setSuccess('');
      setLoading(true);

      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErr(data?.message || 'Failed to send reset link.');
        return;
      }

      setSuccess(data?.message || 'Reset link sent to your email.');
    } catch (error) {
      setErr('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <Pressable style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={18} color="#0b1e2d" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
          <View style={styles.backgroundWrap} pointerEvents="none">
            <Animated.View
              style={[
                styles.gradientCircle,
                {
                  transform: [
                    {
                      translateY: transition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#0a2540', '#0f3d63', '#031625']}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
                style={styles.gradientFill}
              />
            </Animated.View>
          <Animated.View
              style={[
                styles.backgroundLogo,
                {
                  transform: [
                    {
                      translateY: transition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {isLogin ? (
                <View style={styles.logoMask}>
                  <Image
                    source={require('./assets/aivora2.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Image
                  source={require('./assets/aivora2.png')}
                  style={styles.logoFull}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          </View>

          <View style={styles.content}>
            <Animated.View
              style={[
                styles.brandHeader,
                {
                  transform: [
                    {
                      translateY: transition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('./assets/aivora2.png')}
                style={styles.logoForeground}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.formCard,
                {
                  zIndex: 2,
                  transform: [
                    {
                      scale: transition.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.015, 1],
                      }),
                    },
                    {
                      scaleY: transition.interpolate({
                        inputRange: [0, 0.35, 0.7, 1],
                        outputRange: [1, 1.02, 1.03, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.formTitle}>{headline}</Text>
              <Text style={styles.formSubtitle}>{subtitle}</Text>

              {err ? (
                <View style={styles.alertError}>
                  <Text style={styles.alertTextError}>{err}</Text>
                </View>
              ) : null}
              {success ? (
                <View style={styles.alertSuccess}>
                  <Text style={styles.alertTextSuccess}>{success}</Text>
                </View>
              ) : null}

              {!isLogin && (
                <>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="John Doe"
                    placeholderTextColor="#8aa2b2"
                    autoCapitalize="words"
                    style={styles.input}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#8aa2b2"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  placeholderTextColor="#8aa2b2"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.toggleButton}
                >
                  <Text style={styles.toggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>

              {!isLogin && (
                <Text style={styles.helpText}>Must be at least 6 characters</Text>
              )}

              {isLogin ? (
                <Pressable
                  style={styles.forgotButton}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'PLEASE WAIT...' : headline.toUpperCase()}
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {isLogin ? 'Or sign in with' : 'Or sign up with'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => setErr('Google sign in is currently available on web app only.')}
              >
                <Text style={styles.secondaryButtonText}>Continue with Google</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setErr('GitHub sign in is currently available on web app only.')}
              >
                <Text style={styles.secondaryButtonText}>Continue with GitHub</Text>
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </Text>
                <Pressable
                  onPress={() => {
                    setIsLogin((prev) => !prev);
                    setErr('');
                    setSuccess('');
                  }}
                >
                  <Text style={styles.footerLink}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bootstrapWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bootstrapText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  backgroundWrap: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradientCircle: {
    position: 'absolute',
    width: 620,
    height: 620,
    borderRadius: 310,
    alignSelf: 'center',
    opacity: 0.95,
    zIndex: 1,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 310,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  brandHeader: {
    alignItems: 'center',
    marginTop: -55,
    marginBottom: 4,
  },
  logoForeground: {
    width: 210,
    height: 210,
  },
  brandText: {
    color: '#0d2637',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  backgroundLogo: {
    position: 'absolute',
    top: 410,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    opacity: 0.9,
  },
  logoMask: {
    width: 210,
    height: 130,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    width: 210,
    height: 210,
    transform: [{ translateY: -10 }],
  },
  logoFull: {
    width: 210,
    height: 210,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  formTitle: {
    color: '#132536',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  formSubtitle: {
    color: '#7a8a98',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  alertError: {
    backgroundColor: '#fdecec',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  alertTextError: {
    color: '#b42318',
    fontSize: 12,
    textAlign: 'center',
  },
  alertSuccess: {
    backgroundColor: '#e7f8ef',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  alertTextSuccess: {
    color: '#067647',
    fontSize: 12,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#23374a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9e2ea',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0b1e2d',
    marginBottom: 16,
    backgroundColor: '#f9fbfd',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 72,
    marginBottom: 8,
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  toggleText: {
    color: '#1b4a6a',
    fontWeight: '600',
  },
  helpText: {
    color: '#6b7e8d',
    fontSize: 11,
    marginBottom: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#1b4a6a',
    fontWeight: '600',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#003153',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8ee',
  },
  dividerText: {
    color: '#6b7e8d',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    width: 120,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d9e2ea',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f7f9fb',
  },
  secondaryButtonText: {
    color: '#203246',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerText: {
    color: '#6b7e8d',
    fontSize: 12,
  },
  footerLink: {
    color: '#003153',
    fontWeight: '700',
    fontSize: 12,
  },
  backButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
  },
  backText: {
    marginLeft: 4,
    color: '#0b1e2d',
    fontSize: 12,
    fontWeight: '600',
  },
});

const homeStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0b1d2c',
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  overlayDark: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerLight: {
    backgroundColor: 'rgba(250, 250, 249, 0.8)',
    borderColor: 'rgba(231, 229, 228, 0.8)',
  },
  headerDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(51, 65, 85, 0.8)',
  },
  headerLogo: {
    width: 90,
    height: 28,
  },
  headerLogoLight: {
    tintColor: '#000000',
  },
  headerLogoDark: {
    tintColor: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    maxWidth: '65%',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 130,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  userChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButtonLight: {
    backgroundColor: 'transparent',
  },
  headerButtonDark: {
    backgroundColor: 'transparent',
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerTextLight: {
    color: '#334155',
  },
  headerTextDark: {
    color: '#e2e8f0',
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 10,
    marginBottom: 18,
  },
  navPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  navPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  navPillLight: {
    backgroundColor: 'transparent',
  },
  navPillDark: {
    backgroundColor: 'transparent',
  },
  hero: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 22,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroText: {
    flexGrow: 1,
    flexBasis: 0,
    paddingRight: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#e9f2fb',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroTitleAccent: {
    color: '#9ec8ff',
  },
  heroSubtitle: {
    color: '#cfe3f8',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  heroBody: {
    color: '#d2e1f0',
    marginTop: 10,
    lineHeight: 23,
    fontSize: 14,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'nowrap',
  },
  primaryBtn: {
    backgroundColor: '#0b2d4a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  heroImage: {
    width: 120,
    height: 175,
    marginTop: 66,
    flexShrink: 0,
  },
  section: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  cardLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardDark: {
    backgroundColor: 'rgba(7, 24, 38, 0.78)',
    shadowColor: '#0b1522',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sectionLabel: {
    color: '#86b7ff',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionTitleAccent: {
    color: '#9ec8ff',
  },
  sectionBody: {
    color: '#d4e2f2',
    lineHeight: 22,
  },
  courseGrid: {
    gap: 12,
  },
  courseCard: {
    borderRadius: 18,
    padding: 14,
  },
  courseImage: {
    height: 120,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  courseMeta: {
    color: '#cfe3f8',
    fontSize: 12,
    marginBottom: 6,
  },
  courseTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  courseStat: {
    color: '#d4e2f2',
    fontSize: 12,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coursePrice: {
    color: '#9ec8ff',
    fontSize: 18,
    fontWeight: '800',
  },
  courseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  courseBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    color: '#d4e2f2',
    fontSize: 14,
    marginTop: 6,
  },
  errorText: {
    color: '#ffb4b4',
    fontSize: 14,
    marginTop: 6,
  },
  testimonialCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  testimonialHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  testimonialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  testimonialName: {
    color: '#ffffff',
    fontWeight: '700',
  },
  testimonialRole: {
    color: '#cfe3f8',
    fontSize: 12,
  },
  testimonialText: {
    color: '#d9e6f4',
    fontStyle: 'italic',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  contactGrid: {
    gap: 12,
  },
  contactCard: {
    borderRadius: 18,
    padding: 14,
  },
  contactTitle: {
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
  },
  contactBody: {
    color: '#d4e2f2',
  },
  contactLink: {
    marginTop: 8,
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '700',
  },
});
