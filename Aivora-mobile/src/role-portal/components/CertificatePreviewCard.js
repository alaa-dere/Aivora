import { Image, ImageBackground, Pressable, Text, View, useWindowDimensions } from 'react-native';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const buildAssetUrl = (baseUrl, assetPath) => {
  const cleanBase = normalizeBaseUrl(baseUrl);
  if (!cleanBase) return '';
  const cleanPath = String(assetPath || '').startsWith('/') ? assetPath : `/${assetPath}`;
  return `${cleanBase}${cleanPath}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US');
};

export default function CertificatePreviewCard({
  certificate,
  theme,
  baseUrl,
  onBack,
  onDownload,
  downloading = false,
}) {
  const { width } = useWindowDimensions();
  const templateUrl = buildAssetUrl(baseUrl, '/tem.png');
  const logoUrl = buildAssetUrl(baseUrl, '/alaa.png');
  const canvasWidth = Math.min(Math.max(width - 32, 280), 920);
  const scale = canvasWidth / 920;
  const scaled = (value) => Math.max(8, Math.round(value * scale));

  if (!certificate) return null;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={onBack}
          style={[{ alignSelf: 'flex-start' }, { paddingHorizontal: 8, paddingVertical: 4 }]}
        >
          <Text style={{ color: '#2563eb', fontWeight: '700' }}>Back to list</Text>
        </Pressable>
        <Pressable
          onPress={onDownload}
          disabled={downloading || typeof onDownload !== 'function'}
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: '#2563eb',
            opacity: downloading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>
            {downloading ? 'Preparing...' : 'Download PDF'}
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          width: '100%',
          borderWidth: 1,
          borderColor: theme.cardBorder,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {templateUrl ? (
          <ImageBackground
            source={{ uri: templateUrl }}
            resizeMode="cover"
            style={{ width: '100%', aspectRatio: 1.414 }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                paddingHorizontal: '8.5%',
                paddingVertical: '6.5%',
              }}
            >
              <View style={{ marginTop: '12.5%' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      color: '#0b2b5a',
                      textTransform: 'uppercase',
                      letterSpacing: 0.16 * scaled(16),
                      fontSize: scaled(20),
                      fontWeight: '700',
                    }}
                  >
                    Certificate
                  </Text>
                  <Text
                    style={{
                      marginTop: scaled(2),
                      color: 'rgba(11,43,90,0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.16 * scaled(10),
                      fontSize: scaled(12),
                      fontWeight: '700',
                    }}
                  >
                    Of Appreciation
                  </Text>
                </View>

                <Text
                  style={{
                    marginTop: '4%',
                    textAlign: 'center',
                    color: 'rgba(11,43,90,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.15 * scaled(11),
                    fontSize: scaled(11),
                    fontWeight: '600',
                  }}
                >
                  This certificate is proudly presented to
                </Text>

                <Text
                  style={{
                    marginTop: '2.5%',
                    textAlign: 'center',
                    color: '#0b2b5a',
                    fontSize: scaled(36),
                    fontWeight: '700',
                  }}
                  numberOfLines={1}
                >
                  {certificate.studentName || '-'}
                </Text>

                <Text
                  style={{
                    marginTop: '2.5%',
                    textAlign: 'center',
                    color: 'rgba(11,43,90,0.8)',
                    fontSize: scaled(14),
                  }}
                >
                  for successfully completing
                </Text>
                <Text
                  style={{
                    marginTop: '1%',
                    textAlign: 'center',
                    color: '#0b2b5a',
                    fontSize: scaled(20),
                    fontWeight: '700',
                  }}
                  numberOfLines={1}
                >
                  {certificate.courseTitle || '-'}
                </Text>

                <Text
                  style={{
                    marginTop: '3%',
                    textAlign: 'center',
                    alignSelf: 'center',
                    maxWidth: '70%',
                    color: 'rgba(11,43,90,0.75)',
                    fontSize: scaled(12),
                    lineHeight: scaled(16),
                  }}
                >
                  This achievement reflects dedication, persistence, and mastery of the required
                  learning outcomes for this course.
                </Text>

                <View style={{ marginTop: '4%', alignItems: 'flex-end' }}>
                  {logoUrl ? (
                    <Image
                      source={{ uri: logoUrl }}
                      resizeMode="contain"
                      style={{
                        width: scaled(96),
                        height: scaled(30),
                        marginBottom: scaled(2),
                        tintColor: '#0b2b5a',
                      }}
                    />
                  ) : null}
                  <View
                    style={{
                      width: scaled(128),
                      height: 1,
                      backgroundColor: 'rgba(11,43,90,0.6)',
                    }}
                  />
                  <Text
                    style={{
                      marginTop: scaled(4),
                      color: 'rgba(11,43,90,0.85)',
                      fontSize: scaled(12),
                    }}
                  >
                    Issuer Date: {formatDate(certificate.issuedAt)}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#0b2b5a', fontWeight: '700', marginBottom: 6 }}>
              Certificate Preview
            </Text>
            <Text style={{ color: '#334155' }}>
              Unable to load certificate template image. Please check your API base URL.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
