/* global jest, beforeAll, describe, it, expect */
import processData from '../../../src/components/Event/processData'

describe('/ducks/processData.canStartRace', () => {
  it('should return true if no onging race and regs are present', () => {
    expect(processData.canStartRace('', {id: 'race1', registrationIds: ['1', '2', '3']})).toEqual(true)
  })
  it('should return false if is testing rfid', () => {
    expect(processData.canStartRace('testRfid', {id: 'race1', registrationIds: ['1', '2', '3']})).toEqual(false)
  })
  it('should return false if there is an onging race', () => {
    expect(processData.canStartRace('race2', {id: 'race1', registrationIds: ['1', '2', '3']})).toEqual(false)
  })
  it('should return false if no racers present', () => {
    expect(processData.canStartRace('', {id: 'race1', registrationIds: []})).toEqual(false)
  })
  it('should return false if no registrationIds in race obj', () => {
    expect(processData.canStartRace('', {id: 'race1'})).toEqual(false)
  })
})
describe('/ducks/processData.canStopRace', () => {
  it('should return true all racers completed set laps', () => {
    const result = [{id: '1', laps: 5}, {id: '2', laps: 5}, {id: '3', laps: 6}]
    expect(processData.canStopRace(result, 5)).toEqual(true)
  })
  it('should return false if a racer did not complete set laps', () => {
    const result = [{id: '1', laps: 5}, {id: '2', laps: 5}, {id: '3', laps: 4}]
    expect(processData.canStopRace(result, 5)).toEqual(false)
  })
})
describe('/ducks/processData.returnIdNameMap', () => {
  it('should return expected name hash table', () => {
    expect(processData.returnIdNameMap([{ id: '1', nameCht: '名字1' }, { id: '2', nameCht: '名字2' }])).toEqual({ '1': '名字1', '2': '名字2' })
  })
  it('should return expected name hash table', () => {
    expect(processData.returnIdNameMap([{ id: '1', name: 'Name1' }, { id: '2', nameCht: '名字2' }])).toEqual({ '1': 'Name1', '2': '名字2' })
  })
  it('should return expected name hash table', () => {
    expect(processData.returnIdNameMap([{ id: '1', nameCht: '', name: 'Name1' }, { id: '2', nameCht: '名字2' }])).toEqual({ '1': 'Name1', '2': '名字2' })
  })
})
describe('/ducks/processData.returnRegMap', () => {
  it('should return expected reg hash table', () => {
    const regs = [{ id: '1', name: 'abc' }, { id: '2', name: 'def' }]
    expect(processData.returnRegMap(regs)).toEqual({ '1': regs[0], '2': regs[1] })
  })
})
describe('/ducks/processData.returnFormattedTime', () => {
  it('should return formatted time', () => {
    expect(processData.returnFormattedTime(15000)).toEqual('0:15.00')
  })
  it('should return formatted time', () => {
    expect(processData.returnFormattedTime(75010)).toEqual('1:15.01')
  })
})

describe('/ducks/processData.returnLapRecord', () => {
  const startTime = 1506492245000
  it('should return expected record', () => {
    const result = [1506492247000]
    expect(processData.returnLapRecord(result, 5, startTime, 'started')).toEqual(['🕒', '-', '-', '-', '-'])
  })
  it('should return expected record', () => {
    const result = [1506492247000]
    expect(processData.returnLapRecord(result, 5, startTime, 'init')).toEqual(['-', '-', '-', '-', '-'])
  })
  it('should return expected record', () => {
    const result = [1506492247000, 1506492267000]
    expect(processData.returnLapRecord(result, 5, startTime, 'init')).toEqual(['0:22.00', '-', '-', '-', '-'])
  })
  it('should return expected record', () => {
    const result = [1506492247000, 1506492267000, 1506492287000]
    expect(processData.returnLapRecord(result, 5, startTime, 'init')).toEqual(['0:22.00', '0:20.00', '-', '-', '-'])
  })
})

