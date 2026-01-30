# 📱 Mobile Integration Guide

This guide covers how to integrate the generated NestJS backend with mobile applications (Flutter, React Native).

---

## Table of Contents

1. [Authentication](#authentication)
2. [Device Management](#device-management)
3. [Biometric Authentication (Passkeys)](#biometric-authentication)
4. [Push Notifications](#push-notifications)
5. [Offline Sync](#offline-sync)
6. [Best Practices](#best-practices)

---

## Authentication

### Mobile vs Web Authentication

| Aspect | Web | Mobile |
|--------|-----|--------|
| Token Storage | HttpOnly Cookies | Secure Storage (Keychain/Keystore) |
| CSRF Protection | Required | Not required (Bearer auth immune) |
| Token Refresh | Cookie-based | Explicit refresh endpoint |

### JWT Authentication Flow

```
┌─────────────┐         ┌─────────────┐
│   Mobile    │         │   Backend   │
│    App      │         │   (NestJS)  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │  POST /auth/login     │
       │  {email, password}    │
       │──────────────────────►│
       │                       │
       │  {accessToken,        │
       │   refreshToken, user} │
       │◄──────────────────────│
       │                       │
       │  Store tokens in      │
       │  Secure Storage       │
       │                       │
       │  GET /api/resource    │
       │  Authorization: Bearer│
       │──────────────────────►│
       │                       │
       │  Protected data       │
       │◄──────────────────────│
```

### Flutter Example

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

class AuthService {
  final _storage = FlutterSecureStorage();
  final _dio = Dio(BaseOptions(baseUrl: 'https://api.example.com'));
  
  Future<void> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    
    await _storage.write(key: 'accessToken', value: response.data['accessToken']);
    await _storage.write(key: 'refreshToken', value: response.data['refreshToken']);
  }
  
  Future<String?> getAccessToken() => _storage.read(key: 'accessToken');
  
  Future<void> setupInterceptor() async {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Auto-refresh token
          await refreshToken();
          // Retry request
        }
        handler.next(error);
      },
    ));
  }
}
```

### React Native Example

```javascript
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const api = axios.create({ baseUrl: 'https://api.example.com' });

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      // Retry original request
    }
    return Promise.reject(error);
  }
);
```

---

## Device Management

### Registering a Device

Call this on every app start to track the device session:

```dart
// Flutter
Future<void> registerDevice() async {
  final deviceInfo = DeviceInfoPlugin();
  final info = Platform.isIOS 
      ? await deviceInfo.iosInfo 
      : await deviceInfo.androidInfo;
  
  await api.post('/auth/devices', data: {
    'deviceId': info.identifierForVendor ?? uuid.v4(),
    'deviceName': info.name,
    'platform': Platform.isIOS ? 'ios' : 'android',
    'pushToken': await FirebaseMessaging.instance.getToken(),
  });
}
```

### Managing Devices

```javascript
// React Native - List devices
const devices = await api.get('/auth/devices');

// Logout specific device
await api.delete(`/auth/devices/${deviceId}`);

// Logout all other devices
await api.delete('/auth/devices', { data: { currentDeviceId } });
```

---

## Biometric Authentication

### WebAuthn/Passkey Flow

```
1. Registration (Add Passkey)
   POST /auth/webauthn/register/options → Challenge
   Device Biometric Prompt → Credential
   POST /auth/webauthn/register/verify → Stored
   
2. Authentication (Login with Passkey)
   POST /auth/webauthn/authenticate/options → Challenge
   Device Biometric Prompt → Signature
   POST /auth/webauthn/authenticate/verify → JWT Tokens
```

### Flutter (local_auth + passkeys)

```dart
import 'package:local_auth/local_auth.dart';
import 'package:passkeys/passkeys.dart';

class BiometricService {
  final _localAuth = LocalAuthentication();
  final _passkeys = PasskeysPlugin();
  
  Future<bool> canUseBiometrics() async {
    return await _localAuth.canCheckBiometrics 
        && await _localAuth.isDeviceSupported();
  }
  
