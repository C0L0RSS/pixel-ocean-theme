import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { buildScene } from './scene'

const SCENE = 'pixel-ocean'

// Deep-sea navy grays with a coral accent, made for dark mode only.
const { theme, problems } = makeColors({
  label: 'Pixel Ocean',
  only: 'dark',
  roles: { accent: '#f0835a', danger: '#e5484d', success: '#4fd1a0', warning: '#e8b04f', pro: '#a58bff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#06141f',
        'surface-1': '#0a1c2a',
        'surface-2': '#0e2433',
        'surface-3': '#10273a',
        'text-primary': '#e2f4f7',
        'text-secondary': '#b3d4dc',
        'text-muted': '#8bb0bb',
      },
    },
    git: { added: '#4fd1a0', modified: '#e8b04f' },
  },
})

// Light frosting, so the pixels still show through the panels.
const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 8, tint: '#061a28', opacity: 0.66 } },
}

// Built once: the scene never changes while the session runs.
const SVG = buildScene()

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    // No status line when isDrawn is false: the desktop app attaches after
    // session.start, so the theme always reads as undrawn here and draws anyway.
    await $.theme.set(LOOK)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== SCENE) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        source={SVG}
        alt="An 8-bit underwater scene: a coral crab on the seabed, fish, jellyfish, a turtle, seaweed and bubbles"
        isInteractive
      />
    )
  })
}
