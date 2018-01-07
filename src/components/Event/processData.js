const processData = {
  // 建立group及race 名稱hashTable會用到
  returnIdNameMap: (objs) => {
    let result = {}
    if (objs && objs.length > 0) { objs.map(obj => { if (obj.nameCht && obj.nameCht !== '') { result[obj.id] = obj.nameCht } else { result[obj.id] = obj.name } }) }
    return result
  },
  // 建立選手名稱 hashTable
  returnRegMap: (objs) => {
    let result = {}
    if (objs && objs.length > 0) { objs.map(obj => { result[obj.id] = obj }) }
    return result
  },
  // 回傳UI要選取的比賽的index, 依先後順序: 進行中 / 剛完成 / 尚未開始
  returnSelectedRace: (orderedRaces, ongoingRace) => {
    if (ongoingRace) { return ongoingRace }
    const selectedRaceStatusByOrder = ['started', 'init', 'ended']
    for (let i = 0; i < selectedRaceStatusByOrder.length; i += 1) {
      for (let j = 0; j < orderedRaces.length; j += 1) {
        if (orderedRaces[j].raceStatus === selectedRaceStatusByOrder[i]) { return j }
      }
    }
    return orderedRaces.length - 1
  },
  // 直播有延遲的情況下，回傳延遲的比賽recordsHashTable
  returnDeferredHashTable: (hashTable, latency) => {
    const now = Date.now()
    let output = {}
    for (let i in hashTable) {
      let result = []
      hashTable[i].map(V => { if ((V + latency) <= now) { result.push(V) } })
      output[i] = result
    }
    return output
  },
  // Only for public
  returnDate: (ts) => {
    const diff = 28800000 // diff between taipei and utc in ms
    const obj = new Date(ts + diff)
    const MT = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const M = MT[obj.getUTCMonth()]
    let d = obj.getUTCDate()
    return `${M} ${d}`
  },
  returnTime: (ts) => {
    const diff = 28800000 // diff between taipei and utc in ms
    const obj = new Date(ts + diff)
    let h = obj.getUTCHours()
    const m = ('0' + obj.getUTCMinutes()).slice(-2)
    let ampm = 'am'
    if (h >= 12) {
      ampm = 'pm'
      if (h > 12) { h = h - 12 }
    }
    return `${h}:${m}${ampm}`
  },
  updateRaces: (racesOrg, racesNew, registrations) => {
    let races = racesOrg.map(raceOrg => {
      let result = raceOrg
      racesNew.map(raceNew => {
        if (raceNew.id === raceOrg.id) {
          result = raceNew
        }
      })
      return result
    })
    return races
  }
}

export default processData
