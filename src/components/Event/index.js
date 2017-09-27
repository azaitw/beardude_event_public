/* global fetch, SERVICE_URL */
import { h, Component } from 'preact'
import io from 'socket.io-client'
import YouTubePlayer from 'youtube-player'
import { route } from 'preact-router'
import Header from '../Header/index'
import processData from './processData'
import css from './style.css'

const render = {
  raceList: ({race, raceSelected, index, handleSelect, groupNames}) => {
    return <li class={(index === raceSelected) ? css.selected : css.li} key={'race' + race.id}>
      <div class={css[race.raceStatus]} />
      <button class={css.list} onClick={handleSelect(index)}>
        {groupNames && <span>{groupNames[race.group.toString()]} -</span>}
        <span>{(race.nameCht) ? race.nameCht : race.name}</span>
      </button>
    </li>
  },
  dashboard: {
    main: ({groups, races, raceSelected, nameTables, handleSelect}) => {
      const race = races[raceSelected]
      const nav = <ul class={css.raceSelector}>{races.map((race, index) => render.raceList({ race, index, raceSelected, groupNames: (groups.length > 1) ? nameTables.group : undefined, handleSelect }))}</ul>
      if (race && race.registrationIds.length === 0) { return <span>{nav}<div class={css.noData}>比賽尚未開始</div></span> }
      return <span>{nav}
        <div class={css.managerList}>
          <div class={css.dashId}>{render.dashboard.labels(race, nameTables)}</div>
          <div class={css.scrollBox}>{render.dashboard.results(race)}</div>
          <div class={css.summary}>{render.dashboard.summary(race)}</div>
          <div class={css.advTable}>{render.dashboard.advance(race, nameTables)}</div>
        </div></span>
    },
    labels: (race, nameTables) => <table class={css.dashTable}>
      <thead><tr><th class={css.no}>排位</th><th class={css.name}>選手</th></tr></thead>
      <tbody>{race && race.result && race.result.map((record, index) => {
        const obj = nameTables.reg[record.registration]
        return obj ? <tr class={css.dashItem} key={'rec' + index}>
          <td class={css.no}>{index + 1}</td>
          <td class={css.name}><span class={css.raceNumber}>{obj.raceNumber}</span> <span>{obj.name}</span></td>
        </tr> : <tr />
      })}
      </tbody></table>,
    results: (race) => <table class={css.dashTable}>
      <thead><tr>
        {race && race.result[0] && race.result[0].lapRecords.map((V, I) => <th key={'th-' + I}>{I + 1}</th>)}
      </tr></thead>
      <tbody>{race && (race.result.length > 0) && race.result.map((record, index) => <tr key={'tr-rec-' + record.registration} class={css.dashItem}>
        {record.lapRecords.map((time, index) => <td key={'record-' + index} class={css.lap}>{time}</td>)}
      </tr>)}</tbody>
    </table>,
    summary: (race) => <table class={css.dashTable}>
      <thead><tr><th>加總</th></tr></thead>
      <tbody>{race && race.result && race.result.map((record, index) => <tr class={css.dashItem} key={'lap' + index}><td class={css.lap}>{record.sum}</td></tr>)}
      </tbody>
    </table>,
    advance: (race, nameTables) => <table class={css.dashTable}>
      <thead><tr><th><span>{race && race.isFinalRace ? '總排名' : '晉級'}</span></th></tr></thead>
      <tbody>{race && race.result && race.result.map((record, index) => <tr key={'adv' + index} class={css.dashItem}><td class={css.center}>{race.isFinalRace ? index + 1 : nameTables.race[record.advanceTo]}</td></tr>)}</tbody>
    </table>
  }
}
const returnLineBreakText = (text) => (text) ? text.split('\n').map(item => <p>{item}</p>) : text

