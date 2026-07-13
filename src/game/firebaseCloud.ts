import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, logEvent, setUserProperties } from 'firebase/analytics';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { stages } from './levelData';
import { loadProgress, normalizeProgress, saveProgress } from './storage';
import type { PuppyProgress } from './types';

const firebaseConfig = {
  apiKey: 'AIzaSyCNpLPPH00pG3IEiCqn45CIjf3lcTH1428',
  authDomain: 'puppypopadventure.firebaseapp.com',
  projectId: 'puppypopadventure',
  storageBucket: 'puppypopadventure.firebasestorage.app',
  messagingSenderId: '538878093835',
  appId: '1:538878093835:web:54973fcfac0ebaccb9f50e',
  measurementId: 'G-HV4EPSJRM1',
};

export type CloudUser = {
  uid: string;
  displayName: string;
  email: string;
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let analytics: ReturnType<typeof getAnalytics> | null = null;
let currentUser: User | null = null;
let initPromise: Promise<{ available: boolean; error: unknown | null }> | null = null;
let initError: unknown = null;
let analyticsReady = false;

const userListeners = new Set<(user: CloudUser | null) => void>();

const progressRef = (uid: string) => doc(db!, 'users', uid, 'progress', 'current');

const profileRef = (uid: string) => doc(db!, 'users', uid);

const toCloudUser = (user: User | null): CloudUser | null => {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
  };
};

const notifyUserChanged = () => {
  const snapshot = toCloudUser(currentUser);
  userListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.warn('PuppyPop cloud listener failed:', error);
    }
  });
};

const getSafeErrorCode = (error: unknown) => {
  if (!error || typeof error !== 'object') return 'unknown';
  const code = 'code' in error ? error.code : 'name' in error ? error.name : 'unknown';
  return String(code || 'unknown').slice(0, 40);
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getAuthErrorMessage = (error: unknown) => {
  const code = getSafeErrorCode(error);

  switch (code) {
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return '이메일 주소를 다시 확인해 주세요.';
    case 'auth/missing-password':
      return '비밀번호를 입력해 주세요.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상으로 입력해 주세요.';
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일이에요. 이메일 로그인으로 들어와 주세요.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일과 비밀번호를 다시 확인해 주세요.';
    case 'auth/network-request-failed':
      return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
    case 'auth/popup-closed-by-user':
      return '로그인이 취소되었어요.';
    default:
      return '로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
  }
};

const trackEvent = (eventName: string, params: Record<string, string | number | boolean> = {}) => {
  if (!analyticsReady || !analytics) return;

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.warn('Failed to log Firebase Analytics event:', error);
  }
};

const saveUserProfile = async () => {
  if (!currentUser || !db) return { ok: false, skipped: true };

  try {
    const existingProfile = await getDoc(profileRef(currentUser.uid));
    await setDoc(
      profileRef(currentUser.uid),
      {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        createdAt: existingProfile.exists() ? existingProfile.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    console.warn('Failed to save PuppyPop profile to Firestore:', error);
    return { ok: false, error };
  }
};

const latestProgress = (localProgress: PuppyProgress, cloudProgress: PuppyProgress) => {
  const localTime = Date.parse(localProgress.updatedAt) || 0;
  const cloudTime = Date.parse(cloudProgress.updatedAt) || 0;
  return localTime >= cloudTime ? localProgress : cloudProgress;
};

const mergeProgress = (localProgress: PuppyProgress, cloudProgress: PuppyProgress | null) => {
  if (!cloudProgress) return normalizeProgress(localProgress);

  const latest = latestProgress(localProgress, cloudProgress);
  const unlockedItems = Array.from(new Set([...localProgress.unlockedItems, ...cloudProgress.unlockedItems]));
  const equippedItems = latest.equippedItems.filter((item) => unlockedItems.includes(item));

  return normalizeProgress({
    schemaVersion: 2,
    maxUnlockedStage: Math.min(stages.length - 1, Math.max(localProgress.maxUnlockedStage, cloudProgress.maxUnlockedStage)),
    unlockedItems,
    equippedItems,
    bestSnacks: Math.max(localProgress.bestSnacks, cloudProgress.bestSnacks),
    dailyPlayDate: localProgress.dailyPlayDate,
    dailyPlayCount: Math.max(localProgress.dailyPlayCount, cloudProgress.dailyPlayCount),
    updatedAt: latest.updatedAt,
  });
};

const toCloudProgress = (progress: PuppyProgress) => ({
  schemaVersion: progress.schemaVersion,
  maxUnlockedStage: Math.min(stages.length - 1, progress.maxUnlockedStage),
  unlockedItems: progress.unlockedItems,
  equippedItems: progress.equippedItems,
  bestSnacks: progress.bestSnacks,
  dailyPlayDate: progress.dailyPlayDate,
  dailyPlayCount: progress.dailyPlayCount,
  updatedAt: progress.updatedAt,
  savedAt: serverTimestamp(),
});

export const initCloud = () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      await setPersistence(auth, browserLocalPersistence);

      try {
        if (await isAnalyticsSupported()) {
          analytics = getAnalytics(app);
          analyticsReady = true;
          trackEvent('app_open');
        }
      } catch (analyticsError) {
        console.warn('Firebase Analytics is unavailable:', analyticsError);
      }

      onAuthStateChanged(auth, (user) => {
        currentUser = user || null;
        notifyUserChanged();
      });

      return { available: true, error: null };
    } catch (error) {
      initError = error;
      console.warn('Failed to initialize PuppyPop Firebase cloud sync:', error);
      return { available: false, error };
    }
  })();

  return initPromise;
};