describe('/ducks/processData.returnAdvanceToId', () => {
  it('should return advanced to race id', () => {
    expect(processData.returnAdvanceToId(3, [{rankFrom: 0, rankTo: 5, toRace: 1}])).toEqual(1)
  })
  it('should return advanced to race id', () => {
    expect(processData.returnAdvanceToId(5, [{rankFrom: 0, rankTo: 2, toRace: 1}, {rankFrom: 3, rankTo: 5, toRace: 2}])).toEqual(2)
  })
  it('should return undefined if rank not met', () => {
    expect(processData.returnAdvanceToId(7, [{rankFrom: 0, rankTo: 2, toRace: 1}, {rankFrom: 3, rankTo: 5, toRace: 2}])).toEqual(undefined)
  })
})
describe('/ducks/processData.returnMovedArray', () => {
  it('should move array as expected', () => {
    expect(processData.returnMovedArray(['a', 'b', 'c', 'd'], 2, 1)).toEqual(['a', 'c', 'b', 'd'])
  })
  it('should move array as expected', () => {
    expect(processData.returnMovedArray(['a', 'b', 'c', 'd'], 0, 1)).toEqual(['b', 'a', 'c', 'd'])
  })
  it('should return original array if index invalid', () => {
    expect(processData.returnMovedArray(['a', 'b', 'c', 'd'], 5, 1)).toEqual(['a', 'b', 'c', 'd'])
  })
})
describe('/ducks/processData.returnOngoingRace', () => {
  it('should return ongoing race index', () => {
    expect(processData.returnOngoingRace('', [{ id: 'abc' }, { id: 'def' }])).toEqual('')
  })
  it('should return ongoing race index', () => {
    expect(processData.returnOngoingRace('abc', [{ id: 'abc' }, { id: 'def' }])).toEqual(0)
  })
  it('should return ongoing race index', () => {
    expect(processData.returnOngoingRace('def', [{ id: 'abc' }, { id: 'def' }, { id: 'gf' }])).toEqual(1)
  })
  it('should return empty if no match', () => {
    expect(processData.returnOngoingRace('ij', [{ id: 'abc' }, { id: 'def' }, { id: 'gf' }])).toEqual('')
  })
})
describe('/ducks/processData.returnSortedResult', () => {
  let race = { id: 'abc', registrationIds: [1, 2, 3], startTime: 1506492245000, laps: 4 }
  let regs = [
    { id: 1, epc: 'e00000000000000000000001', raceNumber: 1 },
    { id: 2, epc: 'e00000000000000000000002', raceNumber: 2 },
    { id: 3, epc: 'e00000000000000000000003', raceNumber: 3 }
  ]
  it('should return sorted race result', () => {
    race.recordsHashTable = {
      'e00000000000000000000001': [1506492247000, 1506492267000, 1506492287000, 1506492307000, 1506492337000],
      'e00000000000000000000002': [1506492248000, 1506492268000, 1506492288000, 1506492307000, 1506492325000],
      'e00000000000000000000003': [1506492249000, 1506492269000, 1506492289000, 1506492307000] }
    expect(processData.returnSortedResult(race, regs)).toEqual([
      { epc: regs[1].epc, registration: regs[1].id, raceNumber: regs[1].raceNumber, lastValidRecord: 1506492325000, lapsCompleted: 4, record: race.recordsHashTable[regs[1].epc]},
      { epc: regs[0].epc, registration: regs[0].id, raceNumber: regs[0].raceNumber, lastValidRecord: 1506492337000, lapsCompleted: 4, record: race.recordsHashTable[regs[0].epc]},
      { epc: regs[2].epc, registration: regs[2].id, raceNumber: regs[2].raceNumber, lastValidRecord: 1506492307000, lapsCompleted: 3, record: race.recordsHashTable[regs[2].epc]}
    ])
  })
  it('should return sorted race result', () => {
    race.recordsHashTable = {
      'e00000000000000000000001': [1506492247000, 1506492267000, 1506492287000],
      'e00000000000000000000002': [1506492248000, 1506492268000, 1506492288000],
      'e00000000000000000000003': [1506492249000, 1506492269000, 1506492289000] }
    expect(processData.returnSortedResult(race, regs)).toEqual([
      { epc: regs[0].epc, registration: regs[0].id, raceNumber: regs[0].raceNumber, lastValidRecord: 1506492287000, lapsCompleted: 2, record: race.recordsHashTable[regs[0].epc]},
      { epc: regs[1].epc, registration: regs[1].id, raceNumber: regs[1].raceNumber, lastValidRecord: 1506492288000, lapsCompleted: 2, record: race.recordsHashTable[regs[1].epc]},
      { epc: regs[2].epc, registration: regs[2].id, raceNumber: regs[2].raceNumber, lastValidRecord: 1506492289000, lapsCompleted: 2, record: race.recordsHashTable[regs[2].epc]}
    ])
  })
  it('should return sorted race result', () => {
    regs.push({ id: 4, epc: 'e00000000000000000000004', raceNumber: 4 })
    race.registrationIds.push(4)
    race.recordsHashTable = {
      'e00000000000000000000001': [1506492247000, 1506492267000, 1506492287000],
      'e00000000000000000000002': [1506492248000, 1506492268000],
      'e00000000000000000000003': [1506492249000, 1506492269000, 1506492289000] }
    expect(processData.returnSortedResult(race, regs)).toEqual([
      { epc: regs[0].epc, registration: regs[0].id, raceNumber: regs[0].raceNumber, lastValidRecord: 1506492287000, lapsCompleted: 2, record: race.recordsHashTable[regs[0].epc]},
      { epc: regs[2].epc, registration: regs[2].id, raceNumber: regs[2].raceNumber, lastValidRecord: 1506492289000, lapsCompleted: 2, record: race.recordsHashTable[regs[2].epc]},
      { epc: regs[1].epc, registration: regs[1].id, raceNumber: regs[1].raceNumber, lastValidRecord: 1506492268000, lapsCompleted: 1, record: race.recordsHashTable[regs[1].epc]},
      { epc: regs[3].epc, registration: regs[3].id, raceNumber: regs[3].raceNumber, lapsCompleted: 0, record: []}
    ])
  })
  it('should return empty result if no matched regs in race', () => {
    regs.push({ id: 4, epc: 'e00000000000000000000004', raceNumber: 4 })
    race.registrationIds = [5]
    race.recordsHashTable = {
      'e00000000000000000000001': [1506492247000, 1506492267000, 1506492287000],
      'e00000000000000000000002': [1506492248000, 1506492268000],
      'e00000000000000000000003': [1506492249000, 1506492269000, 1506492289000] }
    expect(processData.returnSortedResult(race, regs)).toEqual([])
  })
})

