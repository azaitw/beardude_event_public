/* global SERVICE_URL */
import { h, Component } from 'preact'
import io from 'socket.io-client'
import { Redirect } from 'preact-router'
import processData from './processData'

import css from './style.css'
import Header from '../Header'

const render = {
  raceList: ({race, raceSelected, index, handleSelect, groupNames}) => {
    return <li className={(index === raceSelected) ? css.selected : css.li} key={'race' + race.id}>
      <div className={css[race.raceStatus]} />
      <button className={css.list} onClick={handleSelect(index)}>
        {groupNames && <span>{groupNames[race.group.toString()]} -</span>}
        <span>{(race.nameCht) ? race.nameCht : race.name}</span>
      </button>
    </li>
  },
  dashboard: {
    labels: (race, regNames) => <div className={css.dashId}><table className={css.dashTable}>
      <thead><tr>
        <th className={css.no}>排位</th>
        <th className={css.name}>選手</th>
      </tr></thead>
      <tbody>{race && race.result && race.result.map((record, index) => {
        const reg = regNames[record.registration]
        return reg ? <tr className={css.dashItem} key={'rec' + index}>
          <td className={css.no}>{index + 1}</td>
          <td className={css.name}><span className={css.raceNumber}>{reg.raceNumber}</span> <span>{reg.name}</span></td>
        </tr> : <tr />
      })
      }</tbody>
    </table></div>,
    results: (race) => <table className={css.dashTable}>
      <thead><tr>
        {race && race.result[0] && race.result[0].lapRecords.map((V, I) => <th key={'th-' + I}>{I + 1}</th>)}
      </tr></thead>
      <tbody>{race && (race.result.length > 0) && race.result.map((record, index) => <tr key={'tr-rec-' + record.registration} className={css.dashItem}>
        {record.lapRecords.map((time, index) => <td key={'record-' + index} className={css.lap}>{time}</td>)}
      </tr>)}</tbody>
    </table>,
    summary: (race) => <table className={css.dashTable}>
      <thead><tr><th>加總</th></tr></thead>
      <tbody>{race && race.result && race.result.map((record, index) => <tr className={css.dashItem} key={'lap' + index}><td className={css.lap}>{record.sum}</td></tr>)}
      </tbody>
    </table>,
    advance: ({race, raceNames}) => <table className={css.dashTable}>
      <thead><tr><th><span>{race && race.isFinalRace ? '總排名' : '晉級資格'}</span></th></tr></thead>
      <tbody>{race && race.result && race.result.map((record, index) => <tr key={'adv' + index} className={css.dashItem}><td className={css.center}>{race.isFinalRace ? index + 1 : raceNames[record.advanceTo]}</td></tr>)}</tbody>
    </table>
  }
}

