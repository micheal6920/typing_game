import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const onHome = location.pathname === '/'

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.brand}>
        <span style={styles.brandMark} />
        Typing Race
      </Link>
      {!onHome && (
        <Link to="/" style={styles.exit}>
          Leave
        </Link>
      )}
    </header>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--line)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    color: 'var(--text-hi)',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '0.01em',
  },
  brandMark: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: 'var(--amber)',
    display: 'inline-block',
  },
  exit: {
    fontSize: 13,
    color: 'var(--text-mid)',
    textDecoration: 'none',
    border: '1px solid var(--line)',
    padding: '7px 14px',
    borderRadius: 4,
  },
}