describe('/ducks/processData.returnRaceResult', () => {
  let race = { id: 'abc', registrationIds: [1, 2, 3], startTime: 1506492245000, laps: 4, result: [], recordsHashTable: {}, advancingRules: [] }
  let regs = [
    { id: 1, epc: 'e00000000000000000000001', raceNumber: 1 },
    { id: 2, epc: 'e00000000000000000000002', raceNumber: 2 },
    { id: 3, epc: 'e00000000000000000000003', raceNumber: 3 }
  ]
  it('should return expected race result', () => {
    const actual = processData.returnRaceResult(race, regs)
    expect(actual.length).toEqual(3)
    expect(actual[0].epc).toEqual('e00000000000000000000001')
    expect(actual[0].sum).toEqual('-')
    expect(actual[0].lapRecords).toEqual(['-', '-', '-', '-'])
    expect(actual[0].advanceTo).toEqual(undefined)
  })
  it('should return expected race result', () => {
    race.recordsHashTable = {
      'e00000000000000000000001': [1506492247000, 1506492267000, 1506492287000],
      'e00000000000000000000002': [1506492248000, 1506492268000, 1506492288000],
      'e00000000000000000000003': [1506492249000, 1506492269000, 1506492289000]
    }
    const actual = processData.returnRaceResult(race, regs)
    expect(actual[0].sum).toEqual('0:42.00')
    expect(actual[1].sum).toEqual('0:43.00')
    expect(actual[2].sum).toEqual('0:44.00')
  })
  it('should return existing race result', () => {
    race.result = [
      { id: 1, lapRecords: ['0:20.00', '0:21.00', '0:25.00'] },
      { id: 2, lapRecords: ['0:30.00', '0:31.00'] },
      { id: 3, lapRecords: ['0:22.00', '0:20.00', '0:20.00', '0:22.00'] }
    ]
    expect(processData.returnRaceResult(race, regs)).toEqual(race.result)
  })
})