class Event extends Component {
  _bind (...methods) {
    methods.forEach((method) => {
      if (this[method]) {
        this[method] = this[method].bind(this)
      }
    })
  }
  state = {
    event: undefined,
    groups: undefined,
    races: undefined,
    registrations: undefined,
    nameTables: {},
    raceSelected: 0,
    ongoingRace: undefined
  }
  updateOngoingRaces (toSelectRace) {
    let stateObj = {
      ongoingRace: (this.state.event.ongoingRace === -1) ? undefined : processData.returnOngoingRace(this.state.event.ongoingRace, this.state.races)
    }
    if (toSelectRace) { stateObj.raceSelected = processData.returnSelectedRace(this.state.races, stateObj.ongoingRace) }
    this.setState(stateObj)
  }
  componentDidMount () {
    const getEvent = async (successCallback) => {
      const response = await fetch(`${SERVICE_URL}/api/event/info/${this.props.matches.uniqueName}`, {credentials: 'same-origin'})
      const res = await response.json()
      // 按延遲的時間差, 依序/依時間差更新比賽成績
      const updateRacesLater = (deferredTimes, races, latency, regs) => {
        const allowance = 3000
        if (deferredTimes.length > 0) {
          deferredTimes.map(time => {
            setTimeout(function () {
              let newRaces = races.map(race => {
                let output = {...race, recordsHashTable: processData.returnDeferredHashTable(race.recordsHashTable, time)}
                output.raceStatus = processData.returnDeferredRaceStatus(output.raceStatus, latency, output.endTime)
                return output
              })
              //dispatch({type: UPDATE_RACES, payload: {races: newRaces, registrations: this.state.registrations}})
              successCallback()
            }, time + allowance)
          })
        }
      }
      if (response.status === 200) {
        let deferredTimes = []
        // 檢查有無延遲期間更新的資料, client第一次開啟頁面時做計算
        const races = res.races.map((V, I) => {
          let output = {...V}
          let defer = []
          output.recordsHashTable = processData.returnDeferredHashTable(output.recordsHashTable, res.event.resultLatency)
          output.raceStatus = processData.returnDeferredRaceStatus(output.raceStatus, res.event.resultLatency, output.endTime)
          output.result = processData.returnRaceResult(output, res.registrations)
          //defer = processData.returnDeferredTimeArray(V.recordsHashTable, output.recordsHashTable, res.event.resultLatency)
          //deferredTimes = deferredTimes.concat(defer)
          console.log('output: ', output)
          return output
        })
        this.setState({
          event: res.event,
          groups: res.groups,
          races: races,
          registrations: res.registrations,
          nameTables: {
            group: processData.returnIdNameMap(res.groups),
            race: processData.returnIdNameMap(res.races),
            reg: processData.returnRegMap(res.registrations)
          }
        }, function () { successCallback() })
        //return updateRacesLater(deferredTimes, races, res.event.resultLatency, res.registrations)
      }
    }
    const onSuccess = () => {
      this.socketIoEvents()
      this.updateOngoingRaces(true)
    }
    this._bind('socketIoEvents', 'handleSelect', 'updateRecords', 'updateOngoingRaces')
    this.socketio = io(SERVICE_URL)
    getEvent(onSuccess)
  }
  componentWillReceiveProps () {
    if (this.state.event) { this.updateOngoingRaces() }
  }
  componentWillUnmount () {
    this.socketio.close()
  }
  socketIoEvents (callback) {
    this.socketio.on('connect', function () {
      fetch(`/api/socket/info?sid=${this.socketio.id}`, {credentials: 'same-origin'}).then(V => { if (callback !== undefined) { callback() } })
    }.bind(this))
    this.socketio.on('eventlatencyupdate', function (data) {
      console.log('eventlatencyupdate data: ', data)
      this.setState({event: {...this.state.event, resultLatency: data.event.resultLatency }})
      this.dispatch(eventActions.updateEventLatency(data))
    }.bind(this))
    this.socketio.on('raceupdate', function (data) {
      setTimeout(function () {
        this.setState({ races: processData.updateRaces(this.state.races, data.races, this.state.registrations) })
      }.bind(this), this.state.event.resultLatency)
    }.bind(this))
    this.socketio.on('raceend', function (data) {
      setTimeout(function () {
        this.setState({
          event: {...this.state.event, ongoingRace: ''},
          races: processData.updateRaces(this.state.races, data.races, this.state.registrations)
        })
      }.bind(this), this.state.event.resultLatency)
    }.bind(this))
  }
  handleSelect (index) {
    return (e) => { this.setState({ raceSelected: index }) }
  }
  render ({matches}, {event, groups, races, nameTables}) {
    const { raceSelected } = this.state
    if (!matches.uniqueName) {
      return <Redirect to={{pathname: '/'}} />
    } else if (!event) {
      return <div><Header location={location} match={matches} isPublic='1' /><div className={css.loading}>Loading...</div></div>
    }
    const race = races[raceSelected]
    return (<div className={css.wrap}>
      {<Header location={location} match={matches} /> }
      <div className={css.mainBody}>
        <div className={css.info}>
          <h2>{event.nameCht}</h2>
          <ul className={css.raceSelector}>
            {groups.length > 1
              ? races.map((race, index) => render.raceList({ race, index, raceSelected, groupNames: nameTables.group, handleSelect: this.handleSelect }))
              : races.map((race, index) => render.raceList({ race, index, raceSelected, handleSelect: this.handleSelect }))
            }
          </ul>
        </div>
        {race.registrationIds.length === 0
          ? <div className={css.noData}>比賽尚未開始</div>
          : <div className={css.managerList}>
              <div></div>
              {render.dashboard.labels(race, nameTables.reg)}
              <div className={css.scrollBox}>{render.dashboard.results(race)}</div>
              <div className={css.summary}>{render.dashboard.summary(race)}</div>
              <div className={css.advTable}>{render.dashboard.advance({race, raceNames: nameTables.race})}</div>
            </div>
        }
        <div className={css.footer}>Powered by Beardude Event <span>&copy;</span> <span>{new Date().getFullYear()}</span> </div>
      </div>
    </div>)
  }
}
export default Event