class Event extends Component {
  _bind (...methods) { methods.forEach((method) => { if (this[method]) { this[method] = this[method].bind(this) } }) }
  constructor () {
    super()
    this.bgVideo = undefined
    this.bgVideoIframe = undefined
    this.streamVideo = undefined
    this.streamVideoIframe = undefined
    this.isMobile = false
    this.state = {
      event: undefined,
      groups: undefined,
      races: undefined,
      registrations: undefined,
      nameTables: {},
      raceSelected: 0,
      ongoingRace: undefined,
      bgVideoHeight: 315,
      streamHeight: 315,
      isMobile: false,
      broadcastStatus: undefined
    }
    this._bind('socketIoEvents', 'handleSelect', 'updateRecords', 'updateOngoingRaces', 'setIframeHeight', 'updateBroadcastStatus')
  }
  updateOngoingRaces (toSelectRace) {
    let obj = { ongoingRace: (this.state.event.ongoingRace === -1) ? undefined : processData.returnOngoingRace(this.state.event.ongoingRace, this.state.races) }
    if (toSelectRace) { obj.raceSelected = processData.returnSelectedRace(this.state.races, obj.ongoingRace) }
    this.setState(obj)
  }
  // 按延遲的時間差, 依序/依時間差更新比賽成績
  updateRacesLater (deferredTimes, races, latency, regs) {
    const allowance = 3000
    if (deferredTimes.length > 0) {
      deferredTimes.map(time => {
        setTimeout(function () {
          let newRaces = races.map(race => {
            let output = {...race, recordsHashTable: processData.returnDeferredHashTable(race.recordsHashTable, time)}
            output.raceStatus = processData.returnDeferredRaceStatus(output.raceStatus, latency, output.endTime)
            return output
          })
          this.setState({races: newRaces})
        }.bind(this), time + allowance)
      })
    }
  }
  componentDidMount () {
    const getEvent = async (successCallback) => {
      const response = await fetch(`${SERVICE_URL}/api/event/info/${this.props.matches.uniqueName}`, {credentials: 'include'})
      if (response.status === 200) {
        const res = await response.json()
        let deferredTimes = []
        // 檢查有無延遲期間更新的資料, client第一次開啟頁面時做計算
        const races = res.races.map((V, I) => {
          let output = {...V}
          let defer = []
          output.recordsHashTable = processData.returnDeferredHashTable(output.recordsHashTable, res.event.resultLatency)
          output.raceStatus = processData.returnDeferredRaceStatus(output.raceStatus, res.event.resultLatency, output.endTime)
          output.result = processData.returnRaceResult(output, res.registrations)
          defer = processData.returnDeferredTimeArray(V.recordsHashTable, output.recordsHashTable, res.event.resultLatency)
          deferredTimes = deferredTimes.concat(defer)
          return output
        })
        this.setState({
          event: res.event,
          groups: res.groups,
          races: races,
          registrations: res.registrations,
          nameTables: { group: processData.returnIdNameMap(res.groups), race: processData.returnIdNameMap(res.races), reg: processData.returnRegMap(res.registrations) }
        }, function () { successCallback() })
        return this.updateRacesLater(deferredTimes, races, res.event.resultLatency, res.registrations)
      }
      return route('/')
    }
    const onSuccess = () => {
      this.socketIoEvents()
      this.updateOngoingRaces(true)
      this.setIframeHeight()
      this.updateBroadcastStatus()
      if (this.bgVideo) {
        this.bgVideoIframe = YouTubePlayer('bgVideo')
        this.bgVideoIframe.mute()
      }
      if (this.streamVideo) {
        this.streamVideoIframe = YouTubePlayer('streamVideo')
      }
      if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i)) {
        this.isMobile = true
      }
      document.title = this.state.event.nameCht
    }
    if (!this.props.matches.uniqueName) { return route('/') }
    this.socketio = io(SERVICE_URL)
    window.addEventListener('resize', this.setIframeHeight)
    getEvent(onSuccess)
  }
  componentWillUnmount () {
    this.socketio.close()
    window.removeEventListener('resize', this.setIframeHeight)
  }
  componentDidUpdate () {
    if (this.state.broadcastStatus === 'ended' && this.bgVideoIframe) {
      if (this.props.matches.tab === 'live') {
        this.bgVideoIframe.pauseVideo()
        this.streamVideoIframe.playVideo()
      } else {
        this.bgVideoIframe.playVideo()
        this.streamVideoIframe.pauseVideo()
      }
    }
  }
  setIframeHeight () {
    this.setState({streamHeight: Math.floor(Math.min(window.innerWidth, 1137) / 16 * 9), bgVideoHeight: Math.floor(window.innerWidth / 16 * 9)})
  }
  updateBroadcastStatus () {
    const now = Date.now()
    const postRaceWaitMS = 21600000 // 6 hours
    let result = 'ended'
    if (now < this.state.event.startTime) {
      result = 'init'
    } else if (this.state.event.startTime >= now && now < this.state.event.streamingStart) {
      result = 'started'
    } else if (now >= this.state.event.streamingStart && now < (this.state.event.endTime + postRaceWaitMS)) {
      result = 'live'
    }
    this.setState({broadcastStatus: result})
  }
  socketIoEvents (callback) {
    this.socketio.on('connect', function () {
      fetch(`/api/socket/info?sid=${this.socketio.id}`, {credentials: 'include'}).then(V => { if (callback !== undefined) { callback() } })
    }.bind(this))
    this.socketio.on('eventlatencyupdate', function (data) {
      this.setState({ event: {...this.state.event, resultLatency: data.event.resultLatency} })
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
  render ({matches}, {event, groups, races, nameTables, raceSelected, streamHeight, bgVideoHeight, broadcastStatus}) {
    if (!event) { return <div class={css.wrap}><div class={css.loading}>Loading...</div></div> }
    const youtubeBasicParams = '?rel=0&controls=0&modestbranding=1&enablejsapi=1&autoplay=1&hd=1&autohide=1&showinfo=0'
    const stream = <iframe id='streamVideo' ref={c => (this.streamVideo = c)} class={css.stream} width='100%' height={streamHeight} src={`${event.streamingIframe}${youtubeBasicParams}`} frameborder='0' allowfullscreen />
    let bgOverlay = <span>
      <div class={css.info}>
        <div class={css.location}>{event.location}</div>
        <div>{processData.returnDate(event.startTime)}</div>
        <div>{processData.returnTime(event.startTime)}</div>
      </div>
      <div class={css.credit}><a target='_blank' href='https://www.youtube.com/channel/UCgqJcN37au-Qa9HJ98c20CQ'>Video by Kadacha &copy; 2017</a></div>
    </span>
    let bgVideo = (event.promoVideo && event.promoVideo !== '') ? <iframe id='bgVideo' ref={c => (this.bgVideo = c)} width='100%' height={bgVideoHeight} src={`${event.promoVideo}${youtubeBasicParams}&loop=1`} frameborder='0' allowfullscreen /> : <div id='bgVideo' width='100%' height={bgVideoHeight} />
    let home = ''
    let register = ''
    let live = ''
    let navs = [{key: 'rules', name: '規則'}]
    let status = ''

    switch (broadcastStatus) {
      case 'init':
        // navs.push({key: 'register', name: '報名'})
        // register = <div class={css.registerTab}>報名</div>
        break
      case 'started':
        home = <div class={css.homeTab}>{render.dashboard.main({nameTables, groups, races, raceSelected, handleSelect: this.handleSelect})}</div>
        status = <div class={css.status}>比賽進行中</div>
        break
      case 'live':
        bgVideo = stream
        home = <div class={css.homeTab}>
          <p>{event.location} {processData.returnDate(event.startTime)} {processData.returnTime(event.startTime)} -</p>
          {render.dashboard.main({nameTables, groups, races, raceSelected, handleSelect: this.handleSelect})}
        </div>
        bgOverlay = ''
        break
      default:
        navs.unshift({key: 'live', name: '實況'})
        live = <div class={css.liveTab}>{stream}{render.dashboard.main({nameTables, groups, races, raceSelected, handleSelect: this.handleSelect})}</div>
    }

    return <div class={css.wrap}>
      <div class={this.isMobile ? css.mobileWrap : css.desktopWrap}>
        <Header name={event.nameCht} uniqueName={event.uniqueName} navs={navs} />
        <div class={css.mainBody} style={{minHeight: bgVideoHeight}}>
          <div class={css[(matches.tab === undefined) ? 'home' ? matches.tab]}>
            <div class={css.bgVideo}>
              <div class={css.bgOverlay}>
                {status}
                {bgOverlay}
              </div>
              {bgVideo}
            </div>
            {home}
            {event.rules && <div class={css.rulesTab}>{returnLineBreakText(event.rules)}</div>}
            {register}
            {live}
          </div>
        </div>
        <div class={css.footer}>
          <span>Powered by Beardude Event <span>&copy;</span> <span>{new Date().getFullYear()}</span></span>
        </div>
      </div>
    </div>
  }
}
export default Event
