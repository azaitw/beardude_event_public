import { h, Component } from 'preact'
import { route, Router } from 'preact-router'
import 'preact/devtools'
import Eventlist from './Eventlist'
import Event from './Event'

export default class App extends Component {
  handleRoute = (e) => {
    this.currentUrl = e.url
  }

  render () {
    return (
      <div id="app">
        <Router onChange={this.handleRoute}>
          <Eventlist path="/" />
          <Event path="/event/:uniqueName/:tab" />
        </Router>
      </div>
    );
  }
}
