/* global fetch, SERVICE_URL */
import { h, Component } from 'preact'
import css from './style.css'
import { Link } from 'preact-router'

class EventList extends Component {
  constructor () {
    super()
    this.state = { events: [] }
  }
  componentDidMount () {
    const getEvents = async () => {
      const response = await fetch(`${SERVICE_URL}/api/event/getEvents`, {credentials: 'same-origin'})
      const res = await response.json()
      if (response.status === 200) {
        this.setState({events: res.events})
      }
    }
    getEvents()
  }
  render () {
    return (
      <div className={css.wrap}>
        <this.props.Header />
        <div className={css.mainBody}>
          <ul className={css.iconView}>
            {this.state.events.length > 0 && this.state.events.map(raceEvent =>
              <li key={'event-' + raceEvent.id}><Link class={css.bigIcon} href={`/event/${raceEvent.uniqueName}/home`}>{raceEvent.nameCht}</Link></li>
            )}
          </ul>
        </div>
      </div>
    )
  }
}

export default EventList
