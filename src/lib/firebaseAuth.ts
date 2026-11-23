import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export type SupportedAuthLanguage = 'vi' | 'en' | 'zh';

export interface FirebaseSignedInProfile {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL?: string;
  providerId: string;
  providerIds: string[];
}

export type FirebaseGoogleSignInResult =
  | { ok: true; profile: FirebaseSignedInProfile }
  | { ok: false; code?: string; error: string };

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(firebaseApp);

if (typeof window !== 'undefined') {
  void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => undefined);
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export function mapFirebaseAuthErrorMessage(
  error: unknown,
  lang: SupportedAuthLanguage = 'vi'
): { code?: string; message: string } {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      code,
      message:
        lang === 'en'
          ? 'Google sign-in window was closed before completing authentication.'
          : lang === 'zh'
          ? 'Google 登录窗口在完成验证前被关闭。'
          : 'Cửa sổ đăng nhập Google đã được đóng trước khi hoàn tất xác thực.',
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      code,
      message:
        lang === 'en'
          ? 'Your browser blocked the Google sign-in popup. Please allow popups for this site or use Email/Password below.'
          : lang === 'zh'
          ? '浏览器拦截了 Google 登录弹窗，请允许弹窗或使用下方邮箱密码登录。'
          : 'Trình duyệt đang chặn cửa sổ bật lên của Google. Vui lòng cho phép popup hoặc dùng phương thức Email/Mật khẩu bên dưới.',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      message:
        lang === 'en'
          ? 'This domain is not authorized in Firebase Authentication settings yet.'
          : lang === 'zh'
          ? '当前域名尚未添加到 Firebase Authentication 授权域名列表。'
          : 'Tên miền hiện tại chưa được cấp phép trong cấu hình Firebase Authentication (Authorized Domains).',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      message:
        lang === 'en'
          ? 'Network error while connecting to Google authentication service.'
          : lang === 'zh'
          ? '连接 Google 身份验证服务时发生网络错误。'
          : 'Lỗi kết nối mạng khi liên hệ máy chủ xác thực Google.',
    };
  }

  if (code === 'auth/user-disabled') {
    return {
      code,
      message:
        lang === 'en'
          ? 'This Google account has been disabled in Firebase Authentication.'
          : lang === 'zh'
          ? '该 Google 账号已在 Firebase Authentication 中被停用。'
          : 'Tài khoản Google này hiện đang bị vô hiệu hóa trên hệ thống xác thực.',
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      message:
        lang === 'en'
          ? 'Google Sign-In provider is not enabled for this Firebase project.'
          : lang === 'zh'
          ? '此 Firebase 项目尚未启用 Google 登录提供程序。'
          : 'Phương thức Google Sign-In chưa được bật trong Firebase Console của dự án.',
    };
  }

  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return {
      code,
      message:
        lang === 'en'
          ? 'Current password is incorrect. Please check and try again.'
          : lang === 'zh'
          ? '当前密码不正确，请检查后重试。'
          : 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.',
    };
  }

  if (code === 'auth/weak-password') {
    return {
      code,
      message:
        lang === 'en'
          ? 'New password must be at least 6 characters long.'
          : lang === 'zh'
          ? '新密码长度至少需要 6 个字符。'
          : 'Mật khẩu mới cần có tối thiểu 6 ký tự.',
    };
  }

  if (code === 'auth/requires-recent-login') {
    return {
      code,
      message:
        lang === 'en'
          ? 'For security, please sign out and sign in again before changing your password.'
          : lang === 'zh'
          ? '为了账户安全，请重新登录后再修改密码。'
          : 'Vì lý do bảo mật, vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.',
    };
  }

  const rawMsg =
    error instanceof Error && error.message
      ? error.message
      : lang === 'en'
      ? 'Unable to complete authentication request.'
      : lang === 'zh'
      ? '无法完成身份验证请求。'
      : 'Không thể hoàn tất thao tác xác thực.';

  return {
    code: code || undefined,
    message: rawMsg,
  };
}