export const onCloudUserChanged = (listener: (user: CloudUser | null) => void) => {
  userListeners.add(listener);
  listener(toCloudUser(currentUser));
  return () => {
    userListeners.delete(listener);
  };
};

export const signInWithGoogle = async () => {
  await initCloud();
  if (initError || !auth) return { ok: false, error: initError || new Error('Firebase Auth is unavailable.') };

  try {
    trackEvent('login_start', { method: 'google' });
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    currentUser = credential.user;
    await saveUserProfile();
    if (analyticsReady && analytics) {
      setUserProperties(analytics, { signed_in: 'true' });
    }
    trackEvent('login_success', { method: 'google' });
    notifyUserChanged();
    return { ok: true, user: toCloudUser(currentUser) };
  } catch (error) {
    console.warn('Google sign-in failed:', error);
    trackEvent('login_failed', { method: 'google', reason: getSafeErrorCode(error) });
    return { ok: false, error };
  }
};

export const signInWithEmail = async (emailInput: string, passwordInput: string) => {
  await initCloud();
  if (initError || !auth) return { ok: false, message: '로그인을 준비하지 못했어요.' };

  const email = normalizeEmail(emailInput);
  const password = passwordInput.trim();

  if (!email) return { ok: false, message: '이메일 주소를 입력해 주세요.' };
  if (!password) return { ok: false, message: '비밀번호를 입력해 주세요.' };

  try {
    trackEvent('login_start', { method: 'email_password' });
    const credential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = credential.user;
    await saveUserProfile();
    if (analyticsReady && analytics) {
      setUserProperties(analytics, { signed_in: 'true' });
    }
    trackEvent('login_success', { method: 'email_password' });
    notifyUserChanged();
    return { ok: true, user: toCloudUser(currentUser) };
  } catch (error) {
    console.warn('Email sign-in failed:', error);
    trackEvent('login_failed', { method: 'email_password', reason: getSafeErrorCode(error) });
    return { ok: false, error, message: getAuthErrorMessage(error) };
  }
};

export const signUpWithEmail = async (emailInput: string, passwordInput: string) => {
  await initCloud();
  if (initError || !auth) return { ok: false, message: '가입을 준비하지 못했어요.' };

  const email = normalizeEmail(emailInput);
  const password = passwordInput.trim();

  if (!email) return { ok: false, message: '이메일 주소를 입력해 주세요.' };
  if (password.length < 6) return { ok: false, message: '비밀번호는 6자 이상으로 입력해 주세요.' };

  try {
    trackEvent('login_start', { method: 'email_password_signup' });
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = credential.user;
    await saveUserProfile();
    if (analyticsReady && analytics) {
      setUserProperties(analytics, { signed_in: 'true' });
    }
    trackEvent('login_success', { method: 'email_password_signup' });
    notifyUserChanged();
    return { ok: true, user: toCloudUser(currentUser) };
  } catch (error) {
    console.warn('Email sign-up failed:', error);
    trackEvent('login_failed', { method: 'email_password_signup', reason: getSafeErrorCode(error) });
    return { ok: false, error, message: getAuthErrorMessage(error) };
  }
};

export const sendPasswordReset = async (emailInput: string) => {
  await initCloud();
  if (initError || !auth) return { ok: false, message: '비밀번호 재설정을 준비하지 못했어요.' };

  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false, message: '이메일 주소를 입력해 주세요.' };

  try {
    await sendPasswordResetEmail(auth, email);
    trackEvent('password_reset_requested');
    return { ok: true };
  } catch (error) {
    console.warn('Password reset failed:', error);
    trackEvent('password_reset_failed', { reason: getSafeErrorCode(error) });
    return { ok: false, error, message: getAuthErrorMessage(error) };
  }
};

export const signOutUser = async () => {
  await initCloud();
  if (!auth) return { ok: false };

  try {
    await signOut(auth);
    currentUser = null;
    if (analyticsReady && analytics) {
      setUserProperties(analytics, { signed_in: 'false' });
    }
    trackEvent('logout');
    notifyUserChanged();
    return { ok: true };
  } catch (error) {
    console.warn('Google sign-out failed:', error);
    return { ok: false, error };
  }
};

export const syncProgressWithCloud = async (localProgress = loadProgress()) => {
  await initCloud();
  if (!currentUser || !db) return { ok: false, skipped: true, progress: localProgress };

  try {
    await saveUserProfile();
    const snapshot = await getDoc(progressRef(currentUser.uid));
    const cloudProgress = snapshot.exists() ? normalizeProgress(snapshot.data() as Partial<PuppyProgress>) : null;
    const merged = mergeProgress(localProgress, cloudProgress);

    saveProgress(merged);
    await setDoc(progressRef(currentUser.uid), toCloudProgress(merged), { merge: true });
    trackEvent('cloud_sync_completed', {
      max_unlocked_stage: merged.maxUnlockedStage,
      best_snacks: merged.bestSnacks,
    });
    return { ok: true, progress: merged };
  } catch (error) {
    console.warn('Failed to sync PuppyPop progress with Firestore:', error);
    trackEvent('cloud_sync_failed', { reason: getSafeErrorCode(error) });
    return { ok: false, error, progress: localProgress };
  }
};

export const saveProgressToCloud = async (progress: PuppyProgress) => {
  await initCloud();
  if (!currentUser || !db) return { ok: false, skipped: true };

  try {
    await setDoc(progressRef(currentUser.uid), toCloudProgress(progress), { merge: true });
    trackEvent('cloud_progress_saved');
    return { ok: true };
  } catch (error) {
    console.warn('Failed to save PuppyPop progress to Firestore:', error);
    trackEvent('cloud_progress_save_failed', { reason: getSafeErrorCode(error) });
    return { ok: false, error };
  }
};
