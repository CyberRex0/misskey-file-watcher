import { get as idbKVGet} from 'idb-keyval';

interface ConfigT {
    host: string | undefined;
    token: string | undefined;
}

const config: ConfigT = {
    host: await idbKVGet('host'),
    token: await idbKVGet('token'),
};

export default config;