import { fireBaseConfig } from './consts'

export default async function loadDB () {
  const firebase = await import('firebase')

  try {
    firebase.initializeApp(fireBaseConfig)
  } catch (err) {
    if (!/already exists/.test(err.message)) {
      console.error('Firebase initialization error', err.stack)
    }
  }

  return firebase.database()
}