export function toFirebaseSignedInProfile(
  fbUser: User | null | undefined
): FirebaseSignedInProfile | null {
  if (!fbUser) return null;
  const primaryEmail = (
    fbUser.email ||
    fbUser.providerData.find((p) => Boolean(p?.email))?.email ||
    ''
  )
    .toLowerCase()
    .trim();

  if (!primaryEmail) return null;

  const displayName =
    (fbUser.displayName || '').trim() ||
    (fbUser.providerData.find((p) => Boolean(p?.displayName))?.displayName || '').trim() ||
    primaryEmail.split('@')[0] ||
    primaryEmail;

  const photoURL =
    fbUser.photoURL ||
    fbUser.providerData.find((p) => Boolean(p?.photoURL))?.photoURL ||
    undefined;

  const providerIds = fbUser.providerData
    .map((p) => p?.providerId || '')
    .filter(Boolean);

  return {
    uid: fbUser.uid,
    email: primaryEmail,
    emailVerified: Boolean(fbUser.emailVerified),
    displayName,
    photoURL,
    providerId: providerIds[0] || 'google.com',
    providerIds: providerIds.length > 0 ? providerIds : ['google.com'],
  };
}

export function getCurrentFirebaseProviderIds(): string[] {
  const current = firebaseAuth.currentUser;
  if (!current) return [];
  return current.providerData.map((p) => p?.providerId || '').filter(Boolean);
}

export async function updateFirebaseDisplayName(
  displayName: string
): Promise<{ ok: boolean; syncedAuth: boolean; error?: string }> {
  const current = firebaseAuth.currentUser;
  if (!current) {
    return { ok: true, syncedAuth: false };
  }
  try {
    await updateProfile(current, { displayName: displayName.trim() });
    return { ok: true, syncedAuth: true };
  } catch (err) {
    const mapped = mapFirebaseAuthErrorMessage(err, 'vi');
    return { ok: false, syncedAuth: false, error: mapped.message };
  }
}

export async function updateFirebaseEmailPassword(
  currentPassword: string,
  newPassword: string,
  lang: SupportedAuthLanguage = 'vi'
): Promise<{ ok: boolean; usedFirebaseAuth: boolean; error?: string }> {
  const current = firebaseAuth.currentUser;
  if (!current || !current.email) {
    return { ok: false, usedFirebaseAuth: false };
  }
  const hasPasswordProvider = current.providerData.some((p) => p?.providerId === 'password');
  if (!hasPasswordProvider) {
    return { ok: false, usedFirebaseAuth: false };
  }
  try {
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
    return { ok: true, usedFirebaseAuth: true };
  } catch (err) {
    const mapped = mapFirebaseAuthErrorMessage(err, lang);
    return { ok: false, usedFirebaseAuth: true, error: mapped.message };
  }
}

export async function signInWithFirebaseGoogle(
  lang: SupportedAuthLanguage = 'vi'
): Promise<FirebaseGoogleSignInResult> {
  try {
    await setPersistence(firebaseAuth, browserLocalPersistence).catch(() => undefined);
    const credential = await signInWithPopup(firebaseAuth, googleAuthProvider);
    const profile = toFirebaseSignedInProfile(credential.user);
    if (!profile) {
      return {
        ok: false,
        error:
          lang === 'en'
            ? 'Google account did not return a valid email address.'
            : lang === 'zh'
            ? 'Google 账号未返回有效的电子邮件地址。'
            : 'Tài khoản Google chưa cung cấp địa chỉ email hợp lệ.',
      };
    }
    return { ok: true, profile };
  } catch (err) {
    const mapped = mapFirebaseAuthErrorMessage(err, lang);
    return {
      ok: false,
      code: mapped.code,
      error: mapped.message,
    };
  }
}

export async function signOutFirebaseAuth(): Promise<void> {
  try {
    await signOut(firebaseAuth);
  } catch {
    // ignore sign-out errors
  }
}

export function onFirebaseAuthUserChanged(
  callback: (profile: FirebaseSignedInProfile | null) => void
): Unsubscribe {
  return onAuthStateChanged(firebaseAuth, (fbUser) => {
    callback(toFirebaseSignedInProfile(fbUser));
  });
}
