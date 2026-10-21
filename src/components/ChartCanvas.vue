<script setup>
// Thin Chart.js wrapper that follows the light/dark theme.
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  Chart, LineController, BarController, DoughnutController, LineElement, BarElement, ArcElement,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js';

Chart.register(LineController, BarController, DoughnutController, LineElement, BarElement, ArcElement,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const props = defineProps({
  type: { type: String, default: 'line' },
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  stacked: Boolean,
  height: { type: Number, default: 260 },
  money: String,
  legend: { type: Boolean, default: true },
});

const canvas = ref(null);
let chart = null;
const media = window.matchMedia('(prefers-color-scheme: dark)');

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function build() {
  chart?.destroy();
  const text = css('--muted');
  const grid = css('--border');
  const fmt = props.money
    ? (v) => new Intl.NumberFormat('en', { style: 'currency', currency: props.money, maximumFractionDigits: 0 }).format(v)
    : (v) => new Intl.NumberFormat('en').format(v);
  const isPie = props.type === 'doughnut';
  chart = new Chart(canvas.value, {
    type: props.type,
    data: { labels: props.labels, datasets: props.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: isPie ? 'nearest' : 'index', intersect: isPie },
      plugins: {
        legend: { display: props.legend, position: 'bottom', labels: { color: text, usePointStyle: true, boxWidth: 8, padding: 16, font: { family: 'Plus Jakarta Sans', weight: 600 } } },
        tooltip: {
          backgroundColor: '#2a1534', padding: 10, cornerRadius: 10, titleFont: { family: 'Plus Jakarta Sans' }, bodyFont: { family: 'Plus Jakarta Sans' },
          callbacks: isPie ? {} : { label: (c) => ` ${c.dataset.label}: ${props.money ? fmt(c.parsed.y) : c.parsed.y}` },
        },
      },
      scales: isPie ? {} : {
        x: { stacked: props.stacked, grid: { display: false }, ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { family: 'Plus Jakarta Sans' } }, border: { color: grid } },
        y: { stacked: props.stacked, beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: text, precision: 0, callback: fmt, font: { family: 'Plus Jakarta Sans' } } },
      },
      cutout: isPie ? '68%' : undefined,
      elements: { line: { cubicInterpolationMode: 'monotone', borderWidth: 2.5 }, point: { radius: 0, hoverRadius: 5 }, bar: { borderRadius: 6 } },
    },
  });
}

onMounted(() => { build(); media.addEventListener('change', build); });
onBeforeUnmount(() => { chart?.destroy(); media.removeEventListener('change', build); });
watch(() => [props.labels, props.datasets], build, { deep: true });
</script>

<template>
  <div :style="{ height: height + 'px', position: 'relative' }"><canvas ref="canvas" /></div>
</template>
