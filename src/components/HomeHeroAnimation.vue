<!--
  HomeHeroAnimation.vue
  首页 Hero 区域右侧 3D 等距图标网格动画（简化移植自 lucide 官方 VitePress 主题）

  ═══════════════════════════════════════════════════════════════════
  一、动画阶段（基于 setTimeout 的状态机，非 CSS animation 事件）
  ═══════════════════════════════════════════════════════════════════

  阶段 (phase)   触发时机        视觉效果
  ───────────────────────────────────────────────────────────────────
  draw           初始            中心扳手图标 pathLength 描边绘制
  scale          2100ms          扳手缩小并位移到网格左上角
  icons          3000ms          63 个工具图标按 index 波浪淡入
  done           5200ms          动画结束，保持最终静止画面

  若用户开启 prefers-reduced-motion，挂载时直接跳到 done，跳过所有过渡。

  ═══════════════════════════════════════════════════════════════════
  二、时间轴（单位 ms）
  ═══════════════════════════════════════════════════════════════════

  0      页面加载，扳手 pathLength 描边开始（delay 350ms，spring 1.8s）
  2100   phase → scale，扳手 scale 1→0.1，位移 (-10.5, -10.5)
  3000   phase → icons，末格 delay ≈ 63 × 23ms ≈ 1.45s
  5200   phase → done，动画定格

  ═══════════════════════════════════════════════════════════════════
  三、视觉与坐标系
  ═══════════════════════════════════════════════════════════════════

  - viewBox="-12 -12 48 48"：24×24 设计坐标，外扩 12 单位边距
  - 8×8 网格：SIZE=2, GAP=1，格心 = index % 8 × CELL + 0.5
  - index 0 移到 (9999, 9999)：中心格预留给缩小后的扳手 logo
  - rotateX(-51deg) rotateZ(-43deg)：等距透视（非 CSS perspective）
  - sceneOpacity：随 scrollY 线性淡出，220px 滚动距离内从 1→0
-->
<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type Component, type PropType } from 'vue'
import { motion } from 'motion-v'
import {
  Link,
  Clock,
  Code,
  Hash,
  Braces,
  Shield,
  Zap,
  Settings,
  Terminal,
  Database,
  Lock,
  Key,
  Search,
  Globe,
  Binary,
  FileJson,
  Wrench,
  Copy,
  Layers,
  Box,
  Cpu,
  Wifi,
  Mail,
  Calendar,
  Bell,
  Bookmark,
  Tag,
  Filter,
  GitBranch,
  Cloud,
  Download,
  Upload,
  Eye,
  Palette,
} from '@lucide/vue'

/** 动画阶段：描边 → 缩小 → 图标浮现 → 完成 */
type Phase = 'draw' | 'scale' | 'icons' | 'done'

/** 8×8 网格列数 */
const COLUMNS = 8
/** 单个图标在 viewBox 中的渲染尺寸 */
const SIZE = 2
/** 格与格之间的间距 */
const GAP = 1
/** 相邻格心的步进距离 = SIZE + GAP */
const CELL = SIZE + GAP

/**
 * 环绕中心格的 63 个工具类图标（index 0 为中心占位，不在此列表使用）。
 * 超出 63 个时循环复用。
 */
const iconComponents: Component[] = [
  Link, Clock, Code, Hash, Braces, Shield, Zap, Settings,
  Terminal, Database, Lock, Key, Search, Globe, Binary, FileJson,
  Wrench, Copy, Layers, Box, Cpu, Wifi, Mail, Calendar,
  Bell, Bookmark, Tag, Filter, GitBranch, Cloud, Download,
  Upload, Eye, Palette,
]

/**
 * 预计算 64 格布局数据（8×8）。
 * - index 0：hidden，坐标甩到视口外，留给中心扳手 logo
 * - index 1–63：按行列映射到格心，绑定对应 Lucide 组件
 */
const gridIcons = Array.from({ length: 64 }, (_, index) => {
  const x = (index % COLUMNS) * CELL + 0.5
  const y = Math.floor(index / COLUMNS) * CELL + 0.5

  if (index === 0) {
    return { component: null as Component | null, x: 9999, y: 9999, hidden: true, index }
  }

  return {
    component: iconComponents[(index - 1) % iconComponents.length],
    x,
    y,
    hidden: false,
    index,
  }
})

/** 模板 v-for 用的可见图标子集（排除中心占位格） */
const visibleGridIcons = computed(() => gridIcons.filter((item) => !item.hidden && item.component))

/**
 * 将 Lucide 图标组件包装为 motion 组件，
 * 使其支持 variants、stagger delay（custom）等 motion-v 动画属性。
 */
const MotionGridIcon = motion.create(
  defineComponent({
    name: 'MotionGridIcon',
    props: {
      icon: { type: [Object, Function] as PropType<Component>, required: true },
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    setup(props) {
      return () =>
        h(props.icon, {
          x: props.x,
          y: props.y,
          size: SIZE,
          strokeWidth: 2,
          'stroke-width': 2, // SVG 属性别名，兼容不同渲染路径
        })
    },
  }),
)

/** 当前动画阶段，驱动各 motion 元素的 animate 计算属性 */
const phase = ref<Phase>('draw')

/** 中心扳手路径的描边动画：pathLength 0→1，带 spring 弹性 */
const drawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1.02, // 略大于 1，避免描边末端出现缺口
    opacity: 1,
    transition: {
      pathLength: { delay: 0.35, type: 'spring', duration: 1.8, bounce: 0 },
      opacity: { delay: 0.35, duration: 0.15 },
    },
  },
}

