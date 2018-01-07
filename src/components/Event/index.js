/* global fetch */
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
  eventDateLocation: ({location, startTime}) => <div class={css.eventTitle}>
    <div>{location}</div>
    <div class={css.time}>{processData.returnDate(startTime)}</div>
    <div class={css.time}>{processData.returnTime(startTime)}</div>
  </div>,
  dashboard: {
    main: ({groups, races, raceSelected, nameTables, handleSelect}) => {
      const race = races[raceSelected]
      const nav = <ul class={css.raceSelector}>{races.map((race, index) => render.raceList({ race, index, raceSelected, groupNames: (groups.length > 1) ? nameTables.group : undefined, handleSelect }))}</ul>
      if (!race || (race && race.registrationIds.length === 0)) { return <span>{nav}<div class={css.noData}>尚無比賽資料</div></span> }
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
    this.youtubeParams = '?rel=0&controls=0&modestbranding=1&enablejsapi=1&autoplay=1&hd=1&autohide=1&showinfo=0&playsinline=1'
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
      system: undefined,
      nameTables: {},
      raceSelected: 0,
      bgVideoHeight: 315,
      streamHeight: 315,
      broadcastStatus: undefined
    }
    this._bind('socketIoEvents', 'handleSelect', 'setIframeHeight', 'updateBroadcastStatus')
  }
  componentDidMount () {
    const getEvent = async (successCallback) => {
      const response = await fetch(`/api/event/info/${this.props.matches.uniqueName}`, {credentials: 'include'})
      if (response.status === 200) {
        const res = await response.json()
        return this.setState({
          event: res.event,
          groups: res.groups,
          races: res.races,
          registrations: res.registrations,
          nameTables: { group: processData.returnIdNameMap(res.groups), race: processData.returnIdNameMap(res.races), reg: processData.returnRegMap(res.registrations) }
        }, function () { successCallback(res) })
      }
      return route('/')
    }
    const onSuccess = (res) => {
      this.socketIoEvents()
      this.setIframeHeight()
      this.updateBroadcastStatus()
      //obj.raceSelected = processData.returnSelectedRace(this.state.races, obj.ongoingRace)
      this.setState({ raceSelected: processData.returnSelectedRace(this.state.races, res.system.ongoingRace) })
      if (this.bgVideo) {
        this.bgVideoIframe = YouTubePlayer('bgVideo')
        this.bgVideoIframe.mute()
      }
      if (this.streamVideo) {
        this.streamVideoIframe = YouTubePlayer('streamVideo')
      }
      if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i)) {
        this.isMobile = true
        // On mobile Youtube video is paused initially. start the video
        if (this.state.broadcastStatus === 'init' && this.bgVideoIframe) { this.bgVideoIframe.playVideo() }
        if (this.state.broadcastStatus === 'live' && this.streamVideoIframe) { this.streamVideoIframe.playVideo() }
      }
      // TO DO: 改用next, 這些都用head去包
      document.title = event.nameCht
      const info = event.name + ' - ' + event.location + ' ' + processData.returnDate(event.startTime) + ' ' + processData.returnTime(event.startTime)
      document.description = info
      document.querySelector('meta[property=\'og:title\']').content = event.nameCht
      document.querySelector('meta[name=\'description\']').content = info
      document.querySelector('meta[property=\'og:description\']').content = info
    }

    if (!this.props.matches.uniqueName) { return route('/') }
    this.socketio = io(window.location.origin)
    window.addEventListener('resize', this.setIframeHeight)
    getEvent(onSuccess)
  }
  componentWillUnmount () {
    this.socketio.close()
    window.removeEventListener('resize', this.setIframeHeight)
  }
  componentDidUpdate () {
    // bgVideo和stream並存的時候, 切換兩個影片時要暫停/開始
    if (this.bgVideo && this.streamVideo) {
      if (this.props.matches.tab === 'live') {
        if (this.bgVideoIframe) { this.bgVideoIframe.pauseVideo() }
        if (this.streamVideoIframe) { this.streamVideoIframe.playVideo() }
      } else {
        if (this.bgVideoIframe) { this.bgVideoIframe.playVideo() }
        if (this.streamVideoIframe) { this.streamVideoIframe.pauseVideo() }
      }
    }
  }
  setIframeHeight () {
    this.setState({streamHeight: Math.floor(Math.min(window.innerWidth, 1137) / 16 * 9), bgVideoHeight: Math.floor(window.innerWidth / 16 * 9)})
  }
  updateBroadcastStatus () {
    const now = Date.now()
    const postRaceWaitMS = 21600000 // 6 hours
    let result = 'init'
    if (now >= this.state.event.startTime) { result = 'started' }
    if (now >= this.state.event.streamingStart) { result = 'live' }
    if (now >= (this.state.event.endTime + postRaceWaitMS)) { result = 'ended' }
    this.setState({broadcastStatus: result})
  }
  socketIoEvents (callback) {
    this.socketio.on('connect', function () {
      fetch(`/api/socket/info?sid=${this.socketio.id}`, {credentials: 'include'}).then(V => { if (callback !== undefined) { callback() } })
    }.bind(this))
    this.socketio.on('eventlatencyupdate', function (data) {
      this.setState({ system: {...this.state.system, resultLatency: data.system.resultLatency} })
    }.bind(this))
    this.socketio.on('raceupdate', function (data) {
      setTimeout(function () {
        this.setState({ races: processData.updateRaces(this.state.races, data.races, this.state.registrations) })
      }.bind(this), this.state.event.resultLatency)
    }.bind(this))
    this.socketio.on('raceend', function (data) {
      setTimeout(function () {
        this.setState({
          event: {...this.state.event},
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
    const navs = [{key: 'live', name: '實況'}, {key: 'rules', name: '規則'}, {key: 'register', name: '報名'}]
    let bgVideo = (event.promoVideo && event.promoVideo !== '') ? <div class={css.bgVideo}>{!this.isMobile && <div class={css.bgVideoMask} />}<iframe id='bgVideo' ref={c => (this.bgVideo = c)} width='100%' height={this.state.bgVideoHeight} src={`${event.promoVideo}${this.youtubeParams}&playlist=${event.promoVideo}&loop=1&vq=hd1080`} frameborder='0' allowfullscreen /><div class={css.videoCredit}><a target='_blank' href='https://www.youtube.com/channel/UCgqJcN37au-Qa9HJ98c20CQ'>Video by Kadacha &copy; 2017</a></div></div> : <div id='bgVideo' width='100%' height={bgVideoHeight} />
    let dateLocation = render.eventDateLocation({ location: event.location, startTime: event.startTime })
    let overlayText = ''
    let stream = (event.streamingIframe && event.streamingIframe !== '') ? <div class={css.streamVideo}><iframe id='streamVideo' ref={c => (this.streamVideo = c)} class={css.stream} width='100%' height={streamHeight} src={`${event.streamingIframe}${this.youtubeParams}`} frameborder='0' allowfullscreen /></div> : ''
    let announcement = (event.announcement && event.announcement !== '') ? <div class={css.announcement}>[公告] {event.announcement}</div> : ''

    /*
      時間 / tab. 該時間點所有的tab內容都會render, 透過css控制顯示/隱藏, 如此切換tab的時候Youtube的影片不會中斷
                home          live            rules           register
      init:     bgV           bgV+txt+board   bgV+rules       bgV+reg
      started:  bgV+txt+board stream+txt+board   bgV+txt+rules   bgV+txt+reg
      live:     stream+board  stream+board    stream+rules    stream+reg    (bgV改成stream)
      ended:    bgV+board     stream+board    bgV+rules       bgV+reg
    */
    switch (broadcastStatus) {
      case 'init':
        overlayText = <div class={css.overlayText}>成績將即時更新，決賽直播 {processData.returnTime(event.streamingStart)} 開始</div>
        stream = ''
        break
      case 'started':
        overlayText = <div class={css.overlayTextLive}>比賽進行中，預計 {processData.returnTime(event.streamingStart)} 開始轉播</div>
        break
      case 'live':
        dateLocation = ''
        bgVideo = ''
        break
    }
    return <div class={css.wrap}>
      <Header name={event.nameCht} uniqueName={event.uniqueName} navs={navs} />
      <div class={css.mainBody} style={{minHeight: bgVideoHeight}}>
        <div class={css['wrap-' + broadcastStatus]}>
          <div class={css[(matches.tab === undefined) ? 'home' : matches.tab]}>
            <div class={css.herowrap}>
              {announcement}
              {overlayText}
              {dateLocation}
              {bgVideo}
              {stream}
            </div>
            {event.rules && event.rules !== '' && <div class={css.rulesTab}>{returnLineBreakText(event.rules)}</div>}
            {event.registerDesc && event.registerDesc !== '' && <div class={css.registerTab}>{returnLineBreakText(event.registerDesc)}</div>}
            <div class={css.dashboard}>{render.dashboard.main({nameTables, groups, races, raceSelected, handleSelect: this.handleSelect})}</div>
          </div>
        </div>
      </div>
      <div class={css.footer}>
        <span>Powered by Beardude Event <span>&copy;</span> <span>{new Date().getFullYear()}</span></span>
      </div>
    </div>
  }
}
export default Event
