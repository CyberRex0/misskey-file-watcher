<template>
    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        <div v-for="file in files" :key="file.id">
            <a :href="'https://' + config.host + '/admin/file/' + file.id"><img class="file" :src="file.thumbnailUrl"/></a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, Ref } from 'vue';
import { set as idbKVSet, update } from 'idb-keyval';
import config from '../config';
import mjs from 'misskey-js';

const files: Ref<mjs.entities.DriveFile[]> = ref([]);
let refreshTimer: any = null;
let lastFileId: string | null = null;
const fileIds: string[] = [];

onMounted(async () => {
    if(await checkConfig()) {
        await updateFiles();
        refreshTimer = setInterval(updateFiles, 1000 * 10);
    }
});

onUnmounted(async () => {
    if (refreshTimer !== null) clearInterval(refreshTimer);
})

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
    console.log(res);
    const res2 = res.filter((v) => !fileIds.includes(v.id));
    res2.forEach((v) => fileIds.push(v.id));
    console.log(fileIds);
    lastFileId = res2[0].id;
    files.value.unshift(...res);
    files.value = files.value.slice(0, 100);
}

async function checkConfig() {
    if (config.host === undefined || config.token === undefined) {
        const host = window.prompt('Enter host name:');
        if (host === null) return false;
        let url;
        try{
            url = new URL('https://' + host + '/');
        } catch (e) {
            alert('invalid host');
            return false;
        }
        const token = window.prompt('Enter API Token:');
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
.file {
    width: 200px;
    height: 200px;
    object-fit: cover;
}
</style>