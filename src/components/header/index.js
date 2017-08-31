import { h, Component } from 'preact'
import { Link } from 'preact-router'
import css from './style.less'

export default class Header extends Component {
  render () {
    return (<div className={css.mainHeader}>
      <div className={css.heading}>
        <h1 className={css.bdlogo}>
          <Link href='/'>
            <span className={css.logoB}>Beardude</span>
            <span className={css.logoE}>Event</span>
          </Link>
        </h1>
      </div>

    </div>)
  }
}
