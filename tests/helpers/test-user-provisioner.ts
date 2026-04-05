import * as admin from 'firebase-admin'

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
    this.runId = `t${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    if (!admin.apps.length) {
      const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
      if (!serviceAccount) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT env var not set')
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      })
    }
  }

  async createUser(role: string): Promise<TestUser> {
    const email = `${this.runId}-${role}@test.invalid`
    const password = `Test${Math.random().toString(36).slice(2, 10)}Aa1!`
    const displayName = `Test ${role} ${this.runId}`

    const record = await admin.auth().createUser({
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
    const errors: string[] = []
    for (const uid of this.createdUids) {
      try {
        await admin.auth().deleteUser(uid)
      } catch (e) {
        errors.push(`Failed to delete ${uid}: ${e}`)
      }
    }
    this.createdUids = []
    if (errors.length > 0) console.warn('Cleanup errors:', errors)
  }
}
