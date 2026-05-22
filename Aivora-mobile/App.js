import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

const RAW_WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000';

function getRuntimeWebUrl() {
  const hostCandidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.manifest2?.extra?.expoClient?.hostUri,
    Constants?.manifest?.debuggerHost,
    Constants?.manifest?.hostUri,
  ];

  for (const candidate of hostCandidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const withoutProtocol = candidate.replace(/^[a-z]+:\/\//i, '');
    const host = withoutProtocol.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  return 'http://localhost:3000';
}

function normalizeWebUrl(url) {
  if (!url) {
    return getRuntimeWebUrl();
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    if (Platform.OS === 'android') {
      return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
    return getRuntimeWebUrl();
  }

  if (Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return url;
}

export default function App() {
  const [loadError, setLoadError] = useState(false);
  const webUrl = useMemo(() => normalizeWebUrl(RAW_WEB_URL), []);

  if (loadError) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Failed to load website</Text>
        <Text style={styles.subtitle}>Check your web server and URL:</Text>
        <Text style={styles.url}>{webUrl}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setLoadError(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <WebView
        source={{ uri: webUrl }}
        style={styles.webview}
        startInLoadingState
        cacheEnabled={false}
        incognito
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures={false}
        onError={() => setLoadError(true)}
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0f766e" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
  },
  url: {
    marginTop: 6,
    fontSize: 14,
    color: '#0f766e',
    textAlign: 'center',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
