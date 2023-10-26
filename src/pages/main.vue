<template>
    <div style="margin: 4px;">
        <div style="margin: 4px;">
            <v-btn color="red" @click="resetConfig">reset</v-btn>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <div class="container" v-for="file in files" :key="file.id">
                <a :href="'https://' + config.host + '/admin/file/' + file.id"><img class="file" :src="file.thumbnailUrl"/></a>
                <span v-if="file.isSensitive" class="file-text" style="background-color: rgba(255, 0, 0, 0.8); border-radius: 2px; color: white;"><strong>NSFW</strong></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, Ref } from 'vue';
import { set as idbKVSet, del as idbKVDel } from 'idb-keyval';
import { VBtn } from 'vuetify/components';
import config from '../config';
import mjs from 'misskey-js';

const files: Ref<mjs.entities.DriveFile[]> = ref([]);
let refreshTimer: any = null;
let lastFileId: string | null = null;
const fileIds: string[] = [];

let cnt = 0;

onMounted(async () => {
    if(await checkConfig()) {
        await updateFiles();
        refreshTimer = setInterval(updateFiles, 1000 * 10);
    }
});

onUnmounted(async () => {
    if (refreshTimer !== null) clearInterval(refreshTimer);
})

async function resetConfig() {
    if (window.confirm('認証情報をリセットします。よろしいですか？')) {
        if (refreshTimer !== null) clearInterval(refreshTimer);
        await idbKVDel('host');
        await idbKVDel('token');
        location.reload();
    }
}

async function updateFiles() {
    const req = await fetch(`https://${config.host}/api/admin/drive/files`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ i: config.token, type: 'image/*', ...lastFileId!==null ? { sinceId: lastFileId }: {}}),
    });
    if (!req.ok) {
        clearInterval(refreshTimer);
        alert('An error occured during fetching files');
        return;
    }
    const res: mjs.entities.DriveFile[] = await req.json();
    if (res.error) {
        clearInterval(refreshTimer);
        alert(res.error.message);
        return;
    }
    
    if (res.length === 0) return;

    console.log(`[${cnt}] First Id: ${res[0].id}, Last Id: ${res[res.length - 1].id}, lastFileId: ${lastFileId}`);

    // sinceId未指定時は降順ソート　指定時は昇順ソートされている
    if (lastFileId) {
        lastFileId = res[res.length - 1].id;
        res.reverse();
    } else {
        lastFileId = res[0].id;
    }
    files.value.unshift(...res);
    files.value = files.value.slice(0, 100);
    cnt++;
}

async function checkConfig() {
    if (config.host === undefined || config.token === undefined) {
        const host = window.prompt('サーバーアドレスを入力(例: misskey.io)');
        if (host === null) return false;
        let url;
        try{
            url = new URL('https://' + host + '/');
        } catch (e) {
            alert('invalid host');
            return false;
        }
        const token = window.prompt('APIキーを入力');
        if (token === null) return false;
        await idbKVSet('host', url.host);
        await idbKVSet('token', token);
        config.host = url.host;
        config.token = token;
        return true;
    }
    return true;
}


</script>

<style scoped>

.container {
    position: relative;
    width: 200px;
    height: 200px;
}

.file {
    width: 200px;
    height: 200px;
    object-fit: cover;
}

.file-text {
    position: absolute;
    top: 2%;
    left: 2%;
    padding: 2px;
}
</style>