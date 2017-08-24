import loadDB from './db'

export const readStories = async () => {
  const db = await loadDB()
  const stories = await db.ref('/').once('value')
  return stories.val()
}
