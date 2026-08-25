import { ScheduleConfig } from "./ScheduleConfig.model";

export enum ScheduleStatus {
    RASCUNHO = 'RASCUNHO',
    FINALIZADA = 'FINALIZADA',
}

export type Assignment = {
    funcaoId: number;
    posicaoId: number | null;
    pessoaId: number | null;
    manual: boolean;
};

export type ScheduleDay = {
    data: string;
    especial: boolean;
    specialWeekId?: number;
    specialWeekNome?: string;
    atribuicoes: Assignment[];
};

export type Schedule = {
    id: number;
    nome: string;
    dataInicio: string;
    dataFim: string;
    funcoesIds: number[];
    dias: ScheduleDay[];
    scheduleConfig: Pick<ScheduleConfig, 'diasSemana'>;
    status: ScheduleStatus;
    criadoEm: string;
    atualizadoEm: string;
};
