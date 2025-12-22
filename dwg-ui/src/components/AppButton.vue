<template>
    <button
      class="btn"
      :class="variantClass"
      :type="type"
      :disabled="disabled"
    >
      <slot />
    </button>
  </template>
  
  <script setup lang="ts">
  import { computed } from "vue";
  
  const props = withDefaults(defineProps<{
    variant?: "primary" | "success" | "danger" | "ghost";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>(), {
    variant: "primary",
    type: "button",
    disabled: false,
  });
  
  const variantClass = computed(() => `btn--${props.variant}`);
  </script>
  
  <style scoped>
  .btn{
    font-size: 18px;
    font-weight: 650;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background .12s ease, border-color .12s ease, transform .04s ease;
    user-select: none;
  }
  .btn:active{ transform: translateY(1px); }
  .btn:disabled{ opacity: .6; cursor: not-allowed; }
  
  .btn--primary{ background: var(--blue); color: #fff; }
  .btn--primary:hover{ background: var(--blue-h); }
  
  .btn--success{ background: var(--green); color: #fff; }
  .btn--success:hover{ background: var(--green-h); }
  
  .btn--danger{ background: var(--red); color: #fff; }
  .btn--danger:hover{ background: var(--red-h); }
  
  .btn--ghost{
    background: transparent;
    border-color: var(--border);
    color: var(--text);
  }
  .btn--ghost:hover{ background: #f3f4f6; }
  </style>
  