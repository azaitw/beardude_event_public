const processData = {
  // 檢查賽事可否開始 (賽事有無選手)
  canStartRace: (ongoingRace, race) => {
    if (ongoingRace === '' && race.registrationIds && race.registrationIds.length > 0) { return true }
    return false
  },
  // 檢查賽事可否結束 (所有選手騎完圈數)
  canStopRace: (result, laps) => {
    let canStop = true
    result.map(V => { if (V.laps < laps) { canStop = false } })
    return canStop
  },
  // 建立group及race 名稱hashTable會用到
  returnIdNameMap: (objs) => {
    let result = {}
    if (objs && objs.length > 0) { objs.map(obj => {
      if (obj.nameCht && obj.nameCht !== '') { result[obj.id] = obj.nameCht } else { result[obj.id] = obj.name } }) }
    return result
  },
  // 建立選手名稱 hashTable
  returnRegMap: (objs) => {
    let result = {}
    if (objs && objs.length > 0) { objs.map(obj => { result[obj.id] = obj }) }
    return result
  },
  // 把timestamp parse成日期時間
  returnFormattedTime: (milS) => {
    const sec = ((milS % 60000) / 1000).toFixed(2)
    const min = Math.floor(milS / 60000)
    return min + ':' + (sec < 10 ? '0' : '') + sec
  },
  // 讀取並回傳所有單圈成績
  // 完成圈數顯示單圈成績, 進行中顯示時鐘emoji, 沒成績顯示-
  returnLapRecord: (result, laps, startTime, raceStatus) => {
    let output = []
    let lastRecord = startTime
    let lapsLeft = laps
    let i

    if (result.length > 0) {
      for (i = 1; i <= result.length; i += 1) {
        if (result[i]) {
          output.push(processData.returnFormattedTime(result[i] - lastRecord))
          lastRecord = result[i]
          lapsLeft -= 1
        } else if (lapsLeft > 0 && raceStatus === 'started') {
          output.push('🕒')
          lapsLeft -= 1
        }
      }
    }
    for (i = 0; i < lapsLeft; i += 1) { output.push('-') }
    return output
  },
  // 回傳可晉級的比賽ID
  returnAdvanceToId: (index, advancingRules) => {
    for (let i = 0; i < advancingRules.length; i += 1) {
      if (index >= advancingRules[i].rankFrom && index <= advancingRules[i].rankTo) { return advancingRules[i].toRace }
    }
    return undefined
  },
  // 移動array item的位置. 用來調整比賽順序及選手名次等
  returnMovedArray: (arr, oldIndex, newIndex) => {
    if (oldIndex >= arr.length || newIndex >= arr.length) { return arr }
    let output = arr
    const moving = output.splice(oldIndex, 1)[0]
    output.splice(newIndex, 0, moving)
    return output
  },
  // 回傳進行中的比賽的index
  returnOngoingRace: (ongoingRaceId, orderedRaces) => {
    if (ongoingRaceId === '') { return '' }
    for (let i = 0; i < orderedRaces.length; i += 1) { if (orderedRaces[i].id === ongoingRaceId) { return i } }
    return ''
  },
  returnSortedResult: (race, regs) => {
    let sortTable = []
    let incomplete = []
    let notStarted = []
    const lastRecordIndex = race.laps

    race.registrationIds.map(regId => {
      const reg = regs.filter(V => (V.id === regId))[0]
      if (reg) {
        const record = race.recordsHashTable[reg.epc]
        let obj = { epc: reg.epc, registration: reg.id, raceNumber: reg.raceNumber, lapsCompleted: 0, record: [] }
        if (record) { // has epc record
          obj.lapsCompleted = record.length - 1
          obj.record = record
          if (record[lastRecordIndex]) { // 1. completed race
            obj.lastValidRecord = record[lastRecordIndex]
            sortTable.push(obj)
          } else { // 2. not complete
            obj.lastValidRecord = record[record.length - 1]
            incomplete.push(obj)
          }
        } else { // 3. no epc record
          notStarted.push(obj)
        }
      }
    })
    sortTable.sort((a, b) => a.lastValidRecord - b.lastValidRecord) // sort completed racer by last lap record
    incomplete.sort((a, b) => b.lapsCompleted - a.lapsCompleted) // sort incompleted by laps
    incomplete.sort((a, b) => (a.lapsCompleted === b.lapsCompleted) ? a.lastValidRecord - b.lastValidRecord : 0) // sort incompleted same-lap by time
    notStarted.sort((a, b) => a.raceNumber - b.raceNumber) // sort notStart by raceNumber
    sortTable = sortTable.concat(incomplete).concat(notStarted)
    // output: { epc, id, raceNumber, lastValidRecord, lapsCompleted, record }
    return sortTable
  },
  // 將 race.recordsHashTable parse成race.result. 並依成績做排序
  returnRaceResult: (race, regs) => {
    if (race.result.length > 0) { return race.result }
    const sortTable = processData.returnSortedResult(race, regs)
    return sortTable.map((item, index) => ({
      epc: item.epc,
      registration: item.registration,
      sum: (item.lastValidRecord) ? processData.returnFormattedTime(item.lastValidRecord - race.startTime) : '-',
      laps: item.lapsCompleted,
      lapRecords: processData.returnLapRecord(item.record, race.laps, race.startTime, race.raceStatus),
      advanceTo: processData.returnAdvanceToId(index, race.advancingRules)
    }))
  },
  // 送出成績時, 把超過設定圈數的多餘資料刪掉
  returnRaceWithTrimmedResult: (race) => {
    let output = {...race}
    const lastRecordIndex = race.laps - 1
    output.result = output.result.map(V => {
      if (V.lapRecords.length > (lastRecordIndex + 1)) {
        // 只取 lastRecordIndex + 1筆資料
        V.lapRecords.splice(lastRecordIndex + 1, (V.lapRecords.length - (lastRecordIndex + 1)))
      }
      return V
    })
    return output
  },
  // 比賽結束後, 回傳更新的race objects, 包含比賽成績及晉級後需更新選手id的比賽
  returnRaceResultSubmitArray: (race, races) => {
    let output = [{ id: race.id, result: race.result, raceStatus: 'submitted', submitTime: Date.now() }]
    let racesToAdvanceHashTable = {}
    race.result.map(record => {
      if (record.advanceTo) {
        if (!racesToAdvanceHashTable[record.advanceTo]) {
          const race = races.filter(V => (V.id === record.advanceTo))[0]
          racesToAdvanceHashTable[record.advanceTo] = { id: race.id, registrationIds: race.registrationIds }
        }
        if (racesToAdvanceHashTable[record.advanceTo].registrationIds.indexOf(record.registration) === -1) { racesToAdvanceHashTable[record.advanceTo].registrationIds.push(record.registration) }
      }
    })
    for (let i in racesToAdvanceHashTable) {
      output.push(racesToAdvanceHashTable[i])
    }
    return output
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
  // 直播有延遲的情況下，回傳延遲資料的時間差
  returnDeferredTimeArray: (orgHashTable, trimmedHashTable, latency) => {
    const now = Date.now()
    let deferredTimes = []
    for (let i in orgHashTable) {
      let updateCount = orgHashTable[i].length - trimmedHashTable[i].length
      for (let j = 0; j < updateCount; j += 1) {
        deferredTimes.push(latency - (now - orgHashTable[i][orgHashTable[i].length - 1 - j]))
      }
    }
    return deferredTimes
  },
  // 直播有延遲的情況下，回傳賽事狀態
  returnDeferredRaceStatus: (raceStatus, latency, endTime) => {
    let output = raceStatus
    if (output === 'ended' || output === 'submitted') {
      if (endTime + latency > Date.now()) { output = 'started' }
    }
    return output
  },
  // 回傳排序過的比賽
  returnRacesByOrder: (races, order) => {
    let result = []
    order.map(raceId => { races.map(race => { if (race.id === raceId) { result.push(race) } }) })
    return result
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
      let result = {...raceOrg}
      racesNew.map(raceNew => {
        if (raceNew.id === raceOrg.id) {
          result = {...raceNew, result: processData.returnRaceResult(raceNew, registrations)}
        }
      })
      return result
    })
    return races
  }
}

export default processData
