import { h, Component } from 'preact'
import { Router } from 'preact-router'
import 'preact/devtools'
import Eventlist from './EventList'
import Event from './Event'
import Header from './Header'

export default class App extends Component {
  handleRoute = (e) => {
    this.currentUrl = e.url
  }

  render () {
    return (
      <div id='app'>
        <Router onChange={this.handleRoute}>
          <Eventlist path='/' Header={Header} />
          <Event path='/event/:uniqueName/:tab' Header={Header} />
        </Router>
      </div>
    )
  }
}
