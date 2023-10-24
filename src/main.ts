import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import * as VueRouter from 'vue-router';
// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const routes = [
    { path: '/', component: () => import('./pages/main.vue') },
    //{ path: '/', component: () => import('./pages/miauthCallback.vue') },
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

const vuetify = createVuetify({
    components,
    directives,
});

const app = createApp(App);
app.use(router);
app.use(vuetify);

router.isReady().then(() => {
    app.mount('#app');
    console.log(router.currentRoute);
    console.log(router.getRoutes());
});
