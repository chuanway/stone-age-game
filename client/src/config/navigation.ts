export interface NavNode {
  label: string
  path?: string
  children?: NavNode[]
  requiresAuth?: boolean
  requiresGuest?: boolean
  requiresClan?: boolean
}

export const navTree: NavNode[] = [
  {
    label: 'Home',
    path: '/',
    children: [
      { label: 'Login', path: '/login', requiresGuest: true },
      { label: 'Register', path: '/register', requiresGuest: true },
    ],
  },
  { label: 'Profile', path: '/profile', requiresAuth: true },
  {
    label: 'Game',
    path: '/game',
    requiresAuth: true,
    children: [
      {
        label: 'City',
        path: '/game/city',
        children: [
          { label: 'PvE', path: '/game/city/pve' },
          { label: 'PvP', path: '/game/city/pvp' },
        ],
      },
      {
        label: 'Clans',
        path: '/game/clans',
        children: [
          { label: 'My Clan', path: '/game/clans/my', requiresClan: true },
          { label: 'Clan PvE', path: '/game/clans/pve', requiresClan: true },
          { label: 'Clan War', path: '/game/clans/war', requiresClan: true },
        ],
      },
    ],
  },
]
