/* global fetch */
import { h, Component } from 'preact'
import css from './style.css'
// import { Link, route } from 'preact-router'
import { Link } from 'preact-router'
import Header from '../Header/index'

class EventList extends Component {
  constructor () {
    super()
    this.state = { events: [] }
  }
  componentDidMount () {
    const getEvents = async () => {
      const response = await fetch('/api/event/getEvents', {credentials: 'include'})
      if (response.status === 200) {
        const res = await response.json()
        // if (res.events.length === 1) { route(`/event/${res.events[0].uniqueName}`, true) }
        this.setState({events: res.events})
      }
    }
    getEvents()
  }
  render () {
    return (
      <div className={css.wrap}>
        <Header />
        <div className={css.mainBody}>
          <ul className={css.iconView}>
            {this.state.events.length > 0 && this.state.events.map(raceEvent =>
              <li key={'event-' + raceEvent.id}><Link class={css.bigIcon} href={`/event/${raceEvent.uniqueName}`}>{raceEvent.nameCht}</Link></li>
            )}
          </ul>
        </div>
      </div>
    )
  }
}

export default EventList
