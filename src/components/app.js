import { h, Component } from 'preact'
import { Router } from 'preact-router'
import 'preact/devtools'
import Home from './home'
import Eventlist from './Eventlist'
import PublicEvent from './PublicEvent'
import Profile from './profile'


export default class App extends Component {
/** Gets fired when the route changes.
 *  @param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
 *  @param {string} event.url	The newly routed URL
 */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    return (
      <div id="app">
        <Router onChange={this.handleRoute}>
          <Eventlist path="/" />
          <PublicEvent path="/event/:uniqueName" />
        </Router>
      </div>
    );
  }
}
