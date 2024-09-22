import { Funcoes } from '../models/Funcoes.model';
import { Pessoa } from '../models/Pessoa.model';

type LocalStorageState = {
    pessoas: Pessoa[];
    funcoes: Funcoes[];
};

export type LocalStorageStateKey = keyof LocalStorageState;

const getNewState = () => {
    const state: LocalStorageState = {
        pessoas: [],
        funcoes: [],
    };
    return JSON.stringify(state);
};

const stateKey = 'state';

const useLocalStorage = () => {
    const getFullLocalStorage = () => {
        let state = localStorage.getItem(stateKey);
        if (!state) {
            localStorage.setItem(stateKey, getNewState());
            state = localStorage.getItem(stateKey);
        }
        return JSON.parse(state!) as LocalStorageState;
    };

    const get = <T extends LocalStorageStateKey>(key: T): LocalStorageState[T] => {
        const state = getFullLocalStorage();
        return state[key];
    };

    const set = <T extends LocalStorageStateKey>(key: T, value: LocalStorageState[T]): void => {
        const state = getFullLocalStorage();
        state[key] = value;
        localStorage.setItem(stateKey, JSON.stringify(state));
    };

    return (
        { getFullLocalStorage, get, set }
    );
};

export default useLocalStorage;
