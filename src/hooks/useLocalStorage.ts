import { Funcao } from '../models/Funcao.model';
import { PdfConfig } from '../models/PdfConfig.model';
import { Schedule } from '../models/Schedule.model';
import { ScheduleConfig } from '../models/ScheduleConfig.model';
import { Pessoa } from '../models/Pessoa.model';
import { SpecialWeek } from '../models/SpecialWeek.model';
import { funcoes } from '../providers/FuncoesDataProvider';

export const CURRENT_STATE_VERSION = 9;

export type LocalStorageState = {
    version: number;
    pessoas: Pessoa[];
    funcoes: Funcao[];
    scheduleConfig: ScheduleConfig;
    specialWeeks: SpecialWeek[];
    schedules: Schedule[];
    pdfConfig: PdfConfig;
};

export type LocalStorageStateKey = keyof Omit<LocalStorageState, 'version'>;

export type LocalStorageEntityKey = 'pessoas' | 'funcoes' | 'specialWeeks' | 'schedules';

export const getDefaultPdfConfig = (): PdfConfig => ({
    titulo: 'EscalaFe',
    versiculo: '"Mas que todas as coisas ocorram com decência e ordem." - 1 Coríntios 14:40',
    corPrincipal: { r: 26, g: 53, b: 94 },
    corSecundaria: { r: 70, g: 110, b: 170 },
    corCabecalho: { r: 26, g: 53, b: 94 },
    corSemanaEspecial: { r: 181, g: 225, b: 255 },
    corLinhaPar: { r: 255, g: 255, b: 255 },
    corLinhaImpar: { r: 210, g: 225, b: 245 },
    corFonte: { r: 0, g: 0, b: 0 },
    corBorda: { r: 200, g: 200, b: 200 },
    quantidadeMeses: 1,
});

export const getDefaultScheduleConfig = (): ScheduleConfig => ({
    diasSemana: [0, 6],
    ultimaOrdemFuncoes: [],
});

const getNewState = (): LocalStorageState => ({
    version: CURRENT_STATE_VERSION,
    pessoas: [],
    funcoes: funcoes,
    scheduleConfig: getDefaultScheduleConfig(),
    specialWeeks: [],
    schedules: [],
    pdfConfig: getDefaultPdfConfig(),
});

const stateKey = 'state';

const migrateFuncao = (f: any): Funcao => ({
    id: f.id,
    nome: f.nome,
    status: f.status,
    posicoes: Array.isArray(f.posicoes) ? f.posicoes : [],
    ...(f.corPar ? { corPar: f.corPar } : {}),
    ...(f.corImpar ? { corImpar: f.corImpar } : {}),
    ...(f.corFonte ? { corFonte: f.corFonte } : {}),
    ...(f.designacaoSemana ? { designacaoSemana: true } : {}),
    ...(f.rotatividadeMaxima ? { rotatividadeMaxima: true } : {}),
});

const migratePdfConfig = (config: Partial<PdfConfig> | undefined): PdfConfig => ({
    ...getDefaultPdfConfig(),
    ...config,
});

const migrateScheduleConfig = (config: Partial<ScheduleConfig> | undefined): ScheduleConfig => ({
    ...getDefaultScheduleConfig(),
    ...config,
});

export const migrateState = (state: Partial<LocalStorageState>): LocalStorageState => {
    const migratedFuncoes = (state.funcoes ?? funcoes).map(migrateFuncao);

    return {
        version: CURRENT_STATE_VERSION,
        pessoas: (state.pessoas ?? []).map(p => ({
            ...p,
            funcoes: (p.funcoes ?? []).map(migrateFuncao),
        })),
        funcoes: migratedFuncoes,
        scheduleConfig: migrateScheduleConfig(state.scheduleConfig),
        specialWeeks: state.specialWeeks ?? [],
        schedules: state.schedules ?? [],
        pdfConfig: migratePdfConfig(state.pdfConfig),
    };
};

const useLocalStorage = () => {
    const getFullLocalStorage = (): LocalStorageState => {
        let state = localStorage.getItem(stateKey);
        if (!state) {
            localStorage.setItem(stateKey, JSON.stringify(getNewState()));
            state = localStorage.getItem(stateKey);
        }

        let parsed = JSON.parse(state!) as Partial<LocalStorageState>;
        if (parsed.version !== CURRENT_STATE_VERSION) {
            parsed = migrateState(parsed);
            localStorage.setItem(stateKey, JSON.stringify(parsed));
        }

        return parsed as LocalStorageState;
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

    const exportAll = (): LocalStorageState => {
        return getFullLocalStorage();
    };

    const importAll = (data: Partial<LocalStorageState>): void => {
        const migrated = migrateState(data);
        localStorage.setItem(stateKey, JSON.stringify(migrated));
    };

    return (
        { getFullLocalStorage, get, set, exportAll, importAll }
    );
};

export default useLocalStorage;
