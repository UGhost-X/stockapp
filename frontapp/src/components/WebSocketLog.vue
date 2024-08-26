<template>
    <div>
      <h2>WebSocket TS Component Example</h2>
      <a-button type="primary" @click=sendMessage>
        send
      </a-button>
      <p v-if="message">Message from the server: {{ message }}</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  
  const props = defineProps({
    url:{default:'ws://localhost:8081/api/websocket/log/123',type:String},
    serverMessage:{type:String,default:""}
  })
    
  const message = ref<String | null>(null);
  let socket: WebSocket | null = null;
  
  const createWebSocket = () => {
    socket = new WebSocket(props.url);
  
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
  
    socket.onmessage = event => {
      message.value = event.data;
    };
  
    socket.onerror = error => {
      console.error('WebSocket error: ', error);
    };
  
    socket.onclose = () => {
      console.log('WebSocket closed');
    };
  };
  
  const sendMessage = () => {
      if (socket && socket.readyState === WebSocket.OPEN && !!props.serverMessage ) {
        socket.send(props.serverMessage);
        
      }
    };


  const closeWebSocket = () => {
    if (socket) {
      socket.close();
    }
  };
  
  onMounted(() => {
    createWebSocket();
  });
  
  onBeforeUnmount(() => {
    closeWebSocket();
  });
  
  </script>