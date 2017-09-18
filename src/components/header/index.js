import { h } from 'preact'
import { Link } from 'preact-router/match'
import css from './style.less'

const Header = ({name, uniqueName, navs}) => <div className={css.mainHeader}>
  {uniqueName === undefined ? <div className={css.heading}><h1 className={css.bdlogo}><span>Beardude</span><span>Event</span></h1></div>
    : <div className={css.heading}>
      <h1 className={css.eventName}><Link activeClassName={css.active} className={css.nav} href={`/event/${uniqueName}/home`}>{name}</Link></h1>
      <ul className={css.navContainer}>{navs.map(nav => <li key={'nav-' + nav.key}><Link activeClassName={css.navActive} className={css.nav} href={`/event/${uniqueName}/${nav.key}`}>{nav.name}</Link></li>)}</ul>
    </div>}
</div>

export default Header