describe('/ducks/processData.returnRaceWithTrimmedResult', () => {
  let race = { id: '123', laps: 3 }
  it('should return valid results', () => {
    race.result = [
      { id: 1, lapRecords: ['0:20.00', '0:21.00', '0:25.00'] },
      { id: 2, lapRecords: ['0:30.00', '0:31.00'] },
      { id: 3, lapRecords: ['0:22.00', '0:20.00', '0:20.00', '0:22.00'] }
    ]
    expect(processData.returnRaceWithTrimmedResult(race)).toEqual({
      id: '123', laps: 3, result: [
        { id: 1, lapRecords: ['0:20.00', '0:21.00', '0:25.00'] },
        { id: 2, lapRecords: ['0:30.00', '0:31.00'] },
        { id: 3, lapRecords: ['0:22.00', '0:20.00', '0:20.00'] }
      ]
    })
  })
  it('should return valid results', () => {
    race.result = [
      { id: 1, lapRecords: ['0:20.00'] },
      { id: 2, lapRecords: [] },
      { id: 3, lapRecords: ['0:22.00', '0:20.00'] }
    ]
    expect(processData.returnRaceWithTrimmedResult(race)).toEqual({
      id: '123', laps: 3, result: [
        { id: 1, lapRecords: ['0:20.00'] },
        { id: 2, lapRecords: [] },
        { id: 3, lapRecords: ['0:22.00', '0:20.00'] }
      ]
    })
  })
  it('should return valid results', () => {
    race.result = [
      { id: 1, lapRecords: ['0:20.00', '0:21.00', '0:25.00', '0:25.00', '0:25.00'] },
      { id: 2, lapRecords: ['0:30.00', '0:31.00', '0:33.00', '0:25.00', '0:25.00'] },
      { id: 3, lapRecords: ['0:22.00', '0:20.00', '0:20.00', '0:22.00'] }
    ]
    expect(processData.returnRaceWithTrimmedResult(race)).toEqual({
      id: '123', laps: 3, result: [
        { id: 1, lapRecords: ['0:20.00', '0:21.00', '0:25.00'] },
        { id: 2, lapRecords: ['0:30.00', '0:31.00', '0:33.00'] },
        { id: 3, lapRecords: ['0:22.00', '0:20.00', '0:20.00'] }
      ]
    })
  })
})
describe('/ducks/processData.returnRaceResultSubmitArray', () => {
  let race = { id: '1', laps: 3, result: [
    { registration: 1, lapRecords: ['0:20.00', '0:21.00', '0:25.00'], advanceTo: '3' },
    { registration: 2, lapRecords: ['0:30.00', '0:31.00', '0:33.00'] },
    { registration: 3, lapRecords: ['0:22.00', '0:20.00', '0:20.00'] }
  ]}
  const races = [{ id: '1', laps: 3, registrationIds: [1, 2, 3] }, { id: '2', laps: 3, registrationIds: [4, 5, 6] }, { id: '3', laps: 3, registrationIds: [4] }]
  it('should return an array of race objects to update', () => {
    const actual = processData.returnRaceResultSubmitArray(race, races)
    expect(actual[0].result).toEqual(race.result)
    expect(actual[1].id).toEqual('3')
    expect(actual[1].registrationIds).toEqual([4, 1])
  })
})

