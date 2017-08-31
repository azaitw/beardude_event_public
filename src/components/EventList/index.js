import { h, Component } from 'preact'
import css from './style.css'
import Header from '../Header'
import { Link } from 'preact-router'

const EventBrick = ({ events = [] }) =>
events.length > 0
? events.map(raceEvent =>
  <li key={'event-' + raceEvent.id}>
    <Link class={css.bigIcon} href={'/event/' + raceEvent.uniqueName}>{raceEvent.nameCht}</Link>
  </li>)
: null

class EventList extends Component {
  state = {
    events: []
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
  render ({}, {events}) {
    return (
      <div className={css.wrap}>
        <Header location={location} nav='base' />
        <div className={css.mainBody}>
          <ul className={css.iconView}>
            {EventBrick({events})}
          </ul>
        </div>
      </div>
    )
  }
}

export default EventList
