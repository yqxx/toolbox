<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useTheme } from "@/composables/useTheme";

const { theme, toggleTheme } = useTheme();
const toolsAnchor = `${import.meta.env.BASE_URL}#tools`;
</script>

<template>
  <div class="app-layout">
    <header class="nav">
      <div class="container nav__inner">
        <RouterLink to="/" class="nav__brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-wrench-icon lucide-wrench"
          >
            <path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"
            />
          </svg>
          <span>Toolbox</span>
        </RouterLink>

        <nav class="nav__links" aria-label="主导航">
          <RouterLink to="/" class="nav__link">首页</RouterLink>
          <a :href="toolsAnchor" class="nav__link">工具</a>
        </nav>

        <button
          class="btn-ghost nav__theme"
          :aria-label="theme === 'light' ? '切换深色模式' : '切换浅色模式'"
          @click="toggleTheme"
        >
          <svg
            v-if="theme === 'light'"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg
            v-else
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </button>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="container footer__inner">
        <p class="footer__copy">Toolbox — 在线工具箱</p>
        <p class="footer__note">纯前端运行，数据不上传服务器</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1.5px solid var(--color-border);
}

.nav__inner {
  display: flex;
  align-items: center;
  height: var(--nav-height);
  gap: 1.5rem;
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: opacity var(--transition);
}

.nav__brand:hover {
  opacity: 0.8;
}

.nav__links {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.nav__link {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    color var(--transition),
    background-color var(--transition);
}

.nav__link:hover,
.nav__link.router-link-active {
  color: var(--color-text);
  background: var(--color-surface);
}

.nav__theme {
  margin-left: 0.5rem;
}

.main {
  flex: 1;
}

.footer {
  border-top: 1.5px solid var(--color-border);
  padding-block: 2rem;
}

.footer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.footer__copy {
  font-size: 0.875rem;
  font-weight: 600;
}

.footer__note {
  font-size: 0.8125rem;
  color: var(--color-text-subtle);
}
</style>
