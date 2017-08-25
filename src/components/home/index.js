import { h, Component } from 'preact'
import { readStories } from '../../lib/dbSample'
import style from './style.less'

export default class Home extends Component {
  async componentDidMount () {
     this.setState({
       dbSample: await readStories()
     })
	}

  render () {
    return (
      <div class={style.home}>
        <h1>Home</h1>
        <p>This is the Home component.</p>
        <p>{`That is the db sample. - ${this.state.dbSample}`}</p>
      </div>
    )
  }
}