  Future<void> registerPasskey() async {
    // Get options from server
    final options = await api.post('/auth/webauthn/register/options');
    
    // Create credential with biometrics
    final credential = await _passkeys.register(options.data);
    
    // Verify with server
    await api.post('/auth/webauthn/register/verify', data: {
      'response': credential,
      'friendlyName': 'My iPhone',
    });
  }
  
  Future<void> loginWithBiometrics() async {
    final options = await api.post('/auth/webauthn/authenticate/options');
    final assertion = await _passkeys.authenticate(options.data);
    
    final response = await api.post('/auth/webauthn/authenticate/verify', data: {
      'response': assertion,
      'challengeKey': options.data['_challengeKey'],
    });
    
    // Store tokens
    await storage.write(key: 'accessToken', value: response.data['accessToken']);
  }
}
```

---

## Push Notifications

### Setup FCM

```dart
// Flutter
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> setupPushNotifications() async {
  final fcm = FirebaseMessaging.instance;
  
  // Request permission
  await fcm.requestPermission();
  
  // Get token
  final token = await fcm.getToken();
  
  // Send to backend
  await api.patch('/auth/devices/$deviceId/push-token', data: {
    'pushToken': token,
  });
  
  // Listen for token refresh
  fcm.onTokenRefresh.listen((newToken) async {
    await api.patch('/auth/devices/$deviceId/push-token', data: {
      'pushToken': newToken,
    });
  });
  
  // Handle foreground messages
  FirebaseMessaging.onMessage.listen((message) {
    // Show local notification
  });
}
```

---

## Offline Sync

### Delta Sync Pattern

```dart
class SyncService {
  int _lastSyncTimestamp = 0;
  
  Future<void> pullChanges() async {
    final response = await api.post('/sync/pull', data: {
      'sinceTimestamp': _lastSyncTimestamp,
      'modelNames': ['Post', 'Comment'],
    });
    
    final changes = response.data['changes'];
    for (final change in changes) {
      switch (change['operation']) {
        case 'create':
        case 'update':
          await _localDb.upsert(change['modelName'], change['data']);
          break;
        case 'delete':
          await _localDb.delete(change['modelName'], change['id']);
          break;
      }
    }
    
    _lastSyncTimestamp = response.data['serverTimestamp'];
    
    // Handle pagination
    if (response.data['hasMore']) {
      await pullChanges(); // Recursive
    }
  }
  
  Future<void> pushChanges() async {
    final pendingChanges = await _localDb.getPendingChanges();
    
    final records = pendingChanges.map((c) => {
      'modelName': c.modelName,
      'operation': c.operation,
      'id': c.id,
      'data': c.data,
      'clientTimestamp': c.timestamp,
      'idempotencyKey': c.idempotencyKey, // UUID generated on device
    }).toList();
    
    final response = await api.post('/sync/push', data: { 'records': records });
    
    for (final result in response.data['results']) {
      if (result['status'] == 'success') {
        await _localDb.markSynced(result['id']);
      } else if (result['status'] == 'conflict') {
        // Handle conflict based on strategy
        await _handleConflict(result);
      }
    }
  }
}
```

---

## Best Practices

### Token Storage

| Platform | Recommended Storage |
|----------|---------------------|
| iOS | Keychain (via flutter_secure_storage) |
| Android | EncryptedSharedPreferences / Keystore |
| React Native | expo-secure-store / react-native-keychain |

### Network Handling

1. **Use interceptors** for automatic token attachment
2. **Implement retry logic** with exponential backoff
3. **Queue requests** when offline for later sync

### Security Checklist

- [ ] Store tokens in secure storage, never in plain preferences
- [ ] Use certificate pinning in production
- [ ] Validate all server responses
- [ ] Implement session timeout
- [ ] Allow device revocation from settings

---

## Environment Variables

```env
# Required for mobile features
WEBAUTHN_RP_ID=example.com
WEBAUTHN_RP_NAME=My App
WEBAUTHN_ORIGIN=https://example.com

# Push notifications
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```
