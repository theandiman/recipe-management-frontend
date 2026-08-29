import * as crypto from 'crypto'
import * as firebaseAdmin from 'firebase-admin'

function getAdmin(): any {
  let a: any = firebaseAdmin
  if (a.default && !a.apps && !a.initializeApp) a = a.default
  if (a.default && !a.apps && !a.initializeApp) a = a.default
  return a
}

function getCertFunction(adminObj: any): (serviceAccountObject: any) => any {
  const cert =
    adminObj.credential?.cert ||
    (firebaseAdmin as any).credential?.cert ||
    (firebaseAdmin as any).default?.credential?.cert ||
    (firebaseAdmin as any).default?.default?.credential?.cert
  if (!cert) throw new Error('Unable to resolve firebase-admin credential.cert function')
  return cert
}

function getAuthFunction(adminObj: any): any {
  const auth =
    adminObj.auth ||
    (firebaseAdmin as any).auth ||
    (firebaseAdmin as any).default?.auth ||
    (firebaseAdmin as any).default?.default?.auth
  if (!auth) throw new Error('Unable to resolve firebase-admin auth function')
  return auth
}

export interface TestUser {
  uid: string
  email: string
  password: string
  displayName: string
  idToken: string
}

export class TestUserProvisioner {
  private createdUids: string[] = []
  readonly runId: string

  constructor() {
    this.runId = `t${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
    const admin = getAdmin()
    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
      if (!serviceAccount) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT env var not set')
      const cert = getCertFunction(admin)
      admin.initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
      })
    }
  }

  async createUser(role: string): Promise<TestUser> {
    const email = `${this.runId}-${role}@test.invalid`
    const password = `Test${crypto.randomBytes(8).toString('hex')}Aa1!`
    const displayName = `Test ${role} ${this.runId}`

    const auth = getAuthFunction(getAdmin())()
    const record = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    })
    this.createdUids.push(record.uid)

    const idToken = await this.signInWithPassword(email, password)
    return { uid: record.uid, email, password, displayName, idToken }
  }

  /**
   * Refresh the ID token for a user (tokens expire after 1 hour).
   */
  async refreshToken(user: TestUser): Promise<string> {
    return this.signInWithPassword(user.email, user.password)
  }

  private async signInWithPassword(email: string, password: string): Promise<string> {
    const apiKey = process.env.FIREBASE_WEB_API_KEY
    if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY env var not set')
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )
    if (!res.ok) throw new Error(`Firebase sign-in failed: ${await res.text()}`)
    const data = (await res.json()) as { idToken: string }
    return data.idToken
  }

  async cleanup(): Promise<void> {
    const auth = getAuthFunction(getAdmin())()
    const results = await Promise.allSettled(
      this.createdUids.map((uid) => auth.deleteUser(uid))
    )
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason))
    this.createdUids = []
    if (errors.length > 0) console.warn('Cleanup errors:', errors)
  }
}
