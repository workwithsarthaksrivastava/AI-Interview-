import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { User, InterviewSession, EvaluationReport } from '../types';

// Save or update User profile in Firestore (/users/{userId})
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      id: user.uid,
      email: user.email,
      displayName: user.name,
      photoURL: user.photoURL || '',
      role: user.role || 'candidate',
      createdAt: user.createdAt || new Date().toISOString()
    }, { merge: true });
    console.info('[Firestore] User profile synchronized:', user.email);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save interview session to Firestore (/interviews/{interviewId})
export async function saveInterviewToFirestore(session: InterviewSession): Promise<void> {
  const path = `interviews/${session.id}`;
  try {
    const interviewRef = doc(db, 'interviews', session.id);
    await setDoc(interviewRef, {
      id: session.id,
      userId: session.userId,
      userName: session.userName,
      userEmail: session.userEmail,
      companyId: session.companyId,
      companyName: session.companyName,
      roleId: session.roleId,
      roleTitle: session.roleTitle,
      type: session.type,
      difficulty: session.difficulty,
      durationMinutes: session.durationMinutes,
      language: session.language,
      status: session.status,
      scheduledAt: session.scheduledAt,
      createdAt: session.createdAt || new Date().toISOString()
    }, { merge: true });
    console.info('[Firestore] Interview session saved:', session.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch candidate interviews from Firestore
export async function fetchUserInterviewsFromFirestore(userId: string): Promise<InterviewSession[]> {
  const path = 'interviews';
  try {
    const q = query(
      collection(db, 'interviews'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as InterviewSession);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save evaluation report to Firestore (/reports/{reportId})
export async function saveReportToFirestore(report: EvaluationReport, userId: string): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    const reportRef = doc(db, 'reports', report.id);
    await setDoc(reportRef, {
      ...report,
      userId
    }, { merge: true });
    console.info('[Firestore] Evaluation report saved:', report.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch evaluation report by ID
export async function fetchReportFromFirestore(reportId: string): Promise<EvaluationReport | null> {
  const path = `reports/${reportId}`;
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (snap.exists()) {
      return snap.data() as EvaluationReport;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Fetch candidate evaluation reports from Firestore
export async function fetchUserReportsFromFirestore(userId: string): Promise<EvaluationReport[]> {
  const path = 'reports';
  try {
    const q = query(
      collection(db, 'reports'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as EvaluationReport);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
