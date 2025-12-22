<template>
    <div class="card">
      <div v-if="title" class="card__title">{{ title }}</div>
      <div class="card__content">
        <slot />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{ title?: string }>();
  </script>
  
  <style scoped>
  .card{
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 14px;
  }
  .card__title{
    font-size: var(--fs-lg);
    font-weight: 750;
    margin-bottom: 10px;
  }
  .card__content{
    font-size: var(--fs-base);
  }
  </style>
  