<script setup lang="ts">
import { tools } from "@/config/tools";
import ToolCard from "@/components/ToolCard.vue";
import HomeHeroAnimation from "@/components/HomeHeroAnimation.vue";

const benefits = [
  {
    title: "即时可用",
    desc: "打开即用，无需注册登录",
    icon: "bolt",
  },
  {
    title: "本地处理",
    desc: "所有计算在浏览器完成，数据不上传",
    icon: "shield",
  },
  {
    title: "持续更新",
    desc: "更多实用工具陆续添加中",
    icon: "plus",
  },
];
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero" aria-label="网站介绍">
      <div class="container hero__layout">
        <div class="hero__content">
          <h1 class="hero__title">
            <span class="hero__primary">常用工具</span
            ><span class="hero__accent">一站搞定</span>
          </h1>
          <p class="hero__desc">纯前端运行，快速、安全、免费</p>
          <div class="hero__actions">
            <a href="#tools" class="btn btn-primary">浏览工具</a>
          </div>
        </div>
        <HomeHeroAnimation class="hero__visual" />
      </div>
    </section>

    <!-- Benefits -->
    <section class="benefits" aria-label="产品特点">
      <div class="container">
        <ul class="benefits__list">
          <li v-for="item in benefits" :key="item.title" class="benefits__item">
            <div class="benefits__icon" aria-hidden="true">
              <svg
                v-if="item.icon === 'bolt'"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <svg
                v-else-if="item.icon === 'shield'"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <svg
                v-else
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 class="benefits__title">{{ item.title }}</h3>
              <p class="benefits__desc">{{ item.desc }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Tools -->
    <section id="tools" class="tools" aria-labelledby="tools-title">
      <div class="container">
        <div class="tools__header">
          <h2 id="tools-title" class="tools__title">工具列表</h2>
          <p class="tools__subtitle">选择需要的工具，直接在浏览器中使用</p>
        </div>

        <div class="tools__grid">
          <ToolCard
            v-for="tool in tools"
            :key="tool.id"
            :tool="tool"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding-block: 3rem 2.5rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .hero {
    padding-block: 5rem 3.5rem;
  }
}

.hero__layout {
  display: grid;
  gap: 2rem;
  align-items: center;
}

@media (min-width: 960px) {
  .hero__layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem 3rem;
  }
}

.hero__content {
  max-width: 40rem;
}

.hero__visual {
  order: -1;
}

@media (min-width: 960px) {
  .hero__visual {
    order: 0;
  }
}

.hero__title {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}

.hero__primary {
  color: var(--color-primary);
}

.hero__accent {
  color: var(--color-cta);
}

.hero__desc {
  font-size: 1.125rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 32rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.benefits {
  padding-block: 2rem 3rem;
  border-block: 1.5px solid var(--color-border);
}

.benefits__list {
  list-style: none;
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .benefits__list {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

.benefits__item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.benefits__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  color: var(--color-cta);
}

.benefits__title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.benefits__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.tools {
  padding-block: 3rem 4rem;
}

.tools__header {
  margin-bottom: 2rem;
}

.tools__title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.375rem;
}

.tools__subtitle {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.tools__grid {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .tools__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
