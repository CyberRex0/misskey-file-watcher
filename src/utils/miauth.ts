import { v4 as UUIDv4 } from 'uuid';

export function startMiAuth() {
    const host = window.prompt('Enter misskey host:');
    if (host === null) return;
    let url;
    try{
        url = new URL('https://' + host + '/');
    } catch (e) {
        alert('invalid host');
        return;
    }
    const sessionId = UUIDv4();
    const currentUrl = new URL(location.href);
    const callbackUrl = `${currentUrl.origin}/#/miauth-callback`;
    location.href = `https://${url?.host}/miauth/${sessionId}?name=misskey-file-watcher&callback=${encodeURIComponent(callbackUrl)}`;
}