describe('/ducks/processData.returnSelectedRace', () => {
  it('should return ongoing race', () => {
    expect(processData.returnSelectedRace([{ id: '1', raceStatus: 'init' }, { id: '2', raceStatus: 'init' }], 1)).toEqual(1)
  })
  it('should return ongoing race', () => {
    expect(processData.returnSelectedRace([{ id: '1', raceStatus: 'init' }, { id: '2', raceStatus: 'init' }])).toEqual(0)
  })
  it('should return ongoing race', () => {
    expect(processData.returnSelectedRace([{ id: '1', raceStatus: 'ended' }, { id: '2', raceStatus: 'ended' }, { id: '2', raceStatus: 'started' }])).toEqual(2)
  })
  it('should return ongoing race', () => {
    expect(processData.returnSelectedRace([{ id: '1', raceStatus: 'ended' }, { id: '2', raceStatus: 'ended' }, { id: '2', raceStatus: 'init' }])).toEqual(2)
  })
  it('should return ongoing race', () => {
    expect(processData.returnSelectedRace([{ id: '1', raceStatus: 'submitted' }, { id: '2', raceStatus: 'submitted' }, { id: '2', raceStatus: 'submitted' }])).toEqual(2)
  })
})
describe('/ducks/processData.returnDeferredHashTable', () => {
  const now = Date.now()
  const latency = 10000 // 10secs
  const hashTable = {
    'e00000000000000000000001': [now - 100000, now - 20000, now - 5000],
    'e00000000000000000000002': [now - 100000, now - 19000, now - 9000],
    'e00000000000000000000003': [now - 100000, now - 18000, now - 10100]
  }
  it('should return result within latency', () => {
    expect(processData.returnDeferredHashTable(hashTable, latency)).toEqual({
    'e00000000000000000000001': [now - 100000, now - 20000],
    'e00000000000000000000002': [now - 100000, now - 19000],
    'e00000000000000000000003': [now - 100000, now - 18000, now - 10100]
    })
  })
})
describe('/ducks/processData.returnDeferredTimeArray', () => {
  const now = Date.now()
  const latency = 10000 // 10secs
  const hashTable = {
    'e00000000000000000000001': [now - 100000, now - 20000, now - 5000],
    'e00000000000000000000002': [now - 100000, now - 19000, now - 9000],
    'e00000000000000000000003': [now - 100000, now - 18000, now - 10100]
  }
  const trimmed = processData.returnDeferredHashTable(hashTable, latency)
  it('should', () => {
    const actual = processData.returnDeferredTimeArray(hashTable, trimmed, latency)
    expect(actual.length).toEqual(2)
    expect(actual[0] <= 5000).toEqual(true)
    expect(actual[1] <= 1000).toEqual(true)
  })
})
describe('/ducks/processData.returnDeferredRaceStatus', () => {
  it('should return raceStatus as started if still ongoing', () => {
    expect(processData.returnDeferredRaceStatus('started', 1000, Date.now())).toEqual('started')
  })
  it('should return raceStatus as started if status changed within latency range', () => {
    expect(processData.returnDeferredRaceStatus('ended', 1000, Date.now() - 500)).toEqual('started')
  })
})
describe('/ducks/processData.returnRacesByOrder', () => {
  it('should return race by order', () => {
    const races = [{ id: 1, name: 'name1' }, { id: 2, name: 'name2' }, { id: 3, name: 'name3' }]
    expect(processData.returnRacesByOrder(races, [2, 3, 1])).toEqual([races[1], races[2], races[0]])
  })
})
