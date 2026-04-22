<script lang="ts">
  interface Props {
    variant?: 'dark' | 'light';
    size?: number;
    hideSubtitle?: boolean;
    class?: string;
  }

  let {
    variant = 'light',
    size = 160,
    hideSubtitle = false,
    class: className = '',
  }: Props = $props();

  const vbW = 260;
  const vbH = $derived(hideSubtitle ? 48 : 64);
  const svgHeight = $derived(Math.round(size * (vbH / vbW)));

  const letterColor = $derived(variant === 'dark' ? '#ffffff' : '#2D2F3B');
  const subtitleColor = $derived(
    variant === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(45,47,59,0.52)'
  );

  const dots = [
    { cx: 32, cy: 38 },
    { cx: 63, cy: 38 },
    { cx: 98, cy: 38 },
    { cx: 147, cy: 38 },
    { cx: 179, cy: 38 },
    { cx: 207, cy: 18 },
    { cx: 228, cy: 14 },
  ];
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {vbW} {vbH}"
  width={size}
  height={svgHeight}
  class={className}
  aria-label="Sanmart logo"
  role="img"
>
  <text
    x="0"
    y="40"
    font-family="Inter, sans-serif"
    font-size="38"
    font-weight="700"
    letter-spacing="-0.5"
    fill={letterColor}
  >Sanmart</text>

  {#each dots as dot, i (i)}
    <circle cx={dot.cx} cy={dot.cy} r="3" fill="#1BBB99" />
  {/each}

  {#if !hideSubtitle}
    <text
      x="130"
      y="58"
      font-family="Inter, sans-serif"
      font-size="9.5"
      font-weight="500"
      letter-spacing="0.14em"
      text-anchor="middle"
      fill={subtitleColor}
    >GESTIÓN FARMACIA</text>
  {/if}
</svg>
