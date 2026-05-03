import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  getDoc,
  deleteField,
  Timestamp,
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Player, AIEntity, CapturePoint, Point } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const joinMatch = async (matchId: string, player: Player) => {
  const path = `matches/${matchId}/players/${player.id}`;
  try {
    const batch = writeBatch(db);
    
    // 1. Update Match status
    batch.set(doc(db, 'matches', matchId), {
      status: 'ACTIVE',
      lastUpdate: serverTimestamp()
    }, { merge: true });

    // 2. Create Player doc
    batch.set(doc(db, path), {
      userId: player.id,
      name: auth.currentUser?.displayName || 'Unknown Warrior',
      team: player.team,
      classType: player.classType,
      animalType: player.animalType,
      radius: player.radius,
      vehicleId: player.vehicleId || null,
      x: player.x,
      y: player.y,
      angle: player.angle,
      health: player.health,
      maxHealth: player.maxHealth,
      isDead: player.isDead,
      lastFired: player.lastFired,
      isShooting: false,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updatePlayerPos = async (matchId: string, playerId: string, data: Partial<any>) => {
  const path = `matches/${matchId}/players/${playerId}`;
  
  // Validation to prevent corrupting Firestore with NaN values which can freeze other clients
  const cleanData: any = { ...data };
  if (typeof cleanData.x !== 'number' || isNaN(cleanData.x)) delete cleanData.x;
  if (typeof cleanData.y !== 'number' || isNaN(cleanData.y)) delete cleanData.y;
  if (typeof cleanData.angle !== 'number' || isNaN(cleanData.angle)) delete cleanData.angle;
  if (typeof cleanData.health !== 'number' || isNaN(cleanData.health)) delete cleanData.health;

  if (Object.keys(cleanData).length === 0) return;

  try {
    await updateDoc(doc(db, path), {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const syncCapturePoints = async (matchId: string, points: CapturePoint[]) => {
  const path = `matches/${matchId}`;
  try {
    await updateDoc(doc(db, path), {
      capturePoints: points.map(p => ({
        id: p.id,
        team: p.team,
        progress: p.progress
      })),
      lastUpdate: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const fireProjectile = async (matchId: string, projectile: any) => {
  const path = `matches/${matchId}/projectiles`;
  try {
    await addDoc(collection(db, path), {
      ...projectile,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deployDeployable = async (matchId: string, deployable: any) => {
  const path = `matches/${matchId}/deployables`;
  try {
    await addDoc(collection(db, path), {
      ...deployable,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteDeployable = async (matchId: string, deployableId: string) => {
  const path = `matches/${matchId}/deployables/${deployableId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const listenToDeployables = (matchId: string, callback: (deployables: any[]) => void, onError?: (error: any) => void) => {
  const path = `matches/${matchId}/deployables`;
  const q = query(collection(db, path), where('timestamp', '>', Timestamp.fromMillis(Date.now() - 3600000))); // 1 hour
  return onSnapshot(q, (snapshot) => {
    const deployables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(deployables);
  }, (error) => {
    if (onError) onError(error);
    else handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const listenToMatch = (matchId: string, callback: (data: any) => void, onError?: (error: any) => void) => {
  const path = `matches/${matchId}`;
  return onSnapshot(doc(db, path), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  }, (error) => {
    if (onError) onError(error);
    else handleFirestoreError(error, OperationType.GET, path);
  });
};

export const listenToPlayers = (matchId: string, callback: (players: any[]) => void, onError?: (error: any) => void) => {
  const path = `matches/${matchId}/players`;
  return onSnapshot(collection(db, path), (snapshot) => {
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(players);
  }, (error) => {
    if (onError) onError(error);
    else handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const listenToProjectiles = (matchId: string, callback: (projectiles: any[]) => void, onError?: (error: any) => void) => {
  const path = `matches/${matchId}/projectiles`;
  // Only listen to recent projectiles
  const q = query(collection(db, path), where('timestamp', '>', Timestamp.fromMillis(Date.now() - 5000)));
  return onSnapshot(q, (snapshot) => {
    const projectiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(projectiles);
  }, (error) => {
    if (onError) onError(error);
    else handleFirestoreError(error, OperationType.LIST, path);
  });
};
