<template>
    <div style="margin: 4px">
        <div class="control" style="margin: 4px;">
            <v-btn color="red" @click="resetConfig">reset</v-btn>
            <v-btn @click="reloadPage">reload</v-btn>
            <v-btn @click="toggleUpdateSec">Update: {{ updateSec }}s</v-btn>
            <v-btn @click="helpDialog = true">help</v-btn>
            <span>ver{{ packagejson.version }}</span>
            <v-checkbox label="Ignore sensitive" v-model="ignoreSensitive"/>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <div class="container" v-for="file in files" :key="file.id">
                <a :href="'https://' + config.host + '/admin/file/' + file.id" target="_blank"><img class="file" :src="file.thumbnailUrl" :style="{ filter: !ignoreSensitive && file.isSensitive ? (sensitiveState[file.id]!==false ? 'blur(10px)' : 'none') : 'none' }"/></a>
                <span v-if="file.isSensitive" class="file-text nsfw-label"><strong>Sensitive</strong></span>
                <span v-if="!ignoreSensitive && file.isSensitive && (sensitiveState[file.id]===true || sensitiveState[file.id] === undefined)" class="file-text nsfw-toggle" @click="sensitiveState[file.id] = false"><v-icon icon="mdi-eye-off"/></span>
                <span v-if="!ignoreSensitive && file.isSensitive && (sensitiveState[file.id]===false)" class="file-text nsfw-toggle" @click="sensitiveState[file.id] = true"><v-icon icon="mdi-eye-outline"/></span>
            </div>
        </div>
    </div>

    <v-dialog
      v-model="helpDialog"
      width="auto"
    >
      <v-card>
        <v-card-text>
            RESET: 認証情報をリセットします。<br>
            RELOAD: ページを更新します。<br>
            UPDATE: ◯S: ◯秒ごとに更新します。クリックすると更新するまでの秒数を変えられます。(5〜20秒、5秒間隔で変更可能)<br>
            HELP: このダイアログを表示します。<br>
            Ignore sensitive: すべての画像のセンシティブフラグを無視して表示します。<br>
            画像をクリックするとドライブの詳細画面に飛びます。
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="helpDialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import '@mdi/font/css/materialdesignicons.css';
import { onMounted, onUnmounted, ref, Ref } from 'vue';
import { set as idbKVSet, del as idbKVDel } from 'idb-keyval';
import { VBtn } from 'vuetify/components';
import config from '../config';
import mjs from 'misskey-js';
import packagejson from '../../package.json';

const files: Ref<mjs.entities.DriveFile[]> = ref([]);
let refreshTimer: any = null;
let lastFileId: string | null = null;
const sensitiveState: Ref<{ [key: string]: boolean }> = ref({});

let cnt = 0;

const ignoreSensitive = ref(false);
const helpDialog = ref(false);

const updateSec = ref(10);

onMounted(async () => {
    if(await checkConfig()) {
        await updateFiles();
        registTimer();
    }
});

onUnmounted(async () => {
    unregistTimer();
})

function reloadPage() {
    location.reload();
}

function registTimer() { refreshTimer = setInterval(updateFiles, 1000 * updateSec.value); }
function unregistTimer() { if (refreshTimer !== null) clearInterval(refreshTimer); }

function toggleUpdateSec() {
    let s = updateSec.value + 5;
    if (s > 25) {
        s = 5;
    }
    updateSec.value = s;
    unregistTimer();
    registTimer();
}

async function resetConfig() {
    if (window.confirm('認証情報をリセットします。よろしいですか？')) {
        unregistTimer();
        await idbKVDel('host');
        await idbKVDel('token');
        reloadPage();
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
        unregistTimer();
        alert('An error occured during fetching files');
        return;
    }
    const res: mjs.entities.DriveFile[] = await req.json();
    if (res.error) {
        unregistTimer();
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
    files.value = files.value.slice(0, 50);
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
    padding: 2px;
}

@media screen and (max-width: 500px) {
    .container {
        position: relative;
        width: 150px;
        height: 150px;
    }

    .file {
        width: 150px;
        height: 150px;
        object-fit: cover;
    }
}

.nsfw-label {
    top: 2%;
    left: 2%;
    background-color: rgba(255, 0, 0, 0.9);
    border-radius: 2px;
    color: white;
    animation: redflash 1s infinite;
}

.nsfw-toggle {
    top: 2%;
    right: 2%;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 2px;
    color: white;
}

.control * {
    margin-left: 4px;
    margin-right: 4px;
}

@keyframes redflash {
    0% {
        /*background-color: rgba(255, 0, 0, 0.9);*/
        opacity: 1;
    }

    50% {
        /*background-color: rgba(255, 0, 0, 0.4);*/
        opacity: 0.35;
    }
}
</style>