/**
 * 中心 logo 组的缩放/位移动画。
 * full：原始大小居中；small：缩至 0.1 并偏移到网格左上角，与周围图标对齐。
 */
const scaleVariants = {
  full: { scale: 1, x: 0, y: 0 },
  small: {
    x: -10.5,
    y: -10.5,
    scale: 0.1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }, // easeOutCubic 近似
  },
}

/**
 * 网格图标的波浪淡入动画。
 * custom = item.index，delay = index × 23ms，形成从左上到右下的依次浮现效果。
 */
const iconVariants = {
  hidden: { opacity: 0, x: 0, y: 0 },
  visible: (index: unknown) => ({
    opacity: 0.45,
    x: [0.5, 0, 0], // 轻微水平抖动，增加灵动感
    y: [-0.5, 0, 0],
    transition: {
      delay: Number(index) * 0.023,
      duration: 0.9,
      ease: 'easeInOut',
    },
  }),
}

/** draw 阶段保持 full，之后切换为 small */
const centerScale = computed(() => (phase.value === 'draw' ? 'full' : 'small'))

/** icons / done 阶段才显示网格图标，之前保持 hidden */
const iconAnimate = computed(() =>
  phase.value === 'icons' || phase.value === 'done' ? 'visible' : 'hidden',
)


onMounted(() => {
  // 按时间轴推进状态机（与上方文件头时间轴对应）
  window.setTimeout(() => {
    phase.value = 'scale'
  }, 2100)

  window.setTimeout(() => {
    phase.value = 'icons'
  }, 3000)

  window.setTimeout(() => {
    phase.value = 'done'
  }, 5200)
})


</script>

<template>
  <!-- aria-hidden：纯装饰动画，对屏幕阅读器隐藏 -->
  <div class="hero-anim" aria-hidden="true">
    <motion.svg
      class="hero-anim__scene"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-12 -12 48 48"
      fill="none"
      overflow="visible"
      stroke="currentColor"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- 背景虚线网格：两组 path 交错形成点状格线 -->
      <g
        class="hero-anim__grid"
        stroke-linecap="butt"
        stroke-width="0.1"
        stroke="#777"
        stroke-opacity="0.3"
      >
        <!-- stroke-dasharray 控制虚线节奏，营造等距网格质感 -->
        <path
          stroke-dasharray="0 0.1 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0.1 0.15 0 0.15"
          d="M1 0.1v23.8M2 0.1v23.8M4 0.1v23.8M5 0.1v23.8M7 0.1v23.8M8 0.1v23.8M10 0.1v23.8M11 0.1v23.8M13 0.1v23.8M14 0.1v23.8M16 0.1v23.8M17 0.1v23.8M19 0.1v23.8M20 0.1v23.8M22 0.1v23.8M23 0.1v23.8M0.1 1h23.8M0.1 2h23.8M0.1 4h23.8M0.1 5h23.8M0.1 7h23.8M0.1 8h23.8M0.1 10h23.8M0.1 11h23.8M0.1 13h23.8M0.1 14h23.8M0.1 16h23.8M0.1 17h23.8M0.1 19h23.8M0.1 20h23.8M0.1 22h23.8M0.1 23h23.8"
        />
        <path
          d="M3 0.1v23.8M6 0.1v23.8M9 0.1v23.8M12 0.1v23.8M15 0.1v23.8M18 0.1v23.8M21 0.1v23.8M0.1 3h23.8M0.1 6h23.8M0.1 9h23.8M0.1 12h23.8M0.1 15h23.8M0.1 18h23.8M0.1 21h23.8"
        />
      </g>

      <motion.g>
        <!-- 63 个工具图标，按 index stagger 淡入 -->
        <MotionGridIcon
          v-for="item in visibleGridIcons"
          :key="item.index"
          :icon="item.component!"
          :x="item.x"
          :y="item.y"
          :custom="item.index"
          :variants="iconVariants"
          initial="hidden"
          :animate="iconAnimate"
          class="hero-anim__icon"
        />

        <!-- 中心扳手 logo：先描边绘制，再缩小嵌入网格左上角 -->
        <motion.g
          class="hero-anim__logo"
          :variants="scaleVariants"
          initial="full"
          :animate="centerScale"
          :style="{ transformOrigin: '12px 12px', transformBox: 'fill-box' }"
        >
          <motion.path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            :style="{ stroke: 'var(--color-cta)' }"
            stroke-width="1.25"
            :variants="drawVariants"
            initial="hidden"
            animate="visible"
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  </div>
</template>

<style scoped>
/* 取景框：裁切 3D 变换后溢出的区域，禁止交互 */
.hero-anim {
  width: 100%;
  max-width: 28rem;
  height: 18rem;
  margin-inline: auto;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

/* 桌面端放大取景框，取消水平居中以配合 Hero 左右分栏布局 */
@media (min-width: 960px) {
  .hero-anim {
    max-width: none;
    height: 24rem;
    margin-inline: 0;
  }
}

/* 等距透视：双轴旋转模拟 3D 俯视角度 */
.hero-anim__scene {
  display: block;
  width: 100%;
  height: 100%;
  /* transform: rotateX(-51deg) rotateZ(-43deg); */
  transform: rotateX(-51deg) rotateZ(-43deg) scale(1.6);
  transform-style: preserve-3d;
  transform-origin: center center;
  will-change: transform, opacity;
  color: var(--color-text-subtle);
}

.hero-anim__icon {
  color: var(--color-text-muted);
}

/* 减少动画时保留静态 3D 角度，不额外禁用 transform */
@media (prefers-reduced-motion: reduce) {
  .hero-anim__scene {
    transform: rotateX(-51deg) rotateZ(-43deg);
  }
}
</style>
